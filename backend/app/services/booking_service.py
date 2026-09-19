import secrets
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, not_
from sqlalchemy.orm import selectinload
import redis.asyncio as aioredis
import structlog

from app.models.booking import Booking, BookingEvent, BookingStatus, BookingEventType, VALID_TRANSITIONS
from app.models.parking import ParkingSpace, ParkingLocation
from app.models.user import User
from app.core.exceptions import (
    BookingConflictError, BookingStateError, NotFoundError, ForbiddenError, ValidationError
)
from app.core.config import settings
from app.services.pricing_service import PricingService

logger = structlog.get_logger(__name__)


def _generate_booking_ref() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = random.randint(100000, 999999)
    return f"PKX-{today}-{suffix}"


class BookingService:

    @staticmethod
    async def create_hold(
        db: AsyncSession,
        redis: aioredis.Redis,
        driver: User,
        space_id: UUID,
        vehicle_id: UUID,
        start_time: datetime,
        end_time: datetime,
    ) -> Booking:
        """
        Create a booking hold with double-booking protection.
        Uses Redis lock + PostgreSQL SELECT FOR UPDATE.
        """
        now = datetime.now(timezone.utc)

        # Validate times
        if start_time <= now:
            raise ValidationError("Booking must start in the future")
        duration_hours = (end_time - start_time).total_seconds() / 3600
        if duration_hours > settings.MAX_BOOKING_HOURS:
            raise ValidationError(f"Booking cannot exceed {settings.MAX_BOOKING_HOURS} hours")
        if duration_hours <= 0:
            raise ValidationError("end_time must be after start_time")

        # Validate vehicle belongs to driver
        from app.models.vehicle import Vehicle
        vehicle_result = await db.execute(
            select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.owner_id == driver.id, Vehicle.is_active == True)
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if not vehicle:
            raise NotFoundError("Vehicle")

        # Redis lock key: space + date window (prevent concurrent reservation attempts)
        slot_key = f"{start_time.strftime('%Y%m%d%H%M')}_{end_time.strftime('%Y%m%d%H%M')}"
        lock_key = f"reservation_lock:{space_id}:{slot_key}"

        # Try to acquire Redis lock (30-second window to prevent races)
        acquired = await redis.set(lock_key, str(driver.id), nx=True, ex=30)
        if not acquired:
            raise BookingConflictError("This slot is being reserved by another user. Please try again.")

        try:
            # PostgreSQL transaction with FOR UPDATE lock
            space_result = await db.execute(
                select(ParkingSpace)
                .where(ParkingSpace.id == space_id, ParkingSpace.is_active == True)
                .with_for_update()
            )
            space = space_result.scalar_one_or_none()
            if not space:
                raise NotFoundError("ParkingSpace")

            # Check for overlapping bookings
            overlap_result = await db.execute(
                select(Booking.id).where(
                    and_(
                        Booking.space_id == space_id,
                        Booking.status.in_([
                            BookingStatus.HELD,
                            BookingStatus.PAYMENT_PENDING,
                            BookingStatus.CONFIRMED,
                            BookingStatus.CHECKED_IN,
                        ]),
                        not_(
                            or_(
                                Booking.end_time <= start_time,
                                Booking.start_time >= end_time,
                            )
                        ),
                    )
                )
            )
            existing = overlap_result.first()
            if existing:
                raise BookingConflictError("This parking space is already booked for the requested time")

            # Get location for pricing
            location_result = await db.execute(
                select(ParkingLocation).where(ParkingLocation.id == space.location_id)
            )
            location = location_result.scalar_one()

            # Calculate price
            price_calc = await PricingService.calculate_price(
                db=db,
                location=location,
                start_time=start_time,
                end_time=end_time,
            )

            hold_expires_at = now + timedelta(minutes=settings.BOOKING_HOLD_MINUTES)

            booking = Booking(
                booking_ref=_generate_booking_ref(),
                driver_id=driver.id,
                space_id=space_id,
                vehicle_id=vehicle_id,
                status=BookingStatus.HELD,
                start_time=start_time,
                end_time=end_time,
                base_price=price_calc["base_price"],
                pricing_multiplier=price_calc["multiplier"],
                total_price=price_calc["total_price"],
                hold_expires_at=hold_expires_at,
                qr_token=secrets.token_urlsafe(32),
            )
            db.add(booking)
            await db.flush()

            # Record event
            event = BookingEvent(
                booking_id=booking.id,
                event_type=BookingEventType.HELD,
                actor_id=driver.id,
                metadata_={"price_breakdown": price_calc},
            )
            db.add(event)

            logger.info("booking_held", booking_ref=booking.booking_ref, space_id=str(space_id), driver_id=str(driver.id))

            # Extend Redis lock to hold duration
            await redis.expire(lock_key, settings.BOOKING_HOLD_MINUTES * 60)

            return booking

        except (BookingConflictError, NotFoundError, ValidationError):
            # Release lock on known errors
            await redis.delete(lock_key)
            raise
        except Exception as e:
            await redis.delete(lock_key)
            logger.error("booking_hold_error", error=str(e))
            raise

    @staticmethod
    async def transition_status(
        db: AsyncSession,
        booking: Booking,
        new_status: BookingStatus,
        actor: User,
        event_type: BookingEventType,
        metadata: Optional[dict] = None,
    ) -> Booking:
        allowed = VALID_TRANSITIONS.get(booking.status, set())
        if new_status not in allowed:
            raise BookingStateError(
                f"Cannot transition from {booking.status.value} to {new_status.value}"
            )
        booking.status = new_status
        event = BookingEvent(
            booking_id=booking.id,
            event_type=event_type,
            actor_id=actor.id if actor else None,
            metadata_=metadata or {},
        )
        db.add(booking)
        db.add(event)
        return booking

    @staticmethod
    async def confirm_booking(
        db: AsyncSession, booking_id: UUID, payment_id: str, actor: User
    ) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id).with_for_update()
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        if booking.status not in (BookingStatus.HELD, BookingStatus.PAYMENT_PENDING):
            raise BookingStateError(f"Cannot confirm booking in state {booking.status.value}")

        booking.status = BookingStatus.CONFIRMED
        event = BookingEvent(
            booking_id=booking.id,
            event_type=BookingEventType.CONFIRMED,
            actor_id=actor.id,
            metadata_={"payment_id": payment_id},
        )
        db.add(booking)
        db.add(event)

        logger.info("booking_confirmed", booking_ref=booking.booking_ref, payment_id=payment_id)
        return booking

    @staticmethod
    async def check_in(
        db: AsyncSession, redis: aioredis.Redis, qr_token: Optional[str], booking_id: Optional[UUID], security_user: User
    ) -> Booking:
        if qr_token:
            result = await db.execute(
                select(Booking).where(Booking.qr_token == qr_token).with_for_update()
            )
        elif booking_id:
            result = await db.execute(
                select(Booking).where(Booking.id == booking_id).with_for_update()
            )
        else:
            raise ValidationError("Provide qr_token or booking_id")

        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        if booking.status != BookingStatus.CONFIRMED:
            raise BookingStateError(f"Cannot check in booking with status {booking.status.value}")

        now = datetime.now(timezone.utc)
        if now > booking.end_time:
            raise ValidationError("Booking has already expired")

        booking.status = BookingStatus.CHECKED_IN
        booking.actual_check_in = now
        event = BookingEvent(
            booking_id=booking.id,
            event_type=BookingEventType.CHECKED_IN,
            actor_id=security_user.id,
            metadata_={"check_in_time": now.isoformat()},
        )
        db.add(booking)
        db.add(event)

        logger.info("booking_checked_in", booking_ref=booking.booking_ref, by=str(security_user.id))
        return booking

    @staticmethod
    async def check_out(db: AsyncSession, booking_id: UUID, actor: User) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id).with_for_update()
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        if booking.status != BookingStatus.CHECKED_IN:
            raise BookingStateError(f"Cannot check out booking with status {booking.status.value}")

        now = datetime.now(timezone.utc)
        booking.status = BookingStatus.COMPLETED
        booking.actual_check_out = now

        # Check for overstay
        overstay_minutes = 0
        if now > booking.end_time:
            overstay_minutes = int((now - booking.end_time).total_seconds() / 60)

        event = BookingEvent(
            booking_id=booking.id,
            event_type=BookingEventType.CHECKED_OUT,
            actor_id=actor.id,
            metadata_={"check_out_time": now.isoformat(), "overstay_minutes": overstay_minutes},
        )
        db.add(booking)
        db.add(event)

        logger.info("booking_checked_out", booking_ref=booking.booking_ref, overstay_minutes=overstay_minutes)
        return booking

    @staticmethod
    async def cancel(
        db: AsyncSession, booking_id: UUID, actor: User, reason: Optional[str] = None
    ) -> Booking:
        result = await db.execute(
            select(Booking).where(Booking.id == booking_id).with_for_update()
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        # Drivers can only cancel their own bookings
        from app.models.user import UserRole
        if actor.role == UserRole.DRIVER and booking.driver_id != actor.id:
            raise ForbiddenError("Cannot cancel another driver's booking")

        if booking.status not in VALID_TRANSITIONS or BookingStatus.CANCELLED not in VALID_TRANSITIONS[booking.status]:
            raise BookingStateError(f"Cannot cancel booking in state {booking.status.value}")

        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_by = actor.id

        event = BookingEvent(
            booking_id=booking.id,
            event_type=BookingEventType.CANCELLED,
            actor_id=actor.id,
            metadata_={"reason": reason},
        )
        db.add(booking)
        db.add(event)
        return booking

    @staticmethod
    async def get_booking(db: AsyncSession, booking_id: UUID, actor: User) -> Booking:
        result = await db.execute(
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                selectinload(Booking.space).selectinload(ParkingSpace.location),
                selectinload(Booking.vehicle),
                selectinload(Booking.events),
                selectinload(Booking.payment),
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")

        from app.models.user import UserRole
        if actor.role == UserRole.DRIVER and booking.driver_id != actor.id:
            raise ForbiddenError("Access denied")

        return booking

    @staticmethod
    async def get_driver_bookings(db: AsyncSession, driver_id: UUID, page: int = 1, page_size: int = 20):
        offset = (page - 1) * page_size
        result = await db.execute(
            select(Booking)
            .where(Booking.driver_id == driver_id)
            .options(
                selectinload(Booking.space).selectinload(ParkingSpace.location).selectinload(ParkingLocation.images),
                selectinload(Booking.vehicle),
            )
            .order_by(Booking.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all())

    @staticmethod
    async def validate_qr(db: AsyncSession, qr_token: str) -> Booking:
        result = await db.execute(
            select(Booking)
            .where(Booking.qr_token == qr_token)
            .options(
                selectinload(Booking.space).selectinload(ParkingSpace.location),
                selectinload(Booking.vehicle),
                selectinload(Booking.driver),
            )
        )
        booking = result.scalar_one_or_none()
        if not booking:
            raise NotFoundError("Booking")
        return booking

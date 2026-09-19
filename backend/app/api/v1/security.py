from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from fastapi import APIRouter
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SecurityOnly, DB, Redis
from app.services.booking_service import BookingService
from app.services.notification_service import NotificationService
from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingSpace, ParkingLocation
from app.models.security_staff import SecurityStaff
from app.models.user import UserRole
from app.schemas.booking import CheckInRequest, CheckOutRequest
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter()


def _security_booking_dict(booking) -> dict:
    d = {
        "id": str(booking.id),
        "booking_ref": booking.booking_ref,
        "status": booking.status,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "actual_check_in": booking.actual_check_in.isoformat() if booking.actual_check_in else None,
        "qr_token": booking.qr_token,
    }
    if hasattr(booking, "driver") and booking.driver:
        d["driver"] = {"id": str(booking.driver.id), "full_name": booking.driver.full_name, "phone": booking.driver.phone}
    if hasattr(booking, "vehicle") and booking.vehicle:
        d["vehicle"] = {"plate_number": booking.vehicle.plate_number, "make": booking.vehicle.make, "model": booking.vehicle.model}
    if hasattr(booking, "space") and booking.space:
        d["space"] = {"space_number": booking.space.space_number, "floor": booking.space.floor}
    return d


@router.post("/validate-qr")
async def validate_qr(data: CheckInRequest, current_user: SecurityOnly, db: DB):
    if not data.qr_token and not data.booking_id:
        from app.core.exceptions import ValidationError
        raise ValidationError("Provide qr_token or booking_id")

    try:
        if data.qr_token:
            booking = await BookingService.validate_qr(db, data.qr_token)
        else:
            booking = await BookingService.get_booking(db, UUID(data.booking_id), current_user)

        now = datetime.now(timezone.utc)
        issues = []
        if booking.status == BookingStatus.CONFIRMED:
            if now > booking.end_time:
                issues.append("Booking time has expired")
            return {
                "valid": len(issues) == 0,
                "booking": _security_booking_dict(booking),
                "issues": issues,
            }
        elif booking.status == BookingStatus.CHECKED_IN:
            return {"valid": False, "booking": _security_booking_dict(booking), "issues": ["Already checked in"]}
        else:
            return {"valid": False, "booking": _security_booking_dict(booking), "issues": [f"Invalid status: {booking.status.value}"]}
    except NotFoundError:
        return {"valid": False, "booking": None, "issues": ["Booking not found"]}


@router.post("/check-in")
async def check_in(data: CheckInRequest, current_user: SecurityOnly, db: DB, redis: Redis):
    booking = await BookingService.check_in(
        db=db, redis=redis,
        qr_token=data.qr_token,
        booking_id=UUID(data.booking_id) if data.booking_id else None,
        security_user=current_user,
    )
    await NotificationService.check_in(db, booking)
    return {"message": "Checked in successfully", "booking_ref": booking.booking_ref, "status": booking.status}


@router.post("/check-out")
async def check_out(data: CheckOutRequest, current_user: CurrentUser, db: DB):
    booking = await BookingService.check_out(db, UUID(data.booking_id), current_user)
    await NotificationService.check_out(db, booking)
    return {"message": "Checked out successfully", "booking_ref": booking.booking_ref, "status": booking.status}


@router.get("/expected-arrivals")
async def expected_arrivals(current_user: SecurityOnly, db: DB):
    """Upcoming CONFIRMED bookings for security staff's assigned location."""
    # Find security's location
    staff_result = await db.execute(
        select(SecurityStaff).where(SecurityStaff.user_id == current_user.id, SecurityStaff.is_active == True)
    )
    staff = staff_result.scalar_one_or_none()
    if not staff:
        return {"items": []}

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Booking)
        .join(ParkingSpace, Booking.space_id == ParkingSpace.id)
        .where(
            ParkingSpace.location_id == staff.location_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time >= now,
        )
        .options(selectinload(Booking.driver), selectinload(Booking.vehicle), selectinload(Booking.space))
        .order_by(Booking.start_time.asc())
        .limit(50)
    )
    bookings = result.scalars().all()
    return {"items": [_security_booking_dict(b) for b in bookings]}


@router.get("/current-parked")
async def current_parked(current_user: SecurityOnly, db: DB):
    staff_result = await db.execute(
        select(SecurityStaff).where(SecurityStaff.user_id == current_user.id, SecurityStaff.is_active == True)
    )
    staff = staff_result.scalar_one_or_none()
    if not staff:
        return {"items": []}

    result = await db.execute(
        select(Booking)
        .join(ParkingSpace, Booking.space_id == ParkingSpace.id)
        .where(
            ParkingSpace.location_id == staff.location_id,
            Booking.status == BookingStatus.CHECKED_IN,
        )
        .options(selectinload(Booking.driver), selectinload(Booking.vehicle), selectinload(Booking.space))
        .order_by(Booking.actual_check_in.asc())
        .limit(50)
    )
    bookings = result.scalars().all()
    return {"items": [_security_booking_dict(b) for b in bookings]}


@router.get("/recent-events")
async def recent_events(current_user: SecurityOnly, db: DB):
    from app.models.booking import BookingEvent, BookingEventType
    staff_result = await db.execute(
        select(SecurityStaff).where(SecurityStaff.user_id == current_user.id)
    )
    staff = staff_result.scalar_one_or_none()
    if not staff:
        return {"items": []}

    result = await db.execute(
        select(BookingEvent)
        .join(Booking, BookingEvent.booking_id == Booking.id)
        .join(ParkingSpace, Booking.space_id == ParkingSpace.id)
        .where(
            ParkingSpace.location_id == staff.location_id,
            BookingEvent.event_type.in_([BookingEventType.CHECKED_IN, BookingEventType.CHECKED_OUT]),
        )
        .order_by(BookingEvent.created_at.desc())
        .limit(30)
    )
    events = result.scalars().all()
    return {"items": [
        {"id": str(e.id), "event_type": e.event_type, "booking_id": str(e.booking_id), "created_at": e.created_at.isoformat()}
        for e in events
    ]}

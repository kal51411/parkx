import asyncio
from datetime import datetime, timezone, timedelta
import structlog

from app.workers.celery_app import celery_app
from app.core.config import settings

logger = structlog.get_logger(__name__)


def _run_async(coro):
    """Run async coroutine in a new event loop for Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.workers.tasks.expire_held_bookings")
def expire_held_bookings():
    """Expire bookings in HELD/PAYMENT_PENDING state past their hold_expires_at."""
    async def _expire():
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from sqlalchemy import select, and_
        from app.models.booking import Booking, BookingStatus, BookingEvent, BookingEventType
        import redis.asyncio as aioredis
        import json

        engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

        now = datetime.now(timezone.utc)
        async with Session() as db:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.status.in_([BookingStatus.HELD, BookingStatus.PAYMENT_PENDING]),
                        Booking.hold_expires_at <= now,
                    )
                )
            )
            expired = result.scalars().all()
            count = 0
            for booking in expired:
                booking.status = BookingStatus.EXPIRED
                event = BookingEvent(
                    booking_id=booking.id,
                    event_type=BookingEventType.EXPIRED,
                    metadata_={"reason": "Hold time exceeded", "expired_at": now.isoformat()},
                )
                db.add(booking)
                db.add(event)

                # Publish real-time update
                space_result = await db.execute(
                    select(__import__('app.models.parking', fromlist=['ParkingSpace']).ParkingSpace)
                    .where(__import__('app.models.parking', fromlist=['ParkingSpace']).ParkingSpace.id == booking.space_id)
                )
                space = space_result.scalar_one_or_none()
                if space:
                    await redis.publish(
                        f"parking:availability:{str(space.location_id)}",
                        json.dumps({"event": "BOOKING_EXPIRED", "booking_id": str(booking.id)})
                    )
                count += 1

            await db.commit()
            logger.info("expired_bookings", count=count)

        await engine.dispose()
        await redis.aclose()

    _run_async(_expire())


@celery_app.task(name="app.workers.tasks.detect_no_shows")
def detect_no_shows():
    """Mark CONFIRMED bookings as NO_SHOW if grace period has passed."""
    async def _detect():
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from sqlalchemy import select, and_
        from app.models.booking import Booking, BookingStatus, BookingEvent, BookingEventType

        engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        now = datetime.now(timezone.utc)
        grace = timedelta(minutes=settings.NO_SHOW_GRACE_PERIOD_MINUTES)
        cutoff = now - grace

        async with Session() as db:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.status == BookingStatus.CONFIRMED,
                        Booking.start_time <= cutoff,
                        Booking.end_time >= now,  # Still within booking window
                    )
                )
            )
            no_shows = result.scalars().all()
            count = 0
            for booking in no_shows:
                booking.status = BookingStatus.NO_SHOW
                event = BookingEvent(
                    booking_id=booking.id,
                    event_type=BookingEventType.NO_SHOW,
                    metadata_={"grace_period_minutes": settings.NO_SHOW_GRACE_PERIOD_MINUTES},
                )
                db.add(booking)
                db.add(event)
                count += 1

            await db.commit()
            logger.info("no_shows_detected", count=count)

        await engine.dispose()

    _run_async(_detect())


@celery_app.task(name="app.workers.tasks.send_upcoming_reminders")
def send_upcoming_reminders():
    """Send notifications for bookings starting in ~30 minutes."""
    async def _remind():
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from sqlalchemy import select, and_
        from app.models.booking import Booking, BookingStatus
        from app.models.notification import Notification, NotificationType

        engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
        Session = async_sessionmaker(engine, expire_on_commit=False)
        now = datetime.now(timezone.utc)
        remind_window_start = now + timedelta(minutes=25)
        remind_window_end = now + timedelta(minutes=35)

        async with Session() as db:
            result = await db.execute(
                select(Booking).where(
                    and_(
                        Booking.status == BookingStatus.CONFIRMED,
                        Booking.start_time >= remind_window_start,
                        Booking.start_time <= remind_window_end,
                    )
                )
            )
            bookings = result.scalars().all()
            count = 0
            for booking in bookings:
                notif = Notification(
                    user_id=booking.driver_id,
                    type=NotificationType.PARKING_TIME_APPROACHING,
                    title="Parking starting soon ⏰",
                    body=f"Your booking {booking.booking_ref} starts in ~30 minutes.",
                    metadata_={"booking_id": str(booking.id)},
                )
                db.add(notif)
                count += 1

            await db.commit()
            logger.info("reminders_sent", count=count)

        await engine.dispose()

    _run_async(_remind())

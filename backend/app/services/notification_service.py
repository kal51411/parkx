from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType
from app.models.user import User


class NotificationService:

    @staticmethod
    async def send(
        db: AsyncSession,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        body: str,
        metadata: Optional[dict] = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            body=body,
            metadata_=metadata or {},
        )
        db.add(notification)
        return notification

    @staticmethod
    async def booking_confirmed(db: AsyncSession, booking) -> None:
        await NotificationService.send(
            db=db,
            user_id=booking.driver_id,
            notification_type=NotificationType.BOOKING_CONFIRMED,
            title="Booking Confirmed! ✅",
            body=f"Your booking {booking.booking_ref} has been confirmed.",
            metadata={"booking_id": str(booking.id), "booking_ref": booking.booking_ref},
        )

    @staticmethod
    async def booking_cancelled(db: AsyncSession, booking) -> None:
        await NotificationService.send(
            db=db,
            user_id=booking.driver_id,
            notification_type=NotificationType.BOOKING_CANCELLED,
            title="Booking Cancelled",
            body=f"Your booking {booking.booking_ref} has been cancelled.",
            metadata={"booking_id": str(booking.id)},
        )

    @staticmethod
    async def check_in(db: AsyncSession, booking) -> None:
        await NotificationService.send(
            db=db,
            user_id=booking.driver_id,
            notification_type=NotificationType.CHECK_IN,
            title="Checked In 🚗",
            body=f"You have checked in for booking {booking.booking_ref}.",
            metadata={"booking_id": str(booking.id)},
        )

    @staticmethod
    async def check_out(db: AsyncSession, booking) -> None:
        await NotificationService.send(
            db=db,
            user_id=booking.driver_id,
            notification_type=NotificationType.CHECK_OUT,
            title="Checked Out",
            body=f"You have checked out. Thanks for using ParkX!",
            metadata={"booking_id": str(booking.id)},
        )

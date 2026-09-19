import uuid
import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin


class NotificationType(str, enum.Enum):
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED"
    BOOKING_CANCELLED = "BOOKING_CANCELLED"
    PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"
    PARKING_TIME_APPROACHING = "PARKING_TIME_APPROACHING"
    BOOKING_EXPIRED = "BOOKING_EXPIRED"
    NO_SHOW = "NO_SHOW"
    CHECK_IN = "CHECK_IN"
    CHECK_OUT = "CHECK_OUT"
    REVIEW_REQUEST = "REVIEW_REQUEST"
    LISTING_VERIFIED = "LISTING_VERIFIED"
    LISTING_REJECTED = "LISTING_REJECTED"
    NEW_BOOKING = "NEW_BOOKING"


class Notification(Base, UUIDMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType, name="notification_type"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default="now()", nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

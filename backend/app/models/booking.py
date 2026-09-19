import uuid
import enum
import secrets
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Boolean, Float, Numeric, Text, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    HELD = "HELD"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"
    DISPUTED = "DISPUTED"


VALID_TRANSITIONS: dict[BookingStatus, set[BookingStatus]] = {
    BookingStatus.PENDING: {BookingStatus.HELD, BookingStatus.CANCELLED},
    BookingStatus.HELD: {BookingStatus.PAYMENT_PENDING, BookingStatus.EXPIRED, BookingStatus.CANCELLED},
    BookingStatus.PAYMENT_PENDING: {BookingStatus.CONFIRMED, BookingStatus.EXPIRED, BookingStatus.CANCELLED},
    BookingStatus.CONFIRMED: {BookingStatus.CHECKED_IN, BookingStatus.CANCELLED, BookingStatus.NO_SHOW, BookingStatus.DISPUTED},
    BookingStatus.CHECKED_IN: {BookingStatus.COMPLETED, BookingStatus.DISPUTED},
    BookingStatus.COMPLETED: {BookingStatus.DISPUTED},
    BookingStatus.CANCELLED: set(),
    BookingStatus.EXPIRED: set(),
    BookingStatus.NO_SHOW: {BookingStatus.DISPUTED},
    BookingStatus.DISPUTED: set(),
}


class BookingEventType(str, enum.Enum):
    CREATED = "CREATED"
    HELD = "HELD"
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    NO_SHOW = "NO_SHOW"
    DISPUTED = "DISPUTED"


class Booking(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bookings"

    booking_ref: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    driver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    space_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_spaces.id"), nullable=False, index=True
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False
    )
    status: Mapped[BookingStatus] = mapped_column(
        SAEnum(BookingStatus, name="booking_status"),
        nullable=False,
        default=BookingStatus.PENDING,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    actual_check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    pricing_multiplier: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    qr_token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True, default=lambda: secrets.token_urlsafe(32))
    hold_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    driver: Mapped["User"] = relationship("User", back_populates="bookings", foreign_keys=[driver_id])
    space: Mapped["ParkingSpace"] = relationship("ParkingSpace", back_populates="bookings")
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="bookings")
    events: Mapped[List["BookingEvent"]] = relationship("BookingEvent", back_populates="booking", lazy="select")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="booking", uselist=False, lazy="select")
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="booking", uselist=False, lazy="select")


class BookingEvent(Base, UUIDMixin):
    """Immutable audit trail for booking state changes."""
    __tablename__ = "booking_events"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type: Mapped[BookingEventType] = mapped_column(
        SAEnum(BookingEventType, name="booking_event_type"), nullable=False
    )
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="events")

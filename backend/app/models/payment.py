import uuid
import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Numeric, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"


class PaymentProvider(str, enum.Enum):
    RAZORPAY = "RAZORPAY"
    MOCK = "MOCK"


class Payment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "payments"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), unique=True, nullable=False, index=True
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        SAEnum(PaymentProvider, name="payment_provider"), nullable=False
    )
    provider_order_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    provider_payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provider_signature: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.PENDING
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    refund_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    refund_amount: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    refunded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True, default=dict)

    # Relationships
    booking: Mapped["Booking"] = relationship("Booking", back_populates="payment")

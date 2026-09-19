import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class VehicleType(str, enum.Enum):
    TWO_WHEELER = "TWO_WHEELER"
    CAR = "CAR"
    SUV = "SUV"
    VAN = "VAN"
    TRUCK = "TRUCK"


class Vehicle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "vehicles"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    plate_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    vehicle_type: Mapped[VehicleType] = mapped_column(
        SAEnum(VehicleType, name="vehicle_type"), nullable=False
    )
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="vehicles")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="vehicle", lazy="select")

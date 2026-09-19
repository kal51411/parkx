import uuid
import enum
from typing import Optional, List
from datetime import time
from sqlalchemy import Integer, Boolean, Time, Float, Numeric, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class PricingRuleType(str, enum.Enum):
    BASE = "BASE"
    PEAK = "PEAK"
    WEEKEND = "WEEKEND"
    DYNAMIC = "DYNAMIC"


class ParkingAvailability(Base, UUIDMixin, TimestampMixin):
    """Recurring weekly availability schedule for a parking space."""
    __tablename__ = "parking_availability"

    space_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_spaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 0=Monday, 6=Sunday, -1=every day
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False, default=-1)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    space: Mapped["ParkingSpace"] = relationship("ParkingSpace", back_populates="availability_schedules")


class PricingRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "pricing_rules"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_type: Mapped[PricingRuleType] = mapped_column(
        SAEnum(PricingRuleType, name="pricing_rule_type"), nullable=False
    )
    day_of_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    price_multiplier: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    flat_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    location: Mapped["ParkingLocation"] = relationship("ParkingLocation", back_populates="pricing_rules")

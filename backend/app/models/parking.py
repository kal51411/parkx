import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Float, Integer, Text, Numeric, Enum as SAEnum, ForeignKey, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.vehicle import VehicleType


class ParkingType(str, enum.Enum):
    OPEN = "OPEN"
    COVERED = "COVERED"
    BASEMENT = "BASEMENT"
    MULTILEVEL = "MULTILEVEL"
    STREET = "STREET"
    VALET = "VALET"


class ParkingStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    SUSPENDED = "SUSPENDED"
    REJECTED = "REJECTED"


class CancellationPolicy(str, enum.Enum):
    FLEXIBLE = "FLEXIBLE"
    MODERATE = "MODERATE"
    STRICT = "STRICT"


class SpaceStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


class ParkingLocation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "parking_locations"
    __table_args__ = (
        Index("idx_parking_geom", "geom", postgresql_using="gist"),
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    society_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("societies.id"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, default="Mumbai")
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    geom: Mapped[Optional[object]] = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    parking_type: Mapped[ParkingType] = mapped_column(
        SAEnum(ParkingType, name="parking_type"), nullable=False
    )
    status: Mapped[ParkingStatus] = mapped_column(
        SAEnum(ParkingStatus, name="parking_status"),
        nullable=False,
        default=ParkingStatus.PENDING_VERIFICATION,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    total_spaces: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    vehicle_types_allowed: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    amenities: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)
    operating_hours: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    cancellation_policy: Mapped[CancellationPolicy] = mapped_column(
        SAEnum(CancellationPolicy, name="cancellation_policy"),
        nullable=False,
        default=CancellationPolicy.MODERATE,
    )
    base_hourly_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    base_daily_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    average_rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_reviews: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_locations", foreign_keys=[owner_id])
    spaces: Mapped[List["ParkingSpace"]] = relationship("ParkingSpace", back_populates="location", lazy="select")
    images: Mapped[List["ParkingImage"]] = relationship("ParkingImage", back_populates="location", lazy="select")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="location", lazy="select")
    pricing_rules: Mapped[List["PricingRule"]] = relationship("PricingRule", back_populates="location", lazy="select")


class ParkingSpace(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "parking_spaces"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    space_number: Mapped[str] = mapped_column(String(20), nullable=False)
    floor: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    vehicle_type: Mapped[VehicleType] = mapped_column(
        SAEnum(VehicleType, name="vehicle_type"), nullable=False, default=VehicleType.CAR
    )
    is_covered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_ev_charging: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[SpaceStatus] = mapped_column(
        SAEnum(SpaceStatus, name="space_status"), nullable=False, default=SpaceStatus.AVAILABLE
    )

    # Relationships
    location: Mapped["ParkingLocation"] = relationship("ParkingLocation", back_populates="spaces")
    availability_schedules: Mapped[List["ParkingAvailability"]] = relationship("ParkingAvailability", back_populates="space", lazy="select")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="space", lazy="select")


class ParkingImage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "parking_images"

    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    location: Mapped["ParkingLocation"] = relationship("ParkingLocation", back_populates="images")

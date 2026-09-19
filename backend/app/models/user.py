import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserRole(str, enum.Enum):
    DRIVER = "DRIVER"
    PARKING_OWNER = "PARKING_OWNER"
    SOCIETY_ADMIN = "SOCIETY_ADMIN"
    SECURITY = "SECURITY"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role"), nullable=False, default=UserRole.DRIVER
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    vehicles: Mapped[List["Vehicle"]] = relationship("Vehicle", back_populates="owner", lazy="select")
    bookings: Mapped[List["Booking"]] = relationship("Booking", back_populates="driver", foreign_keys="Booking.driver_id", lazy="select")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", lazy="select")
    owned_locations: Mapped[List["ParkingLocation"]] = relationship("ParkingLocation", back_populates="owner", foreign_keys="ParkingLocation.owner_id", lazy="select")
    reviews: Mapped[List["Review"]] = relationship("Review", back_populates="driver", foreign_keys="Review.driver_id", lazy="select")
    security_assignment: Mapped[Optional["SecurityStaff"]] = relationship("SecurityStaff", back_populates="user", uselist=False, lazy="select")

import uuid
import enum
from typing import Optional, List
from sqlalchemy import String, Boolean, Integer, Text, UniqueConstraint, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class MemberRole(str, enum.Enum):
    ADMIN = "ADMIN"
    RESIDENT = "RESIDENT"
    STAFF = "STAFF"


class Society(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "societies"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Mumbai", nullable=False)
    admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    total_spaces: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    public_spaces: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    admin: Mapped["User"] = relationship("User", foreign_keys=[admin_id])
    members: Mapped[List["SocietyMember"]] = relationship("SocietyMember", back_populates="society", lazy="select")
    parking_locations: Mapped[List["ParkingLocation"]] = relationship("ParkingLocation", foreign_keys="ParkingLocation.society_id", lazy="select")


class SocietyMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "society_members"
    __table_args__ = (
        UniqueConstraint("society_id", "user_id", name="uq_society_member"),
    )

    society_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("societies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    member_role: Mapped[MemberRole] = mapped_column(
        SAEnum(MemberRole, name="member_role"), nullable=False, default=MemberRole.RESIDENT
    )

    # Relationships
    society: Mapped["Society"] = relationship("Society", back_populates="members")
    user: Mapped["User"] = relationship("User")

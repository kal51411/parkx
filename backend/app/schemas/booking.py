from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.booking import BookingStatus, BookingEventType


class BookingHoldRequest(BaseModel):
    space_id: str
    vehicle_id: str
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v: datetime, info) -> datetime:
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None


class BookingEventOut(BaseModel):
    id: str
    event_type: BookingEventType
    actor_id: Optional[str]
    metadata: Optional[dict]
    created_at: str

    model_config = {"from_attributes": True}


class BookingOut(BaseModel):
    id: str
    booking_ref: str
    driver_id: str
    space_id: str
    vehicle_id: str
    status: BookingStatus
    start_time: str
    end_time: str
    actual_check_in: Optional[str]
    actual_check_out: Optional[str]
    base_price: float
    pricing_multiplier: float
    total_price: float
    currency: str
    qr_token: str
    hold_expires_at: Optional[str]
    cancellation_reason: Optional[str]
    notes: Optional[str]
    created_at: str

    # Nested
    vehicle: Optional[dict] = None
    space: Optional[dict] = None
    parking_location: Optional[dict] = None
    events: Optional[list] = None

    model_config = {"from_attributes": True}


class CheckInRequest(BaseModel):
    qr_token: Optional[str] = None
    booking_id: Optional[str] = None


class CheckOutRequest(BaseModel):
    booking_id: str


class QRValidationResponse(BaseModel):
    valid: bool
    booking: Optional[BookingOut] = None
    error: Optional[str] = None

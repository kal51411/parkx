from typing import Optional
from pydantic import BaseModel, field_validator


class ReviewCreate(BaseModel):
    booking_id: str
    rating: int
    comment: str

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return v

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Comment must be at least 10 characters")
        return v.strip()


class ReviewOut(BaseModel):
    id: str
    booking_id: str
    driver_id: str
    location_id: str
    rating: int
    comment: str
    is_visible: bool
    owner_reply: Optional[str]
    created_at: str
    driver_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OwnerReplyRequest(BaseModel):
    reply: str

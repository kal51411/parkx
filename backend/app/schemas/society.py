from typing import Optional, List
from pydantic import BaseModel


class SocietyCreate(BaseModel):
    name: str
    address: str
    city: str = "Mumbai"
    total_spaces: int = 0
    public_spaces: int = 0
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class SocietyOut(BaseModel):
    id: str
    name: str
    address: str
    city: str
    admin_id: str
    total_spaces: int
    public_spaces: int
    is_active: bool
    contact_phone: Optional[str]
    contact_email: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


class SocietyAnalytics(BaseModel):
    total_spaces: int
    currently_occupied: int
    available: int
    occupancy_percentage: float
    today_revenue: float
    monthly_revenue: float
    total_bookings_today: int


class AddMemberRequest(BaseModel):
    user_id: str
    member_role: str = "RESIDENT"

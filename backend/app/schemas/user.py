from typing import Optional
from pydantic import BaseModel
from app.models.vehicle import VehicleType


class VehicleCreate(BaseModel):
    plate_number: str
    vehicle_type: VehicleType
    make: str
    model: str
    color: Optional[str] = None
    is_primary: bool = False


class VehicleOut(BaseModel):
    id: str
    owner_id: str
    plate_number: str
    vehicle_type: VehicleType
    make: str
    model: str
    color: Optional[str]
    is_primary: bool
    is_active: bool

    model_config = {"from_attributes": True}


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

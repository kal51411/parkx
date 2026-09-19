from typing import Optional, List, Any
from decimal import Decimal
from pydantic import BaseModel, field_validator
from app.models.parking import ParkingType, ParkingStatus, CancellationPolicy, SpaceStatus
from app.models.vehicle import VehicleType


class ParkingImageOut(BaseModel):
    id: str
    url: str
    caption: Optional[str]
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ParkingSpaceCreate(BaseModel):
    space_number: str
    floor: Optional[str] = None
    vehicle_type: VehicleType = VehicleType.CAR
    is_covered: bool = False
    has_ev_charging: bool = False


class ParkingSpaceOut(BaseModel):
    id: str
    location_id: str
    space_number: str
    floor: Optional[str]
    vehicle_type: VehicleType
    is_covered: bool
    has_ev_charging: bool
    is_active: bool
    status: SpaceStatus

    model_config = {"from_attributes": True}


class ParkingLocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    parking_type: ParkingType
    total_spaces: int
    vehicle_types_allowed: List[VehicleType] = [VehicleType.CAR]
    amenities: dict[str, bool] = {}
    operating_hours: Optional[dict[str, Any]] = None
    cancellation_policy: CancellationPolicy = CancellationPolicy.MODERATE
    base_hourly_price: Decimal
    base_daily_price: Optional[Decimal] = None

    @field_validator("latitude")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90 <= v <= 90):
            raise ValueError("Invalid latitude")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (-180 <= v <= 180):
            raise ValueError("Invalid longitude")
        return v

    @field_validator("base_hourly_price")
    @classmethod
    def validate_price(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Price must be positive")
        return v


class ParkingLocationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    parking_type: Optional[ParkingType] = None
    amenities: Optional[dict[str, bool]] = None
    operating_hours: Optional[dict[str, Any]] = None
    cancellation_policy: Optional[CancellationPolicy] = None
    base_hourly_price: Optional[Decimal] = None
    base_daily_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ParkingLocationOut(BaseModel):
    id: str
    owner_id: str
    society_id: Optional[str]
    name: str
    description: Optional[str]
    address: str
    city: str
    latitude: float
    longitude: float
    parking_type: ParkingType
    status: ParkingStatus
    is_active: bool
    total_spaces: int
    vehicle_types_allowed: Optional[List[str]]
    amenities: Optional[dict]
    operating_hours: Optional[dict]
    cancellation_policy: CancellationPolicy
    base_hourly_price: float
    base_daily_price: Optional[float]
    average_rating: float
    total_reviews: int
    is_demo: bool
    images: List[ParkingImageOut] = []
    spaces: Optional[List[ParkingSpaceOut]] = None

    model_config = {"from_attributes": True}


class ParkingSearchResult(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    parking_type: ParkingType
    status: ParkingStatus
    total_spaces: int
    available_spaces: int
    vehicle_types_allowed: Optional[List[str]]
    amenities: Optional[dict]
    base_hourly_price: float
    average_rating: float
    total_reviews: int
    primary_image_url: Optional[str]
    distance_m: Optional[float]
    relevance_score: Optional[float]
    is_demo: bool

    model_config = {"from_attributes": True}


class NearbySearchParams(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    vehicle_type: Optional[VehicleType] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    covered: Optional[bool] = None
    ev_charging: Optional[bool] = None
    verified_only: bool = False


class ParkingImageCreate(BaseModel):
    url: str
    caption: Optional[str] = None
    is_primary: bool = False


class AvailabilitySlotCreate(BaseModel):
    space_id: str
    day_of_week: int = -1  # -1 = every day
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"

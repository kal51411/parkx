from typing import Optional, List
from pydantic import BaseModel


class OwnerOverview(BaseModel):
    today_bookings: int
    today_revenue: float
    current_occupancy: int
    total_spaces: int
    occupancy_percentage: float
    available_spaces: int
    average_rating: float
    monthly_revenue: float
    cancellation_rate: float
    no_show_rate: float


class RevenueDataPoint(BaseModel):
    date: str
    revenue: float
    bookings: int


class OccupancyDataPoint(BaseModel):
    hour: int
    occupancy_percentage: float
    bookings: int


class DemandPrediction(BaseModel):
    location_id: str
    date: str
    predicted_demand: str  # LOW, MEDIUM, HIGH, VERY_HIGH
    confidence: float
    peak_hours: List[int]
    estimated_occupancy: float
    recommendation: str


class PricingRecommendation(BaseModel):
    current_price: float
    recommended_price: float
    multiplier: float
    reason: str
    demand_level: str
    occupancy_percentage: float

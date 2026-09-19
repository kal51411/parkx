from uuid import UUID
from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, OwnerOnly, DB
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/owner/overview")
async def owner_overview(current_user: OwnerOnly, db: DB):
    overview = await AnalyticsService.get_owner_overview(db, current_user.id)
    return overview


@router.get("/owner/revenue")
async def owner_revenue(current_user: OwnerOnly, db: DB, days: int = Query(30, ge=7, le=365)):
    data = await AnalyticsService.get_revenue_by_day(db, current_user.id, days)
    return {"items": [d.model_dump() for d in data]}


@router.get("/owner/occupancy")
async def owner_occupancy(current_user: OwnerOnly, db: DB):
    data = await AnalyticsService.get_occupancy_by_hour(db, current_user.id)
    return {"items": [d.model_dump() for d in data]}


@router.get("/demand-prediction/{location_id}")
async def demand_prediction(location_id: str, db: DB):
    prediction = await AnalyticsService.get_demand_prediction(db, UUID(location_id))
    return prediction


@router.get("/owner/peak-hours")
async def peak_hours(current_user: OwnerOnly, db: DB):
    data = await AnalyticsService.get_occupancy_by_hour(db, current_user.id)
    sorted_data = sorted(data, key=lambda x: x.bookings, reverse=True)
    return {"peak_hours": [d.hour for d in sorted_data[:5]], "data": [d.model_dump() for d in data]}

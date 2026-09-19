from datetime import datetime
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import asyncio
import json

from app.api.deps import CurrentUser, OwnerOnly, DB, AdminOnly
from app.services.parking_service import ParkingService
from app.schemas.parking import (
    ParkingLocationCreate, ParkingLocationUpdate, ParkingLocationOut,
    ParkingSpaceCreate, ParkingSpaceOut, ParkingImageCreate, AvailabilitySlotCreate,
)
from app.models.parking import ParkingSpace, ParkingImage
from app.models.availability import ParkingAvailability

router = APIRouter()


@router.get("/nearby")
async def search_nearby(
    db: DB,
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(5.0, ge=0.1, le=50.0),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    vehicle_type: Optional[str] = Query(None),
    price_min: Optional[float] = Query(None),
    price_max: Optional[float] = Query(None),
    covered: Optional[bool] = Query(None),
    ev_charging: Optional[bool] = Query(None),
    verified_only: bool = Query(False),
):
    st = datetime.fromisoformat(start_time) if start_time else None
    et = datetime.fromisoformat(end_time) if end_time else None
    results = await ParkingService.search_nearby(
        db=db, lat=latitude, lng=longitude, radius_km=radius_km,
        start_time=st, end_time=et, vehicle_type=vehicle_type,
        price_min=price_min, price_max=price_max, covered=covered,
        ev_charging=ev_charging, verified_only=verified_only,
    )
    return {"items": results, "total": len(results)}


@router.get("/owner/listings")
async def get_owner_listings(current_user: OwnerOnly, db: DB):
    locations = await ParkingService.get_owner_listings(db, current_user.id)
    return {"items": [
        {
            "id": str(loc.id), "name": loc.name, "address": loc.address,
            "status": loc.status, "total_spaces": loc.total_spaces,
            "base_hourly_price": float(loc.base_hourly_price),
            "average_rating": loc.average_rating, "is_active": loc.is_active,
            "images": [{"url": img.url, "is_primary": img.is_primary} for img in loc.images],
        }
        for loc in locations
    ]}


@router.post("/", status_code=201)
async def create_location(
    data: ParkingLocationCreate, current_user: OwnerOnly, db: DB
):
    location = await ParkingService.create_location(db, data, current_user)
    return {"id": str(location.id), "name": location.name, "status": location.status}


@router.get("/{location_id}")
async def get_location(location_id: str, db: DB):
    location = await ParkingService.get_location(db, UUID(location_id))
    return {
        "id": str(location.id),
        "owner_id": str(location.owner_id),
        "society_id": str(location.society_id) if location.society_id else None,
        "name": location.name,
        "description": location.description,
        "address": location.address,
        "city": location.city,
        "latitude": location.latitude,
        "longitude": location.longitude,
        "parking_type": location.parking_type,
        "status": location.status,
        "is_active": location.is_active,
        "total_spaces": location.total_spaces,
        "vehicle_types_allowed": location.vehicle_types_allowed,
        "amenities": location.amenities,
        "operating_hours": location.operating_hours,
        "cancellation_policy": location.cancellation_policy,
        "base_hourly_price": float(location.base_hourly_price),
        "base_daily_price": float(location.base_daily_price) if location.base_daily_price else None,
        "average_rating": location.average_rating,
        "total_reviews": location.total_reviews,
        "is_demo": location.is_demo,
        "images": [{"id": str(img.id), "url": img.url, "caption": img.caption, "is_primary": img.is_primary} for img in location.images],
        "spaces": [
            {
                "id": str(s.id), "space_number": s.space_number, "floor": s.floor,
                "vehicle_type": s.vehicle_type, "is_covered": s.is_covered,
                "has_ev_charging": s.has_ev_charging, "status": s.status,
            }
            for s in location.spaces
        ],
    }


@router.put("/{location_id}")
async def update_location(
    location_id: str, data: ParkingLocationUpdate, current_user: CurrentUser, db: DB
):
    location = await ParkingService.update_location(db, UUID(location_id), data, current_user)
    return {"id": str(location.id), "name": location.name, "status": location.status}


@router.post("/{location_id}/images", status_code=201)
async def add_image(location_id: str, data: ParkingImageCreate, current_user: CurrentUser, db: DB):
    image = ParkingImage(
        location_id=UUID(location_id),
        url=data.url,
        caption=data.caption,
        is_primary=data.is_primary,
    )
    db.add(image)
    await db.flush()
    return {"id": str(image.id), "url": image.url}


@router.get("/{location_id}/spaces")
async def get_spaces(location_id: str, db: DB):
    from sqlalchemy import select
    result = await db.execute(
        select(ParkingSpace).where(ParkingSpace.location_id == UUID(location_id))
    )
    spaces = result.scalars().all()
    return {"items": [
        {"id": str(s.id), "space_number": s.space_number, "vehicle_type": s.vehicle_type,
         "is_covered": s.is_covered, "has_ev_charging": s.has_ev_charging, "status": s.status}
        for s in spaces
    ]}


@router.post("/{location_id}/spaces", status_code=201)
async def add_space(location_id: str, data: ParkingSpaceCreate, current_user: OwnerOnly, db: DB):
    space = ParkingSpace(
        location_id=UUID(location_id),
        space_number=data.space_number,
        floor=data.floor,
        vehicle_type=data.vehicle_type,
        is_covered=data.is_covered,
        has_ev_charging=data.has_ev_charging,
    )
    db.add(space)
    await db.flush()
    return {"id": str(space.id), "space_number": space.space_number}


@router.get("/{location_id}/availability")
async def get_availability(location_id: str, db: DB):
    from sqlalchemy import select
    result = await db.execute(
        select(ParkingAvailability)
        .join(ParkingSpace)
        .where(ParkingSpace.location_id == UUID(location_id), ParkingAvailability.is_active == True)
    )
    avails = result.scalars().all()
    return {"items": [
        {
            "id": str(a.id), "space_id": str(a.space_id),
            "day_of_week": a.day_of_week,
            "start_time": a.start_time.strftime("%H:%M"),
            "end_time": a.end_time.strftime("%H:%M"),
        }
        for a in avails
    ]}


@router.post("/{location_id}/availability", status_code=201)
async def set_availability(location_id: str, data: AvailabilitySlotCreate, current_user: OwnerOnly, db: DB):
    from datetime import time
    h_start, m_start = map(int, data.start_time.split(":"))
    h_end, m_end = map(int, data.end_time.split(":"))
    avail = ParkingAvailability(
        space_id=UUID(data.space_id),
        day_of_week=data.day_of_week,
        start_time=time(h_start, m_start),
        end_time=time(h_end, m_end),
    )
    db.add(avail)
    await db.flush()
    return {"id": str(avail.id)}


@router.post("/{location_id}/verify")
async def submit_verification(location_id: str, current_user: CurrentUser, db: DB):
    location = await ParkingService.submit_for_verification(db, UUID(location_id), current_user)
    return {"status": location.status}


@router.get("/{location_id}/real-time")
async def real_time_availability(location_id: str, db: DB):
    """Server-Sent Events for real-time availability updates."""
    from app.core.redis_client import get_redis
    from sqlalchemy import select, func
    from app.models.booking import Booking, BookingStatus

    async def event_generator():
        redis = await get_redis()
        channel = f"parking:availability:{location_id}"
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)

        # Send initial state
        space_result = await db.execute(
            select(func.count(ParkingSpace.id)).where(
                ParkingSpace.location_id == UUID(location_id), ParkingSpace.is_active == True
            )
        )
        total = space_result.scalar() or 0
        occupied_result = await db.execute(
            select(func.count(Booking.id)).where(
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
            )
        )
        initial_data = json.dumps({"total_spaces": total, "available_spaces": total})
        yield f"data: {initial_data}\n\n"

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
                await asyncio.sleep(0.1)
        finally:
            await pubsub.unsubscribe(channel)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

from uuid import UUID
from fastapi import APIRouter, Query
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import AdminOnly, DB
from app.models.parking import ParkingLocation, ParkingStatus
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.services.parking_service import ParkingService
from app.core.exceptions import NotFoundError

router = APIRouter()


@router.get("/listings")
async def list_all_listings(
    current_user: AdminOnly, db: DB,
    status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = select(ParkingLocation).options(selectinload(ParkingLocation.images))
    if status:
        query = query.where(ParkingLocation.status == ParkingStatus(status))
    offset = (page - 1) * page_size
    query = query.order_by(ParkingLocation.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    locations = result.scalars().all()

    count_result = await db.execute(select(func.count(ParkingLocation.id)))
    total = count_result.scalar() or 0

    return {
        "items": [
            {
                "id": str(loc.id), "name": loc.name, "owner_id": str(loc.owner_id),
                "address": loc.address, "status": loc.status,
                "total_spaces": loc.total_spaces, "base_hourly_price": float(loc.base_hourly_price),
                "is_demo": loc.is_demo, "created_at": loc.created_at.isoformat(),
            }
            for loc in locations
        ],
        "total": total,
    }


@router.get("/verification-queue")
async def verification_queue(current_user: AdminOnly, db: DB):
    result = await db.execute(
        select(ParkingLocation)
        .where(ParkingLocation.status.in_([ParkingStatus.UNDER_REVIEW, ParkingStatus.PENDING_VERIFICATION]))
        .order_by(ParkingLocation.updated_at.asc())
    )
    locations = result.scalars().all()
    return {"items": [
        {"id": str(loc.id), "name": loc.name, "address": loc.address, "status": loc.status, "created_at": loc.created_at.isoformat()}
        for loc in locations
    ]}


@router.put("/listings/{location_id}/verify")
async def verify_listing(location_id: str, current_user: AdminOnly, db: DB):
    location = await ParkingService.verify_listing(db, UUID(location_id))
    return {"status": location.status, "id": str(location.id)}


@router.put("/listings/{location_id}/reject")
async def reject_listing(location_id: str, current_user: AdminOnly, db: DB, reason: str = Query(...)):
    location = await ParkingService.reject_listing(db, UUID(location_id), reason)
    return {"status": location.status, "id": str(location.id)}


@router.put("/listings/{location_id}/suspend")
async def suspend_listing(location_id: str, current_user: AdminOnly, db: DB):
    location = await ParkingService.suspend_listing(db, UUID(location_id))
    return {"status": location.status, "id": str(location.id)}


@router.get("/users")
async def list_users(
    current_user: AdminOnly, db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * page_size
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).offset(offset).limit(page_size)
    )
    users = result.scalars().all()
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar() or 0
    return {
        "items": [
            {"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role,
             "is_active": u.is_active, "created_at": u.created_at.isoformat()}
            for u in users
        ],
        "total": total,
    }


@router.put("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: AdminOnly, db: DB):
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")
    user.is_active = False
    db.add(user)
    return {"message": f"User {user.email} deactivated"}


@router.get("/bookings")
async def list_all_bookings(
    current_user: AdminOnly, db: DB,
    status: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * page_size
    query = select(Booking)
    if status:
        query = query.where(Booking.status == BookingStatus(status))
    query = query.order_by(Booking.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    bookings = result.scalars().all()
    return {"items": [
        {"id": str(b.id), "booking_ref": b.booking_ref, "status": b.status,
         "total_price": float(b.total_price), "created_at": b.created_at.isoformat()}
        for b in bookings
    ]}


@router.get("/analytics")
async def platform_analytics(current_user: AdminOnly, db: DB):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_locations = (await db.execute(select(func.count(ParkingLocation.id)))).scalar() or 0
    total_bookings = (await db.execute(select(func.count(Booking.id)))).scalar() or 0
    total_revenue = (await db.execute(
        select(func.sum(Booking.total_price)).where(Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]))
    )).scalar() or 0
    return {
        "total_users": total_users,
        "total_locations": total_locations,
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue),
    }

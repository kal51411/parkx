from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.models.vehicle import Vehicle
from app.models.notification import Notification
from app.schemas.user import VehicleCreate, VehicleOut, UserProfileUpdate
from app.schemas.auth import UserOut

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at.isoformat(),
    )


@router.put("/me", response_model=UserOut)
async def update_me(data: UserProfileUpdate, current_user: CurrentUser, db: DB):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        phone=current_user.phone,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at.isoformat(),
    )


@router.post("/me/vehicles", response_model=VehicleOut, status_code=201)
async def add_vehicle(data: VehicleCreate, current_user: CurrentUser, db: DB):
    vehicle = Vehicle(
        owner_id=current_user.id,
        plate_number=data.plate_number.upper(),
        vehicle_type=data.vehicle_type,
        make=data.make,
        model=data.model,
        color=data.color,
        is_primary=data.is_primary,
    )
    db.add(vehicle)
    await db.flush()
    return VehicleOut(
        id=str(vehicle.id),
        owner_id=str(vehicle.owner_id),
        plate_number=vehicle.plate_number,
        vehicle_type=vehicle.vehicle_type,
        make=vehicle.make,
        model=vehicle.model,
        color=vehicle.color,
        is_primary=vehicle.is_primary,
        is_active=vehicle.is_active,
    )


@router.get("/me/vehicles", response_model=list[VehicleOut])
async def list_vehicles(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Vehicle).where(Vehicle.owner_id == current_user.id, Vehicle.is_active == True)
    )
    vehicles = result.scalars().all()
    return [
        VehicleOut(
            id=str(v.id), owner_id=str(v.owner_id), plate_number=v.plate_number,
            vehicle_type=v.vehicle_type, make=v.make, model=v.model, color=v.color,
            is_primary=v.is_primary, is_active=v.is_active,
        )
        for v in vehicles
    ]


@router.delete("/me/vehicles/{vehicle_id}", status_code=204)
async def delete_vehicle(vehicle_id: str, current_user: CurrentUser, db: DB):
    from uuid import UUID
    from app.core.exceptions import NotFoundError, ForbiddenError
    result = await db.execute(
        select(Vehicle).where(Vehicle.id == UUID(vehicle_id))
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise NotFoundError("Vehicle")
    if vehicle.owner_id != current_user.id:
        raise ForbiddenError("Not your vehicle")
    vehicle.is_active = False
    db.add(vehicle)


@router.get("/me/notifications")
async def get_notifications(current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    notifs = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "type": n.type,
            "title": n.title,
            "body": n.body,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@router.put("/me/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: CurrentUser, db: DB):
    from uuid import UUID
    result = await db.execute(
        select(Notification).where(
            Notification.id == UUID(notification_id),
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        db.add(notif)
    return {"message": "Marked as read"}

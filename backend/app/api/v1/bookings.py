from uuid import UUID
from fastapi import APIRouter
import io, qrcode

from app.api.deps import CurrentUser, DB, Redis, SecurityOnly
from app.services.booking_service import BookingService
from app.schemas.booking import BookingHoldRequest, BookingCancelRequest

router = APIRouter()


def _booking_to_dict(booking) -> dict:
    d = {
        "id": str(booking.id),
        "booking_ref": booking.booking_ref,
        "driver_id": str(booking.driver_id),
        "space_id": str(booking.space_id),
        "vehicle_id": str(booking.vehicle_id),
        "status": booking.status,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "actual_check_in": booking.actual_check_in.isoformat() if booking.actual_check_in else None,
        "actual_check_out": booking.actual_check_out.isoformat() if booking.actual_check_out else None,
        "base_price": float(booking.base_price),
        "pricing_multiplier": booking.pricing_multiplier,
        "total_price": float(booking.total_price),
        "currency": booking.currency,
        "qr_token": booking.qr_token,
        "hold_expires_at": booking.hold_expires_at.isoformat() if booking.hold_expires_at else None,
        "cancellation_reason": booking.cancellation_reason,
        "notes": booking.notes,
        "created_at": booking.created_at.isoformat(),
    }
    # Nested relations if loaded
    if hasattr(booking, 'vehicle') and booking.vehicle:
        d["vehicle"] = {
            "id": str(booking.vehicle.id),
            "plate_number": booking.vehicle.plate_number,
            "vehicle_type": booking.vehicle.vehicle_type,
            "make": booking.vehicle.make,
            "model": booking.vehicle.model,
        }
    if hasattr(booking, 'space') and booking.space:
        space = booking.space
        d["space"] = {"id": str(space.id), "space_number": space.space_number}
        if hasattr(space, 'location') and space.location:
            loc = space.location
            d["parking_location"] = {
                "id": str(loc.id), "name": loc.name, "address": loc.address,
                "latitude": loc.latitude, "longitude": loc.longitude,
                "images": [{"url": img.url, "is_primary": img.is_primary} for img in (loc.images or [])],
            }
    return d


@router.post("/hold", status_code=201)
async def create_hold(data: BookingHoldRequest, current_user: CurrentUser, db: DB, redis: Redis):
    booking = await BookingService.create_hold(
        db=db, redis=redis, driver=current_user,
        space_id=UUID(data.space_id), vehicle_id=UUID(data.vehicle_id),
        start_time=data.start_time, end_time=data.end_time,
    )
    return _booking_to_dict(booking)


@router.get("/")
async def list_bookings(current_user: CurrentUser, db: DB, page: int = 1, page_size: int = 20):
    bookings = await BookingService.get_driver_bookings(db, current_user.id, page, page_size)
    return {"items": [_booking_to_dict(b) for b in bookings]}


@router.get("/owner/bookings")
async def owner_bookings(current_user: CurrentUser, db: DB):
    from sqlalchemy import select
    from app.models.booking import Booking
    from app.models.parking import ParkingSpace, ParkingLocation
    result = await db.execute(
        select(Booking)
        .join(ParkingSpace, Booking.space_id == ParkingSpace.id)
        .join(ParkingLocation, ParkingSpace.location_id == ParkingLocation.id)
        .where(ParkingLocation.owner_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .limit(100)
    )
    bookings = result.scalars().all()
    return {"items": [_booking_to_dict(b) for b in bookings]}


@router.get("/{booking_id}")
async def get_booking(booking_id: str, current_user: CurrentUser, db: DB):
    booking = await BookingService.get_booking(db, UUID(booking_id), current_user)
    return _booking_to_dict(booking)


@router.delete("/{booking_id}")
async def cancel_booking(booking_id: str, data: BookingCancelRequest, current_user: CurrentUser, db: DB):
    booking = await BookingService.cancel(db, UUID(booking_id), current_user, data.reason)
    return {"status": booking.status, "booking_ref": booking.booking_ref}


@router.get("/{booking_id}/qr")
async def get_qr_code(booking_id: str, current_user: CurrentUser, db: DB):
    """Generate QR code PNG for booking pass."""
    from fastapi.responses import Response
    booking = await BookingService.get_booking(db, UUID(booking_id), current_user)

    qr_data = {"token": booking.qr_token, "ref": booking.booking_ref}
    import json
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(json.dumps(qr_data))
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")

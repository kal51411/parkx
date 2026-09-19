from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func, and_, or_, not_
from sqlalchemy.orm import selectinload

from app.models.parking import ParkingLocation, ParkingSpace, ParkingImage, ParkingStatus
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.schemas.parking import ParkingLocationCreate, ParkingLocationUpdate, ParkingSearchResult
from app.core.exceptions import NotFoundError, ForbiddenError


class ParkingService:

    @staticmethod
    async def create_location(
        db: AsyncSession, data: ParkingLocationCreate, owner: User
    ) -> ParkingLocation:
        location = ParkingLocation(
            owner_id=owner.id,
            name=data.name,
            description=data.description,
            address=data.address,
            latitude=data.latitude,
            longitude=data.longitude,
            parking_type=data.parking_type,
            total_spaces=data.total_spaces,
            vehicle_types_allowed=[vt.value for vt in data.vehicle_types_allowed],
            amenities=data.amenities,
            operating_hours=data.operating_hours,
            cancellation_policy=data.cancellation_policy,
            base_hourly_price=float(data.base_hourly_price),
            base_daily_price=float(data.base_daily_price) if data.base_daily_price else None,
        )
        # Set PostGIS geometry
        db.add(location)
        await db.flush()

        # Update geometry using PostGIS
        await db.execute(
            text("UPDATE parking_locations SET geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) WHERE id = :id"),
            {"lng": data.longitude, "lat": data.latitude, "id": str(location.id)},
        )
        return location

    @staticmethod
    async def get_location(db: AsyncSession, location_id: UUID) -> ParkingLocation:
        result = await db.execute(
            select(ParkingLocation)
            .where(ParkingLocation.id == location_id)
            .options(
                selectinload(ParkingLocation.images),
                selectinload(ParkingLocation.spaces),
                selectinload(ParkingLocation.pricing_rules),
            )
        )
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundError("ParkingLocation")
        return location

    @staticmethod
    async def search_nearby(
        db: AsyncSession,
        lat: float,
        lng: float,
        radius_km: float = 5.0,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        vehicle_type: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        covered: Optional[bool] = None,
        ev_charging: Optional[bool] = None,
        verified_only: bool = False,
        limit: int = 50,
    ) -> List[dict]:
        """Geospatial parking search using PostGIS ST_DWithin."""

        conditions = [
            "pl.is_active = true",
            f"ST_DWithin(pl.geom::geography, ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326)::geography, {radius_km * 1000})",
        ]

        if verified_only:
            conditions.append("pl.status = 'VERIFIED'")
        else:
            conditions.append("pl.status IN ('VERIFIED', 'PENDING_VERIFICATION')")

        if price_min is not None:
            conditions.append(f"pl.base_hourly_price >= {price_min}")
        if price_max is not None:
            conditions.append(f"pl.base_hourly_price <= {price_max}")

        # Subquery for available spaces count
        if start_time and end_time:
            avail_subquery = f"""
            (SELECT COUNT(*) FROM parking_spaces ps
             WHERE ps.location_id = pl.id
             AND ps.is_active = true
             AND ps.id NOT IN (
                 SELECT b.space_id FROM bookings b
                 WHERE b.status NOT IN ('CANCELLED', 'EXPIRED', 'NO_SHOW')
                 AND NOT (b.end_time <= '{start_time.isoformat()}' OR b.start_time >= '{end_time.isoformat()}')
             ))
            """
            conditions.append(f"{avail_subquery} > 0")
        else:
            avail_subquery = "(SELECT COUNT(*) FROM parking_spaces ps WHERE ps.location_id = pl.id AND ps.is_active = true)"

        if vehicle_type:
            conditions.append(f"'{vehicle_type}' = ANY(pl.vehicle_types_allowed)")

        if covered is not None:
            conditions.append(f"(pl.amenities->>'covered')::boolean = {str(covered).lower()}")

        if ev_charging is not None:
            conditions.append(f"(pl.amenities->>'ev_charging')::boolean = {str(ev_charging).lower()}")

        where_clause = " AND ".join(conditions)
        radius_m = radius_km * 1000

        query = text(f"""
            SELECT
                pl.id::text,
                pl.name,
                pl.address,
                pl.latitude,
                pl.longitude,
                pl.parking_type,
                pl.status,
                pl.total_spaces,
                {avail_subquery} AS available_spaces,
                pl.vehicle_types_allowed,
                pl.amenities,
                pl.base_hourly_price,
                pl.average_rating,
                pl.total_reviews,
                pl.is_demo,
                ST_Distance(pl.geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_m,
                (SELECT pi.url FROM parking_images pi WHERE pi.location_id = pl.id AND pi.is_primary = true LIMIT 1) AS primary_image_url,
                (
                    0.4 * (1.0 - LEAST(ST_Distance(pl.geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / :radius_m, 1.0)) +
                    0.2 * (1.0 - LEAST(pl.base_hourly_price / 200.0, 1.0)) +
                    0.2 * (pl.average_rating / 5.0) +
                    0.2 * ({avail_subquery}::float / GREATEST(pl.total_spaces, 1))
                ) AS relevance_score
            FROM parking_locations pl
            WHERE {where_clause}
            ORDER BY relevance_score DESC
            LIMIT :limit
        """)

        result = await db.execute(query, {"lat": lat, "lng": lng, "radius_m": radius_m, "limit": limit})
        rows = result.mappings().all()
        return [dict(row) for row in rows]

    @staticmethod
    async def get_owner_listings(db: AsyncSession, owner_id: UUID) -> List[ParkingLocation]:
        result = await db.execute(
            select(ParkingLocation)
            .where(ParkingLocation.owner_id == owner_id)
            .options(selectinload(ParkingLocation.images))
            .order_by(ParkingLocation.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_location(
        db: AsyncSession, location_id: UUID, data: ParkingLocationUpdate, actor: User
    ) -> ParkingLocation:
        location = await ParkingService.get_location(db, location_id)

        if actor.role not in (UserRole.PLATFORM_ADMIN,) and location.owner_id != actor.id:
            raise ForbiddenError("You do not own this parking location")

        for field, value in data.model_dump(exclude_none=True).items():
            setattr(location, field, value)

        db.add(location)
        return location

    @staticmethod
    async def submit_for_verification(db: AsyncSession, location_id: UUID, owner: User) -> ParkingLocation:
        location = await ParkingService.get_location(db, location_id)
        if location.owner_id != owner.id:
            raise ForbiddenError("Not your listing")
        location.status = ParkingStatus.UNDER_REVIEW
        db.add(location)
        return location

    @staticmethod
    async def verify_listing(db: AsyncSession, location_id: UUID) -> ParkingLocation:
        location = await ParkingService.get_location(db, location_id)
        location.status = ParkingStatus.VERIFIED
        db.add(location)
        return location

    @staticmethod
    async def reject_listing(db: AsyncSession, location_id: UUID, reason: str) -> ParkingLocation:
        location = await ParkingService.get_location(db, location_id)
        location.status = ParkingStatus.REJECTED
        db.add(location)
        return location

    @staticmethod
    async def suspend_listing(db: AsyncSession, location_id: UUID) -> ParkingLocation:
        location = await ParkingService.get_location(db, location_id)
        location.status = ParkingStatus.SUSPENDED
        location.is_active = False
        db.add(location)
        return location

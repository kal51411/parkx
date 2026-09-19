from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text

from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingLocation, ParkingSpace
from app.models.payment import Payment
from app.schemas.analytics import OwnerOverview, RevenueDataPoint, OccupancyDataPoint, DemandPrediction


class AnalyticsService:

    @staticmethod
    async def get_owner_overview(db: AsyncSession, owner_id: UUID) -> OwnerOverview:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Get all location IDs for this owner
        loc_result = await db.execute(
            select(ParkingLocation.id, ParkingLocation.total_spaces, ParkingLocation.average_rating)
            .where(ParkingLocation.owner_id == owner_id, ParkingLocation.is_active == True)
        )
        locations = loc_result.all()
        location_ids = [str(row[0]) for row in locations]
        total_spaces = sum(row[1] for row in locations)
        avg_rating = sum(row[2] for row in locations) / len(locations) if locations else 0.0

        if not location_ids:
            return OwnerOverview(
                today_bookings=0, today_revenue=0.0, current_occupancy=0,
                total_spaces=0, occupancy_percentage=0.0, available_spaces=0,
                average_rating=0.0, monthly_revenue=0.0, cancellation_rate=0.0, no_show_rate=0.0,
            )

        space_ids_result = await db.execute(
            select(ParkingSpace.id).where(
                ParkingSpace.location_id.in_([UUID(lid) for lid in location_ids])
            )
        )
        space_ids = [str(row[0]) for row in space_ids_result.all()]

        if not space_ids:
            return OwnerOverview(
                today_bookings=0, today_revenue=0.0, current_occupancy=0,
                total_spaces=total_spaces, occupancy_percentage=0.0, available_spaces=total_spaces,
                average_rating=avg_rating, monthly_revenue=0.0, cancellation_rate=0.0, no_show_rate=0.0,
            )

        space_uuid_list = [UUID(sid) for sid in space_ids]

        # Today's bookings
        today_bookings_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.created_at >= today_start,
                    Booking.status.not_in([BookingStatus.EXPIRED]),
                )
            )
        )
        today_bookings = today_bookings_result.scalar() or 0

        # Today's revenue (from confirmed/completed bookings)
        today_revenue_result = await db.execute(
            select(func.sum(Booking.total_price)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.created_at >= today_start,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED]),
                )
            )
        )
        today_revenue = float(today_revenue_result.scalar() or 0)

        # Monthly revenue
        monthly_revenue_result = await db.execute(
            select(func.sum(Booking.total_price)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.created_at >= month_start,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED]),
                )
            )
        )
        monthly_revenue = float(monthly_revenue_result.scalar() or 0)

        # Current occupancy
        occupied_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.status == BookingStatus.CHECKED_IN,
                )
            )
        )
        current_occupancy = occupied_result.scalar() or 0

        # Cancellation rate (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        total_30d_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(Booking.space_id.in_(space_uuid_list), Booking.created_at >= thirty_days_ago)
            )
        )
        total_30d = total_30d_result.scalar() or 1

        cancelled_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.created_at >= thirty_days_ago,
                    Booking.status == BookingStatus.CANCELLED,
                )
            )
        )
        cancelled_count = cancelled_result.scalar() or 0

        noshow_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.space_id.in_(space_uuid_list),
                    Booking.created_at >= thirty_days_ago,
                    Booking.status == BookingStatus.NO_SHOW,
                )
            )
        )
        noshow_count = noshow_result.scalar() or 0

        total_spaces_count = len(space_ids)
        available_spaces = max(0, total_spaces_count - current_occupancy)
        occupancy_pct = (current_occupancy / total_spaces_count * 100) if total_spaces_count > 0 else 0.0

        return OwnerOverview(
            today_bookings=today_bookings,
            today_revenue=round(today_revenue, 2),
            current_occupancy=current_occupancy,
            total_spaces=total_spaces_count,
            occupancy_percentage=round(occupancy_pct, 1),
            available_spaces=available_spaces,
            average_rating=round(avg_rating, 2),
            monthly_revenue=round(monthly_revenue, 2),
            cancellation_rate=round(cancelled_count / total_30d * 100, 1),
            no_show_rate=round(noshow_count / total_30d * 100, 1),
        )

    @staticmethod
    async def get_revenue_by_day(
        db: AsyncSession, owner_id: UUID, days: int = 30
    ) -> List[RevenueDataPoint]:
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(text("""
            SELECT
                DATE(b.created_at AT TIME ZONE 'Asia/Kolkata') AS date,
                COALESCE(SUM(b.total_price), 0) AS revenue,
                COUNT(b.id) AS bookings
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id
              AND b.created_at >= :since
              AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
            GROUP BY DATE(b.created_at AT TIME ZONE 'Asia/Kolkata')
            ORDER BY date ASC
        """), {"owner_id": str(owner_id), "since": since.isoformat()})

        rows = result.mappings().all()
        return [
            RevenueDataPoint(date=str(row["date"]), revenue=float(row["revenue"]), bookings=int(row["bookings"]))
            for row in rows
        ]

    @staticmethod
    async def get_occupancy_by_hour(
        db: AsyncSession, owner_id: UUID
    ) -> List[OccupancyDataPoint]:
        result = await db.execute(text("""
            SELECT
                EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'Asia/Kolkata')::int AS hour,
                COUNT(b.id) AS bookings,
                AVG(
                    EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600
                ) AS avg_duration_hours
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id
              AND b.created_at >= NOW() - INTERVAL '30 days'
              AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
            GROUP BY hour
            ORDER BY hour ASC
        """), {"owner_id": str(owner_id)})

        rows = result.mappings().all()
        max_bookings = max((int(r["bookings"]) for r in rows), default=1)
        return [
            OccupancyDataPoint(
                hour=int(row["hour"]),
                occupancy_percentage=round(int(row["bookings"]) / max_bookings * 100, 1),
                bookings=int(row["bookings"]),
            )
            for row in rows
        ]

    @staticmethod
    async def get_demand_prediction(
        db: AsyncSession, location_id: UUID
    ) -> DemandPrediction:
        """Simple statistical demand prediction from historical data."""
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        # Historical bookings for this location
        result = await db.execute(text("""
            SELECT
                EXTRACT(DOW FROM b.start_time AT TIME ZONE 'Asia/Kolkata')::int AS day_of_week,
                EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'Asia/Kolkata')::int AS hour,
                COUNT(*) AS bookings
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            WHERE ps.location_id = :location_id
              AND b.created_at >= :since
              AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
            GROUP BY day_of_week, hour
            ORDER BY bookings DESC
        """), {"location_id": str(location_id), "since": thirty_days_ago.isoformat()})

        rows = result.mappings().all()
        total_bookings = sum(int(r["bookings"]) for r in rows)
        peak_hours = [int(r["hour"]) for r in rows[:3]] if rows else [9, 18, 19]

        # Estimate demand level
        avg_daily = total_bookings / 30
        if avg_daily > 10:
            demand = "HIGH"
            confidence = 0.82
            est_occ = 0.75
        elif avg_daily > 5:
            demand = "MEDIUM"
            confidence = 0.74
            est_occ = 0.50
        elif avg_daily > 0:
            demand = "LOW"
            confidence = 0.65
            est_occ = 0.25
        else:
            demand = "LOW"
            confidence = 0.50
            est_occ = 0.10

        return DemandPrediction(
            location_id=str(location_id),
            date=now.strftime("%Y-%m-%d"),
            predicted_demand=demand,
            confidence=confidence,
            peak_hours=peak_hours,
            estimated_occupancy=round(est_occ * 100, 1),
            recommendation=f"Based on {total_bookings} bookings in the last 30 days.",
        )

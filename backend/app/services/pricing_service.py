from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingLocation
from app.models.availability import PricingRule, PricingRuleType


class PricingService:

    @staticmethod
    async def calculate_price(
        db: AsyncSession,
        location: ParkingLocation,
        start_time: datetime,
        end_time: datetime,
    ) -> dict:
        duration_hours = (end_time - start_time).total_seconds() / 3600
        base_price = float(location.base_hourly_price) * duration_hours

        # Get applicable pricing rules
        rules_result = await db.execute(
            select(PricingRule).where(
                PricingRule.location_id == location.id,
                PricingRule.is_active == True,
            )
        )
        rules = list(rules_result.scalars().all())

        multiplier = 1.0
        applied_rules = []

        # Get current occupancy
        occupied_result = await db.execute(
            select(func.count(Booking.id)).where(
                and_(
                    Booking.space_id.in_(
                        select(
                            __import__('app.models.parking', fromlist=['ParkingSpace']).ParkingSpace.id
                        ).where(
                            __import__('app.models.parking', fromlist=['ParkingSpace']).ParkingSpace.location_id == location.id
                        )
                    ),
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]),
                    Booking.start_time <= end_time,
                    Booking.end_time >= start_time,
                )
            )
        )
        occupied_count = occupied_result.scalar() or 0
        total_spaces = max(location.total_spaces, 1)
        occupancy_pct = occupied_count / total_spaces

        # Check day of week
        day_of_week = start_time.weekday()  # 0=Monday
        hour = start_time.hour
        is_weekend = day_of_week in (5, 6)

        for rule in rules:
            if rule.rule_type == PricingRuleType.PEAK:
                if rule.start_time and rule.end_time:
                    rule_start = rule.start_time.hour
                    rule_end = rule.end_time.hour
                    if rule_start <= hour <= rule_end:
                        if rule.day_of_week in (-1, day_of_week) or rule.day_of_week is None:
                            multiplier = max(multiplier, rule.price_multiplier)
                            applied_rules.append(f"PEAK_{hour}H")

            elif rule.rule_type == PricingRuleType.WEEKEND and is_weekend:
                multiplier = max(multiplier, rule.price_multiplier)
                applied_rules.append("WEEKEND")

        # Dynamic adjustment based on occupancy
        if occupancy_pct > 0.8:
            multiplier *= 1.2
            applied_rules.append("HIGH_DEMAND")
        elif occupancy_pct < 0.2 and occupancy_pct > 0:
            multiplier *= 0.85
            applied_rules.append("LOW_DEMAND_DISCOUNT")

        total_price = round(base_price * multiplier, 2)

        return {
            "base_price": round(base_price, 2),
            "multiplier": round(multiplier, 4),
            "total_price": total_price,
            "duration_hours": round(duration_hours, 2),
            "applied_rules": applied_rules,
            "occupancy_percentage": round(occupancy_pct * 100, 1),
        }

    @staticmethod
    def get_recommendation(
        current_price: float,
        occupancy_pct: float,
        recent_booking_velocity: float,
    ) -> dict:
        """
        Rules-based price recommendation.
        Designed to be replaced by ML model later.
        """
        multiplier = 1.0
        demand_level = "MEDIUM"

        if occupancy_pct > 0.8 and recent_booking_velocity > 2:
            multiplier = 1.3
            demand_level = "VERY_HIGH"
        elif occupancy_pct > 0.6:
            multiplier = 1.15
            demand_level = "HIGH"
        elif occupancy_pct < 0.2:
            multiplier = 0.8
            demand_level = "LOW"
        elif occupancy_pct < 0.4:
            multiplier = 0.9
            demand_level = "LOW_MEDIUM"

        recommended = round(current_price * multiplier, 0)
        return {
            "current_price": current_price,
            "recommended_price": recommended,
            "multiplier": multiplier,
            "demand_level": demand_level,
            "occupancy_percentage": round(occupancy_pct * 100, 1),
            "reason": f"Based on {demand_level.lower().replace('_', ' ')} demand and {round(occupancy_pct*100)}% occupancy",
        }

from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingLocation
from app.core.exceptions import NotFoundError, ForbiddenError, ValidationError
from app.schemas.review import ReviewCreate


class ReviewService:

    @staticmethod
    async def create_review(db: AsyncSession, driver_id: UUID, data: ReviewCreate) -> Review:
        # Validate booking belongs to driver and is completed
        booking_result = await db.execute(
            select(Booking).where(
                Booking.id == UUID(data.booking_id),
                Booking.driver_id == driver_id,
                Booking.status == BookingStatus.COMPLETED,
            )
        )
        booking = booking_result.scalar_one_or_none()
        if not booking:
            raise ValidationError("Can only review completed bookings that belong to you")

        # Check no existing review
        existing_result = await db.execute(
            select(Review).where(Review.booking_id == booking.id)
        )
        if existing_result.scalar_one_or_none():
            raise ValidationError("You have already reviewed this booking")

        # Get location from space
        from app.models.parking import ParkingSpace
        space_result = await db.execute(
            select(ParkingSpace).where(ParkingSpace.id == booking.space_id)
        )
        space = space_result.scalar_one()

        review = Review(
            booking_id=booking.id,
            driver_id=driver_id,
            location_id=space.location_id,
            rating=data.rating,
            comment=data.comment,
        )
        db.add(review)
        await db.flush()

        # Update location average rating
        avg_result = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.location_id == space.location_id, Review.is_visible == True
            )
        )
        avg_rating, count = avg_result.one()
        location_result = await db.execute(
            select(ParkingLocation).where(ParkingLocation.id == space.location_id)
        )
        location = location_result.scalar_one()
        location.average_rating = round(float(avg_rating or 0), 2)
        location.total_reviews = count or 0
        db.add(location)

        return review

    @staticmethod
    async def get_location_reviews(
        db: AsyncSession, location_id: UUID, page: int = 1, page_size: int = 20
    ) -> list[Review]:
        offset = (page - 1) * page_size
        result = await db.execute(
            select(Review)
            .where(Review.location_id == location_id, Review.is_visible == True)
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all())

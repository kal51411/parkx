from uuid import UUID
from fastapi import APIRouter, Query
from app.api.deps import CurrentUser, DB
from app.services.review_service import ReviewService
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter()


@router.post("/", response_model=ReviewOut, status_code=201)
async def create_review(data: ReviewCreate, current_user: CurrentUser, db: DB):
    review = await ReviewService.create_review(db, current_user.id, data)
    return ReviewOut(
        id=str(review.id), booking_id=str(review.booking_id),
        driver_id=str(review.driver_id), location_id=str(review.location_id),
        rating=review.rating, comment=review.comment,
        is_visible=review.is_visible, owner_reply=review.owner_reply,
        created_at=review.created_at.isoformat(),
    )


@router.get("/location/{location_id}")
async def get_location_reviews(
    location_id: str, db: DB,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    reviews = await ReviewService.get_location_reviews(db, UUID(location_id), page, page_size)
    return {"items": [
        {
            "id": str(r.id), "rating": r.rating, "comment": r.comment,
            "owner_reply": r.owner_reply, "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]}


@router.get("/me")
async def my_reviews(current_user: CurrentUser, db: DB):
    from sqlalchemy import select
    from app.models.review import Review
    result = await db.execute(
        select(Review).where(Review.driver_id == current_user.id).order_by(Review.created_at.desc())
    )
    reviews = result.scalars().all()
    return {"items": [
        {"id": str(r.id), "location_id": str(r.location_id), "rating": r.rating, "comment": r.comment, "created_at": r.created_at.isoformat()}
        for r in reviews
    ]}

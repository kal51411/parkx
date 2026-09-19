from fastapi import APIRouter
from app.api.v1 import auth, users, parking, bookings, payments, reviews, societies, security, analytics, ai, admin

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(parking.router, prefix="/parking", tags=["Parking"])
router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
router.include_router(payments.router, prefix="/payments", tags=["Payments"])
router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
router.include_router(societies.router, prefix="/societies", tags=["Societies"])
router.include_router(security.router, prefix="/security", tags=["Security"])
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
router.include_router(ai.router, prefix="/ai", tags=["AI"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])

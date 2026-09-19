import uuid
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Request, Header
from sqlalchemy import select

from app.api.deps import CurrentUser, DB
from app.schemas.payment import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, PaymentOut
from app.services.payment_service import get_payment_provider
from app.services.booking_service import BookingService
from app.services.notification_service import NotificationService
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus, PaymentProvider
from app.core.exceptions import NotFoundError, PaymentError, BookingStateError
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(data: CreateOrderRequest, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Booking).where(Booking.id == UUID(data.booking_id), Booking.driver_id == current_user.id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise NotFoundError("Booking")

    if booking.status not in (BookingStatus.HELD, BookingStatus.PAYMENT_PENDING):
        raise BookingStateError(f"Cannot create payment for booking in state {booking.status.value}")

    provider = get_payment_provider()
    order = await provider.create_order(
        amount=float(booking.total_price),
        currency=booking.currency,
        booking_id=str(booking.id),
    )

    # Update booking to PAYMENT_PENDING
    booking.status = BookingStatus.PAYMENT_PENDING
    db.add(booking)

    # Create payment record
    payment = Payment(
        booking_id=booking.id,
        provider=PaymentProvider.MOCK if order.is_mock else PaymentProvider.RAZORPAY,
        provider_order_id=order.order_id,
        amount=float(booking.total_price),
        currency=booking.currency,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)

    return CreateOrderResponse(
        order_id=order.order_id,
        amount=float(booking.total_price),
        currency=booking.currency,
        provider=PaymentProvider.MOCK if order.is_mock else PaymentProvider.RAZORPAY,
        key_id=order.key_id,
        is_mock=order.is_mock,
    )


@router.post("/verify")
async def verify_payment(data: VerifyPaymentRequest, current_user: CurrentUser, db: DB):
    provider = get_payment_provider()
    is_valid = await provider.verify_payment(data.order_id, data.payment_id, data.signature)

    if not is_valid:
        logger.warning("payment_verification_failed", order_id=data.order_id, booking_id=data.booking_id)
        raise PaymentError("Payment signature verification failed")

    # Update payment record
    payment_result = await db.execute(
        select(Payment).where(Payment.provider_order_id == data.order_id)
    )
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.provider_payment_id = data.payment_id
        payment.provider_signature = data.signature
        payment.status = PaymentStatus.CAPTURED
        payment.verified_at = datetime.now(timezone.utc)
        db.add(payment)

    # Confirm booking
    booking = await BookingService.confirm_booking(db, UUID(data.booking_id), data.payment_id, current_user)

    # Send notification
    await NotificationService.booking_confirmed(db, booking)

    return {"status": "confirmed", "booking_ref": booking.booking_ref}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: DB, x_razorpay_signature: str = Header(None)):
    """Verify Razorpay webhook and process payment events."""
    body = await request.body()
    from app.services.payment_service import RazorpayProvider
    from app.core.config import settings

    if settings.PAYMENT_PROVIDER == "razorpay":
        if not x_razorpay_signature:
            raise PaymentError("Missing webhook signature")
        if not RazorpayProvider.verify_webhook(body, x_razorpay_signature):
            raise PaymentError("Invalid webhook signature")

    import json
    event = json.loads(body)
    event_type = event.get("event", "")
    logger.info("webhook_received", event_type=event_type)

    if event_type == "payment.captured":
        payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id")
        payment_id = payment_entity.get("id")

        payment_result = await db.execute(
            select(Payment).where(Payment.provider_order_id == order_id)
        )
        payment = payment_result.scalar_one_or_none()
        if payment and payment.status != PaymentStatus.CAPTURED:
            payment.provider_payment_id = payment_id
            payment.status = PaymentStatus.CAPTURED
            payment.verified_at = datetime.now(timezone.utc)
            db.add(payment)

            booking = await BookingService.confirm_booking(db, payment.booking_id, payment_id, None)
            await NotificationService.booking_confirmed(db, booking)

    return {"status": "ok"}


@router.get("/booking/{booking_id}", response_model=PaymentOut)
async def get_payment_status(booking_id: str, current_user: CurrentUser, db: DB):
    result = await db.execute(
        select(Payment).where(Payment.booking_id == UUID(booking_id))
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise NotFoundError("Payment")
    return PaymentOut(
        id=str(payment.id), booking_id=str(payment.booking_id),
        provider=payment.provider, provider_order_id=payment.provider_order_id,
        provider_payment_id=payment.provider_payment_id, amount=float(payment.amount),
        currency=payment.currency, status=payment.status,
        verified_at=payment.verified_at.isoformat() if payment.verified_at else None,
        refund_amount=float(payment.refund_amount) if payment.refund_amount else None,
        refunded_at=payment.refunded_at.isoformat() if payment.refunded_at else None,
    )

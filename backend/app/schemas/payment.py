from typing import Optional
from pydantic import BaseModel
from app.models.payment import PaymentStatus, PaymentProvider


class CreateOrderRequest(BaseModel):
    booking_id: str


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    provider: PaymentProvider
    key_id: Optional[str] = None  # Razorpay publishable key
    is_mock: bool = False


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    order_id: str
    payment_id: str
    signature: str


class PaymentOut(BaseModel):
    id: str
    booking_id: str
    provider: PaymentProvider
    provider_order_id: str
    provider_payment_id: Optional[str]
    amount: float
    currency: str
    status: PaymentStatus
    verified_at: Optional[str]
    refund_amount: Optional[float]
    refunded_at: Optional[str]

    model_config = {"from_attributes": True}

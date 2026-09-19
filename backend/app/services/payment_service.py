import abc
import hashlib
import hmac
import uuid
from typing import Optional
from dataclasses import dataclass

import structlog

from app.core.config import settings
from app.core.exceptions import PaymentError

logger = structlog.get_logger(__name__)


@dataclass
class PaymentOrder:
    order_id: str
    amount: float
    currency: str
    provider: str
    is_mock: bool = False
    key_id: Optional[str] = None


@dataclass
class RefundResult:
    refund_id: str
    amount: float
    status: str


class BasePaymentProvider(abc.ABC):
    @abc.abstractmethod
    async def create_order(self, amount: float, currency: str, booking_id: str) -> PaymentOrder:
        pass

    @abc.abstractmethod
    async def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        pass

    @abc.abstractmethod
    async def refund(self, payment_id: str, amount: float) -> RefundResult:
        pass


class RazorpayProvider(BasePaymentProvider):
    def __init__(self):
        import razorpay
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise ValueError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set")
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    async def create_order(self, amount: float, currency: str, booking_id: str) -> PaymentOrder:
        try:
            # Razorpay amount is in paise (INR * 100)
            amount_paise = int(amount * 100)
            order = self.client.order.create({
                "amount": amount_paise,
                "currency": currency,
                "receipt": f"booking_{booking_id}",
                "notes": {"booking_id": booking_id},
            })
            return PaymentOrder(
                order_id=order["id"],
                amount=amount,
                currency=currency,
                provider="RAZORPAY",
                key_id=settings.RAZORPAY_KEY_ID,
                is_mock=False,
            )
        except Exception as e:
            logger.error("razorpay_order_failed", error=str(e))
            raise PaymentError(f"Failed to create payment order: {str(e)}")

    async def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        if not settings.RAZORPAY_KEY_SECRET:
            return False
        body = f"{order_id}|{payment_id}"
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def refund(self, payment_id: str, amount: float) -> RefundResult:
        try:
            refund = self.client.payment.refund(payment_id, {"amount": int(amount * 100)})
            return RefundResult(
                refund_id=refund["id"],
                amount=amount,
                status=refund["status"],
            )
        except Exception as e:
            raise PaymentError(f"Refund failed: {str(e)}")

    @staticmethod
    def verify_webhook(body: bytes, signature: str) -> bool:
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            return False
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


class MockPaymentProvider(BasePaymentProvider):
    """
    Development/test payment provider.
    Simulates the full Razorpay flow without real money.
    All responses are clearly marked as MOCK.
    """

    async def create_order(self, amount: float, currency: str, booking_id: str) -> PaymentOrder:
        mock_order_id = f"mock_order_{uuid.uuid4().hex[:12]}"
        logger.info("mock_payment_order_created", order_id=mock_order_id, amount=amount, booking_id=booking_id)
        return PaymentOrder(
            order_id=mock_order_id,
            amount=amount,
            currency=currency,
            provider="MOCK",
            is_mock=True,
            key_id=None,
        )

    async def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        # Mock always succeeds in dev mode
        # In test mode, signature "fail" causes failure for testing
        if signature == "fail_for_testing":
            return False
        logger.info("mock_payment_verified", order_id=order_id, payment_id=payment_id)
        return True

    async def refund(self, payment_id: str, amount: float) -> RefundResult:
        mock_refund_id = f"mock_refund_{uuid.uuid4().hex[:12]}"
        return RefundResult(refund_id=mock_refund_id, amount=amount, status="processed")


def get_payment_provider() -> BasePaymentProvider:
    provider = settings.PAYMENT_PROVIDER.lower()
    if provider == "razorpay":
        return RazorpayProvider()
    return MockPaymentProvider()

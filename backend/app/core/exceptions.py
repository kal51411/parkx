from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.requests import Request


class ParkXException(Exception):
    """Base ParkX exception."""
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class AuthError(ParkXException):
    def __init__(self, message: str = "Authentication failed", details: dict | None = None):
        super().__init__("AUTH_ERROR", message, status.HTTP_401_UNAUTHORIZED, details)


class ForbiddenError(ParkXException):
    def __init__(self, message: str = "Insufficient permissions", details: dict | None = None):
        super().__init__("AUTH_INSUFFICIENT_PERMISSIONS", message, status.HTTP_403_FORBIDDEN, details)


class NotFoundError(ParkXException):
    def __init__(self, resource: str = "Resource", details: dict | None = None):
        super().__init__(f"{resource.upper()}_NOT_FOUND", f"{resource} not found", status.HTTP_404_NOT_FOUND, details)


class ParkingUnavailableError(ParkXException):
    def __init__(self, message: str = "No parking space available for the requested time", details: dict | None = None):
        super().__init__("PARKING_UNAVAILABLE", message, status.HTTP_409_CONFLICT, details)


class BookingConflictError(ParkXException):
    def __init__(self, message: str = "Booking conflict detected", details: dict | None = None):
        super().__init__("BOOKING_CONFLICT", message, status.HTTP_409_CONFLICT, details)


class BookingStateError(ParkXException):
    def __init__(self, message: str = "Invalid booking state transition", details: dict | None = None):
        super().__init__("BOOKING_INVALID_STATE_TRANSITION", message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class PaymentError(ParkXException):
    def __init__(self, message: str = "Payment verification failed", details: dict | None = None):
        super().__init__("PAYMENT_VERIFICATION_FAILED", message, status.HTTP_402_PAYMENT_REQUIRED, details)


class ValidationError(ParkXException):
    def __init__(self, message: str = "Validation error", details: dict | None = None):
        super().__init__("VALIDATION_ERROR", message, status.HTTP_422_UNPROCESSABLE_ENTITY, details)


class RateLimitError(ParkXException):
    def __init__(self, message: str = "Rate limit exceeded", details: dict | None = None):
        super().__init__("RATE_LIMIT_EXCEEDED", message, status.HTTP_429_TOO_MANY_REQUESTS, details)


def error_response(code: str, message: str, details: dict | None = None) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        }
    }


async def parkx_exception_handler(request: Request, exc: ParkXException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(exc.code, exc.message, exc.details),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            f"HTTP_{exc.status_code}",
            exc.detail if isinstance(exc.detail, str) else str(exc.detail),
        ),
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response("VALIDATION_ERROR", "Request validation failed", {"errors": str(exc)}),
    )

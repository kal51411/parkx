import io
import json
import secrets
import qrcode
from typing import Tuple


def generate_qr_token() -> str:
    """Generate a high-entropy secure QR token."""
    return secrets.token_urlsafe(32)

def generate_qr_code_image(token: str, booking_ref: str) -> bytes:
    """Generate PNG bytes of a QR code containing token and booking_ref."""
    qr_data = json.dumps({"token": token, "ref": booking_ref})
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

from typing import Optional
from uuid import UUID
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select, func, and_, text
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.api.deps import CurrentUser, OwnerOnly, DB
from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.parking import ParkingSpace, ParkingLocation
from app.services.pricing_service import PricingService

logger = structlog.get_logger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    location_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    tool_calls_made: list[str] = []
    disclaimer: str = "All figures are sourced from real database queries."


async def _get_ai_tools(db: AsyncSession, owner_id: UUID, location_id: Optional[UUID]):
    """Build AI tool functions scoped to owner's data."""

    async def get_revenue(period_days: int = 30) -> dict:
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = await db.execute(text("""
            SELECT COALESCE(SUM(b.total_price), 0) AS total_revenue,
                   COUNT(b.id) AS booking_count
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id
              AND b.created_at >= :since
              AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
        """), {"owner_id": str(owner_id), "since": since})
        row = result.mappings().one()
        return {"total_revenue": float(row["total_revenue"]), "booking_count": int(row["booking_count"]), "period_days": period_days}

    async def get_occupancy_stats() -> dict:
        if not location_id:
            return {"error": "No location_id provided"}
        result = await db.execute(text("""
            SELECT
                COUNT(CASE WHEN b.status = 'CHECKED_IN' THEN 1 END) AS currently_occupied,
                COUNT(ps.id) AS total_spaces
            FROM parking_spaces ps
            LEFT JOIN bookings b ON b.space_id = ps.id AND b.status = 'CHECKED_IN'
            WHERE ps.location_id = :location_id
        """), {"location_id": str(location_id)})
        row = result.mappings().one()
        total = int(row["total_spaces"]) or 1
        occupied = int(row["currently_occupied"])
        return {"currently_occupied": occupied, "total_spaces": total, "occupancy_pct": round(occupied / total * 100, 1)}

    async def get_cancellations(period_days: int = 30) -> dict:
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = await db.execute(text("""
            SELECT COUNT(*) AS cancelled
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id AND b.status = 'CANCELLED' AND b.created_at >= :since
        """), {"owner_id": str(owner_id), "since": since})
        row = result.mappings().one()
        return {"cancellations": int(row["cancelled"]), "period_days": period_days}

    async def get_no_shows(period_days: int = 30) -> dict:
        from datetime import datetime, timedelta, timezone
        since = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        result = await db.execute(text("""
            SELECT COUNT(*) AS no_shows
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id AND b.status = 'NO_SHOW' AND b.created_at >= :since
        """), {"owner_id": str(owner_id), "since": since})
        row = result.mappings().one()
        return {"no_shows": int(row["no_shows"]), "period_days": period_days}

    async def get_peak_hours() -> dict:
        result = await db.execute(text("""
            SELECT EXTRACT(HOUR FROM b.start_time AT TIME ZONE 'Asia/Kolkata')::int AS hour,
                   COUNT(*) AS bookings
            FROM bookings b
            JOIN parking_spaces ps ON b.space_id = ps.id
            JOIN parking_locations pl ON ps.location_id = pl.id
            WHERE pl.owner_id = :owner_id
              AND b.created_at >= NOW() - INTERVAL '30 days'
              AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
            GROUP BY hour ORDER BY bookings DESC LIMIT 5
        """), {"owner_id": str(owner_id)})
        rows = result.mappings().all()
        return {"peak_hours": [{"hour": int(r["hour"]), "bookings": int(r["bookings"])} for r in rows]}

    async def get_price_recommendation() -> dict:
        if not location_id:
            return {"error": "No location_id provided"}
        loc_result = await db.execute(select(ParkingLocation).where(ParkingLocation.id == location_id))
        location = loc_result.scalar_one_or_none()
        if not location:
            return {"error": "Location not found"}
        occ = await get_occupancy_stats()
        occ_pct = occ.get("occupancy_pct", 0) / 100
        rec = PricingService.get_recommendation(float(location.base_hourly_price), occ_pct, 1.0)
        return rec

    return {
        "get_revenue": get_revenue,
        "get_occupancy_stats": get_occupancy_stats,
        "get_cancellations": get_cancellations,
        "get_no_shows": get_no_shows,
        "get_peak_hours": get_peak_hours,
        "get_price_recommendation": get_price_recommendation,
    }


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(data: ChatRequest, current_user: OwnerOnly, db: DB):
    if not settings.GEMINI_API_KEY:
        return ChatResponse(
            response="AI assistant is not configured. Please set the GEMINI_API_KEY environment variable.",
            disclaimer="AI assistant unavailable.",
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)

        location_id = UUID(data.location_id) if data.location_id else None
        tools = await _get_ai_tools(db, current_user.id, location_id)

        # System prompt strictly limiting the AI to tool-based answers
        system_prompt = """You are ParkX Operations Assistant — an AI that helps parking owners understand their business performance.

CRITICAL RULES:
1. You MUST use the provided tools to fetch real data before answering any numerical question.
2. NEVER invent or estimate numbers. Every metric must come from tool results.
3. If a tool returns an error, say so clearly.
4. Be concise and business-focused.
5. Always cite the data source (e.g., "Based on the last 30 days of data...").

Available tools: get_revenue, get_occupancy_stats, get_cancellations, get_no_shows, get_peak_hours, get_price_recommendation"""

        model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)

        # Execute tools based on message keywords (simplified tool-calling)
        tool_results = {}
        tool_calls_made = []
        msg_lower = data.message.lower()

        if any(w in msg_lower for w in ["revenue", "earning", "money", "income", "sales"]):
            tool_results["revenue"] = await tools["get_revenue"](30)
            tool_calls_made.append("get_revenue(period_days=30)")

        if any(w in msg_lower for w in ["occupancy", "occupied", "full", "space", "capacity"]):
            tool_results["occupancy"] = await tools["get_occupancy_stats"]()
            tool_calls_made.append("get_occupancy_stats()")

        if any(w in msg_lower for w in ["cancel", "cancellation"]):
            tool_results["cancellations"] = await tools["get_cancellations"](30)
            tool_calls_made.append("get_cancellations(period_days=30)")

        if any(w in msg_lower for w in ["no-show", "no show", "noshow", "missed"]):
            tool_results["no_shows"] = await tools["get_no_shows"](30)
            tool_calls_made.append("get_no_shows(period_days=30)")

        if any(w in msg_lower for w in ["peak", "busy", "hour", "time", "when"]):
            tool_results["peak_hours"] = await tools["get_peak_hours"]()
            tool_calls_made.append("get_peak_hours()")

        if any(w in msg_lower for w in ["price", "pricing", "rate", "charge", "recommend"]):
            tool_results["price_recommendation"] = await tools["get_price_recommendation"]()
            tool_calls_made.append("get_price_recommendation()")

        # If no keywords matched, fetch overview
        if not tool_results:
            tool_results["revenue"] = await tools["get_revenue"](30)
            tool_results["peak_hours"] = await tools["get_peak_hours"]()
            tool_calls_made = ["get_revenue(period_days=30)", "get_peak_hours()"]

        # Build context for the AI
        context = f"""User question: {data.message}

Real data from database:
{tool_results}

Answer the user's question using ONLY this real data. Do not add any numbers not present above."""

        response = model.generate_content(context)
        return ChatResponse(
            response=response.text,
            tool_calls_made=tool_calls_made,
        )

    except Exception as e:
        logger.error("ai_chat_error", error=str(e))
        return ChatResponse(
            response=f"AI assistant encountered an error: {str(e)}. Please try again.",
            tool_calls_made=[],
            disclaimer="Error occurred.",
        )

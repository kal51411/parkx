"""
CRITICAL TEST: Concurrent booking double-booking protection.

This test verifies that when multiple users simultaneously attempt to book
the same parking space for the same time slot, exactly ONE succeeds and
all others receive a 409 BOOKING_CONFLICT error.
"""
import asyncio
import pytest
import httpx
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_concurrent_booking_same_slot(test_client, seed_parking_space, seed_vehicles):
    """
    10 drivers attempt to book the same space simultaneously.
    Only 1 should succeed. 9 should get 409 BOOKING_CONFLICT.
    """
    space_id = seed_parking_space["id"]
    start_time = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    end_time = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()

    # Create 10 driver tokens and vehicles
    tokens_and_vehicles = seed_vehicles  # List of (access_token, vehicle_id)

    async def try_booking(token: str, vehicle_id: str) -> dict:
        async with httpx.AsyncClient(base_url="http://testserver") as client:
            response = await client.post(
                "/api/v1/bookings/hold",
                json={"space_id": space_id, "vehicle_id": vehicle_id, "start_time": start_time, "end_time": end_time},
                headers={"Authorization": f"Bearer {token}"},
            )
            return {"status_code": response.status_code, "data": response.json()}

    # Fire all 10 simultaneously
    tasks = [try_booking(token, vehicle_id) for token, vehicle_id in tokens_and_vehicles]
    results = await asyncio.gather(*tasks)

    successes = [r for r in results if r["status_code"] == 201]
    conflicts = [r for r in results if r["status_code"] == 409]

    # Exactly 1 must succeed
    assert len(successes) == 1, f"Expected 1 success, got {len(successes)}. Results: {results}"
    # Rest must be conflicts
    assert len(conflicts) == 9, f"Expected 9 conflicts, got {len(conflicts)}"

    # Verify the conflict error code
    for conflict in conflicts:
        error = conflict["data"].get("error", {})
        assert error.get("code") == "BOOKING_CONFLICT"

    print(f"\n✅ Double-booking protection verified: 1 success, {len(conflicts)} conflicts prevented")


@pytest.mark.asyncio
async def test_non_overlapping_bookings_succeed(test_client, seed_parking_space, seed_vehicles):
    """
    Two drivers booking different time slots on same space should both succeed.
    """
    space_id = seed_parking_space["id"]
    token1, vehicle_id1 = seed_vehicles[0]
    token2, vehicle_id2 = seed_vehicles[1]

    now = datetime.now(timezone.utc)

    async with httpx.AsyncClient(base_url="http://testserver") as client:
        # Booking 1: 10:00 - 12:00
        r1 = await client.post(
            "/api/v1/bookings/hold",
            json={
                "space_id": space_id, "vehicle_id": vehicle_id1,
                "start_time": (now + timedelta(hours=3)).isoformat(),
                "end_time": (now + timedelta(hours=5)).isoformat(),
            },
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert r1.status_code == 201, f"First booking failed: {r1.text}"

        # Booking 2: 12:00 - 14:00 (no overlap)
        r2 = await client.post(
            "/api/v1/bookings/hold",
            json={
                "space_id": space_id, "vehicle_id": vehicle_id2,
                "start_time": (now + timedelta(hours=5)).isoformat(),
                "end_time": (now + timedelta(hours=7)).isoformat(),
            },
            headers={"Authorization": f"Bearer {token2}"},
        )
        assert r2.status_code == 201, f"Second booking failed: {r2.text}"

    print("\n✅ Non-overlapping bookings both succeeded")

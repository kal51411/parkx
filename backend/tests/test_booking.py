import pytest
from datetime import datetime, timedelta, timezone


@pytest.mark.asyncio
async def test_create_booking_hold(test_client, registered_driver, seed_parking_space):
    # Add a vehicle first
    veh_resp = await test_client.post("/api/v1/users/me/vehicles", json={
        "plate_number": "MH01TEST001", "vehicle_type": "CAR", "make": "Honda", "model": "City",
    }, headers={"Authorization": f"Bearer {registered_driver['token']}"})
    assert veh_resp.status_code == 201
    vehicle_id = veh_resp.json()["id"]

    now = datetime.now(timezone.utc)
    response = await test_client.post("/api/v1/bookings/hold", json={
        "space_id": seed_parking_space["id"],
        "vehicle_id": vehicle_id,
        "start_time": (now + timedelta(hours=1)).isoformat(),
        "end_time": (now + timedelta(hours=3)).isoformat(),
    }, headers={"Authorization": f"Bearer {registered_driver['token']}"})
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "HELD"
    assert "booking_ref" in data
    assert data["booking_ref"].startswith("PKX-")
    assert "qr_token" in data
    assert data["hold_expires_at"] is not None


@pytest.mark.asyncio
async def test_booking_past_time_rejected(test_client, registered_driver, seed_parking_space):
    veh_resp = await test_client.post("/api/v1/users/me/vehicles", json={
        "plate_number": "MH01TEST002", "vehicle_type": "CAR", "make": "Honda", "model": "City",
    }, headers={"Authorization": f"Bearer {registered_driver['token']}"})
    vehicle_id = veh_resp.json()["id"]

    now = datetime.now(timezone.utc)
    response = await test_client.post("/api/v1/bookings/hold", json={
        "space_id": seed_parking_space["id"],
        "vehicle_id": vehicle_id,
        "start_time": (now - timedelta(hours=2)).isoformat(),  # Past!
        "end_time": (now - timedelta(hours=1)).isoformat(),
    }, headers={"Authorization": f"Bearer {registered_driver['token']}"})
    assert response.status_code in (422, 400)


@pytest.mark.asyncio
async def test_full_booking_flow_mock_payment(test_client, registered_driver, seed_parking_space):
    """Test complete booking → payment → confirmation flow with mock provider."""
    veh_resp = await test_client.post("/api/v1/users/me/vehicles", json={
        "plate_number": "MH01TEST003", "vehicle_type": "CAR", "make": "Hyundai", "model": "i20",
    }, headers={"Authorization": f"Bearer {registered_driver['token']}"})
    vehicle_id = veh_resp.json()["id"]
    token = registered_driver["token"]

    now = datetime.now(timezone.utc)

    # 1. Create hold
    hold_resp = await test_client.post("/api/v1/bookings/hold", json={
        "space_id": seed_parking_space["id"], "vehicle_id": vehicle_id,
        "start_time": (now + timedelta(hours=5)).isoformat(),
        "end_time": (now + timedelta(hours=7)).isoformat(),
    }, headers={"Authorization": f"Bearer {token}"})
    assert hold_resp.status_code == 201
    booking_id = hold_resp.json()["id"]

    # 2. Create payment order
    order_resp = await test_client.post("/api/v1/payments/create-order",
        json={"booking_id": booking_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert order_resp.status_code == 200
    order_data = order_resp.json()
    assert order_data["is_mock"] is True

    # 3. Verify mock payment
    verify_resp = await test_client.post("/api/v1/payments/verify", json={
        "booking_id": booking_id,
        "order_id": order_data["order_id"],
        "payment_id": "mock_pay_001",
        "signature": "mock_signature",  # Mock always accepts
    }, headers={"Authorization": f"Bearer {token}"})
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "confirmed"

    # 4. Check booking is CONFIRMED
    booking_resp = await test_client.get(f"/api/v1/bookings/{booking_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert booking_resp.status_code == 200
    assert booking_resp.json()["status"] == "CONFIRMED"

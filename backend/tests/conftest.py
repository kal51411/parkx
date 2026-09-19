import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from unittest.mock import AsyncMock, MagicMock

import os
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://parkx:password@localhost:5432/parkx_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("PAYMENT_PROVIDER", "mock")
os.environ.setdefault("ENVIRONMENT", "test")

from app.main import app
from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.security import hash_password, create_access_token


@pytest_asyncio.fixture
async def test_client():
    """Async HTTP test client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        yield client


@pytest_asyncio.fixture
async def registered_driver(test_client):
    """Create and return a registered driver user with token."""
    import time
    email = f"driver_{int(time.time())}@test.com"
    response = await test_client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "TestPass@123",
        "full_name": "Test Driver",
        "role": "DRIVER",
    })
    assert response.status_code == 201, f"Registration failed: {response.text}"
    data = response.json()
    return {"user": data["user"], "token": data["access_token"]}


@pytest_asyncio.fixture
async def registered_owner(test_client):
    """Create and return a registered parking owner."""
    import time
    email = f"owner_{int(time.time())}@test.com"
    response = await test_client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "TestPass@123",
        "full_name": "Test Owner",
        "role": "PARKING_OWNER",
    })
    assert response.status_code == 201
    data = response.json()
    return {"user": data["user"], "token": data["access_token"]}


@pytest_asyncio.fixture
async def seed_parking_space(test_client, registered_owner):
    """Create a parking location and space for testing."""
    from datetime import datetime, timedelta, timezone
    owner_token = registered_owner["token"]

    # Create location
    loc_response = await test_client.post(
        "/api/v1/parking/",
        json={
            "name": "Test Parking",
            "address": "123 Test Street, Bandra",
            "latitude": 19.0544,
            "longitude": 72.8402,
            "parking_type": "OPEN",
            "total_spaces": 5,
            "base_hourly_price": 50.0,
            "vehicle_types_allowed": ["CAR"],
        },
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert loc_response.status_code == 201, f"Location creation failed: {loc_response.text}"
    location_id = loc_response.json()["id"]

    # Create space
    space_response = await test_client.post(
        f"/api/v1/parking/{location_id}/spaces",
        json={"space_number": "A-01", "vehicle_type": "CAR"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert space_response.status_code == 201, f"Space creation failed: {space_response.text}"
    return {"id": space_response.json()["id"], "location_id": location_id}


@pytest_asyncio.fixture
async def seed_vehicles(test_client):
    """Create 10 drivers with vehicles, return list of (token, vehicle_id)."""
    import time
    result = []
    for i in range(10):
        email = f"driver_{int(time.time())}_{i}@test.com"
        reg = await test_client.post("/api/v1/auth/register", json={
            "email": email, "password": "TestPass@123", "full_name": f"Driver {i}", "role": "DRIVER",
        })
        token = reg.json()["access_token"]

        veh = await test_client.post("/api/v1/users/me/vehicles", json={
            "plate_number": f"MH01AB{1000+i:04d}",
            "vehicle_type": "CAR", "make": "Maruti", "model": "Swift",
        }, headers={"Authorization": f"Bearer {token}"})
        vehicle_id = veh.json()["id"]
        result.append((token, vehicle_id))
    return result

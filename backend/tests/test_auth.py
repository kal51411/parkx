import pytest


@pytest.mark.asyncio
async def test_register_success(test_client):
    import time
    response = await test_client.post("/api/v1/auth/register", json={
        "email": f"test_{int(time.time())}@parkx.com",
        "password": "SecurePass@123",
        "full_name": "Test User",
        "role": "DRIVER",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "DRIVER"


@pytest.mark.asyncio
async def test_register_duplicate_email(test_client):
    import time
    email = f"dup_{int(time.time())}@parkx.com"
    await test_client.post("/api/v1/auth/register", json={
        "email": email, "password": "Pass@123", "full_name": "User 1",
    })
    response = await test_client.post("/api/v1/auth/register", json={
        "email": email, "password": "Pass@123", "full_name": "User 2",
    })
    assert response.status_code == 422
    assert "already registered" in response.json()["error"]["message"]


@pytest.mark.asyncio
async def test_login_success(test_client, registered_driver):
    response = await test_client.post("/api/v1/auth/login", json={
        "email": registered_driver["user"]["email"],
        "password": "TestPass@123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(test_client, registered_driver):
    response = await test_client.post("/api/v1/auth/login", json={
        "email": registered_driver["user"]["email"],
        "password": "WrongPassword",
    })
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_ERROR"


@pytest.mark.asyncio
async def test_get_me_requires_auth(test_client):
    response = await test_client.get("/api/v1/users/me")
    assert response.status_code == 403  # No bearer token


@pytest.mark.asyncio
async def test_get_me_authenticated(test_client, registered_driver):
    response = await test_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {registered_driver['token']}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == registered_driver["user"]["email"]


@pytest.mark.asyncio
async def test_rbac_driver_cannot_access_admin(test_client, registered_driver):
    response = await test_client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {registered_driver['token']}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_health_endpoint(test_client):
    response = await test_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

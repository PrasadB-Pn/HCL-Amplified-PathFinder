import pytest


@pytest.mark.asyncio
async def test_registration_success(client):
    res = await client.post("/auth/register", json={
        "name": "Alice Bob",
        "email": "alice@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
    })
    assert res.status_code == 201
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice Bob"
    assert "password" not in data["user"]
    # Check HttpOnly cookie
    assert "access_token" in res.cookies or "refresh_token" in res.cookies


@pytest.mark.asyncio
async def test_registration_duplicate_email(client, registered_user):
    res = await client.post("/auth/register", json={
        "name": "Duplicate User",
        "email": registered_user["user"]["email"],
        "password": "AnotherPassword123!",
        "confirm_password": "AnotherPassword123!",
    })
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_registration_password_mismatch(client):
    res = await client.post("/auth/register", json={
        "name": "Mismatch User",
        "email": "mismatch@example.com",
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client, registered_user):
    res = await client.post("/auth/login", json={
        "email": registered_user["user"]["email"],
        "password": registered_user["raw_password"],
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == registered_user["user"]["email"]


@pytest.mark.asyncio
async def test_login_invalid_password_returns_generic_error(client, registered_user):
    res = await client.post("/auth/login", json={
        "email": registered_user["user"]["email"],
        "password": "WrongPassword123!",
    })
    assert res.status_code == 401
    # Generic error message: does not reveal password was wrong vs user not existing
    detail = res.json()["detail"].lower()
    assert "invalid email or password" in detail


@pytest.mark.asyncio
async def test_login_nonexistent_email_returns_identical_generic_error(client):
    res = await client.post("/auth/login", json={
        "email": "nonexistent_person_12345@example.com",
        "password": "AnyPassword123!",
    })
    assert res.status_code == 401
    detail = res.json()["detail"].lower()
    assert "invalid email or password" in detail


@pytest.mark.asyncio
async def test_get_me_authenticated(client, auth_headers, registered_user):
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == registered_user["user"]["email"]
    assert "password" not in data


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    res = await client.get("/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_csrf_token_endpoint(client):
    res = await client.get("/auth/csrf-token")
    assert res.status_code == 200
    assert "csrf_token" in res.json()
    assert "csrf_token" in res.cookies


@pytest.mark.asyncio
async def test_refresh_token_flow(client, registered_user):
    login_res = await client.post("/auth/login", json={
        "email": registered_user["user"]["email"],
        "password": registered_user["raw_password"],
    })
    assert login_res.status_code == 200
    refresh_token = login_res.cookies.get("refresh_token")

    # Refresh using cookie
    refresh_res = await client.post("/auth/refresh", cookies={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert "token" in data
    # Rotated refresh token in cookies
    new_refresh_token = refresh_res.cookies.get("refresh_token")
    assert new_refresh_token is not None


@pytest.mark.asyncio
async def test_logout_clears_cookies(client, auth_headers):
    res = await client.post("/auth/logout", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["success"] is True


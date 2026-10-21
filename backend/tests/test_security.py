import pytest
from app.config import Settings


@pytest.mark.asyncio
async def test_health_and_readiness_endpoints(client):
    health_res = await client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "ok"

    ready_res = await client.get("/ready")
    assert ready_res.status_code == 200
    data = ready_res.json()
    assert data["status"] == "ready"
    assert data.get("database") in ["ok", "connected"]


@pytest.mark.asyncio
async def test_security_headers_present(client):
    res = await client.get("/health")
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert res.headers.get("x-frame-options") == "DENY"
    assert "default-src 'self'" in res.headers.get("content-security-policy", "")
    assert res.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_cors_origin_headers(client):
    # Allowed origin
    res = await client.options(
        "/auth/login",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res.headers.get("access-control-allow-credentials") == "true"

    # Disallowed origin
    res_disallowed = await client.options(
        "/auth/login",
        headers={
            "Origin": "https://malicious-website.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_disallowed.headers.get("access-control-allow-origin") != "https://malicious-website.com"


def test_production_secret_validation_rejects_weak_secrets(monkeypatch):
    # Production with short secret must raise ValueError
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("JWT_SECRET", "too-short")
    with pytest.raises(ValueError, match="at least 32 bytes"):
        Settings()

    # Production with default placeholder must raise ValueError
    monkeypatch.setenv("JWT_SECRET", "GENERATE_A_LONG_RANDOM_SECRET_AT_LEAST_32_BYTES")
    with pytest.raises(ValueError, match="known default or placeholder"):
        Settings()

    # Production with valid 32-byte secret succeeds
    monkeypatch.setenv("JWT_SECRET", "a" * 32)
    monkeypatch.setenv("CORS_ORIGINS", "https://my-app.vercel.app")
    valid = Settings()
    assert valid.is_production is True

import os
import sys
from pathlib import Path
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

# Ensure backend directory is in sys.path
TESTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TESTS_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Set test environment variables
os.environ["ENVIRONMENT"] = "development"
os.environ["MONGODB_URI"] = "mongodb://localhost:27017/test_db"
os.environ["MONGODB_DATABASE"] = "pathfinder_test"
os.environ["JWT_SECRET"] = "super_secret_test_key_at_least_32_bytes_long_12345"
os.environ["JWT_ACCESS_EXPIRE_MINUTES"] = "15"
os.environ["JWT_REFRESH_EXPIRE_DAYS"] = "7"
os.environ["CORS_ORIGINS"] = "http://localhost:5173,http://localhost:3000"
os.environ["SEMANTIC_SEARCH_ENABLED"] = "false"

from app.main import app
import app.database as db_module

@pytest.fixture(scope="session")
def mock_mongo_client():
    client = AsyncMongoMockClient()
    return client

@pytest.fixture(autouse=True)
def patch_database(monkeypatch, mock_mongo_client):
    """Patch database calls to use in-memory mongomock."""
    mock_db = mock_mongo_client["pathfinder_test"]
    monkeypatch.setattr(db_module, "get_client", lambda: mock_mongo_client)
    monkeypatch.setattr(db_module, "get_database", lambda: mock_db)
    monkeypatch.setattr(db_module, "get_collection", lambda name: mock_db[name])
    return mock_db

@pytest_asyncio.fixture(autouse=True)
async def clean_database(patch_database):
    """Clean all collections and reset rate limiter before each test."""
    from app.dependencies import auth_rate_limiter
    auth_rate_limiter.reset()
    collections = await patch_database.list_collection_names()
    for col_name in collections:
        await patch_database[col_name].delete_many({})
    yield
    auth_rate_limiter.reset()

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

@pytest_asyncio.fixture
async def registered_user(client):
    """Register and return a confirmed user test dict."""
    user_data = {
        "name": "Jane Tester",
        "email": "jane@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    res = await client.post("/auth/register", json=user_data)
    assert res.status_code == 201
    return {**res.json(), "raw_password": user_data["password"]}

@pytest_asyncio.fixture
async def auth_headers(client, registered_user):
    """Return Authorization Bearer headers for the test user."""
    res = await client.post("/auth/login", json={
        "email": registered_user["user"]["email"],
        "password": registered_user["raw_password"],
    })
    assert res.status_code == 200
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}

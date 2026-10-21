from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        if settings.mongodb_uri.startswith(("mongomock://", "mock://")):
            if settings.is_production:
                raise ValueError("In-memory/mock MongoDB cannot be used in production environment.")
            try:
                from mongomock_motor import AsyncMongoMockClient
                _client = AsyncMongoMockClient()
            except ImportError as err:
                raise RuntimeError("mongomock-motor must be installed to use mongomock URI in development.") from err
        else:
            _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_database():
    return get_client()[settings.mongodb_database]


async def close_database():
    global _client
    if _client:
        _client.close()
        _client = None


def get_collection(name: str):
    return get_database()[name]

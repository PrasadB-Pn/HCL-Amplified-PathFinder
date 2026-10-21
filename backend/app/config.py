from __future__ import annotations

import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

KNOWN_INSECURE_SECRETS = {
    "change-this-secret",
    "secret",
    "default",
    "GENERATE_A_LONG_RANDOM_SECRET_AT_LEAST_32_BYTES",
    "course_recommender_secret_2024",
    "secret_key",
    "jwt_secret",
    "your-secret-key-here",
}


class Settings(BaseSettings):
    environment: str = Field(default="development", alias="ENVIRONMENT")
    mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_database: str = Field(default="pathfinder", alias="MONGODB_DATABASE")

    jwt_secret: str = Field(default="change-this-secret-32-bytes-minimum-dev-only", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expire_minutes: int = Field(default=15, alias="JWT_ACCESS_EXPIRE_MINUTES")
    jwt_refresh_expire_days: int = Field(default=7, alias="JWT_REFRESH_EXPIRE_DAYS")

    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
        alias="CORS_ORIGINS"
    )
    semantic_search_enabled: bool = Field(default=False, alias="SEMANTIC_SEARCH_ENABLED")

    cookie_secure: Optional[bool] = Field(default=None, alias="COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", alias="COOKIE_SAMESITE")
    cookie_domain: Optional[str] = Field(default=None, alias="COOKIE_DOMAIN")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def resolved_cookie_secure(self) -> bool:
        if self.cookie_secure is not None:
            return self.cookie_secure
        return self.is_production

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="before")
    @classmethod
    def resolve_mongo_env_var(cls, values: dict) -> dict:
        # Standardize on MONGODB_URI everywhere while gracefully handling legacy MONGO_URI
        if isinstance(values, dict):
            if "MONGODB_URI" not in values and "MONGO_URI" in values:
                values["MONGODB_URI"] = values["MONGO_URI"]
        # Also check os.environ for MONGO_URI if MONGODB_URI is not set
        if "MONGODB_URI" not in os.environ and "MONGO_URI" in os.environ:
            os.environ["MONGODB_URI"] = os.environ["MONGO_URI"]
        return values

    @model_validator(mode="after")
    def validate_production_settings(self) -> Settings:
        if self.is_production:
            if not self.jwt_secret or len(self.jwt_secret.encode("utf-8")) < 32:
                raise ValueError("JWT_SECRET must be at least 32 bytes in production")
            if self.jwt_secret in KNOWN_INSECURE_SECRETS:
                raise ValueError("JWT_SECRET cannot be a known default or placeholder value in production")
            if "*" in self.cors_origins_list:
                raise ValueError("CORS_ORIGINS cannot contain '*' with credentials enabled in production")
        return self

    model_config = {
        "env_file": (
            str(Path(__file__).resolve().parent.parent / ".env"),
            ".env",
        ),
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
        "extra": "ignore"
    }


settings = Settings()

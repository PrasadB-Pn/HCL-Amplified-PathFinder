from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from typing import Callable

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.database import close_database, get_database
from app.routers import (
    ai_guide,
    auth,
    progress,
    projects,
    recommendations,
    resources,
    routes,
    skills,
    users,
)

# ── Structured Logging Setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("routemaster")


# ── Lifespan Manager ──────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RouteMaster API (environment=%s)", settings.environment)
    try:
        db = get_database()
        await db["users"].create_index("email", unique=True, background=True)
        await db["routes"].create_index([("user_id", 1), ("is_current", 1)], background=True)
        await db["progress"].create_index("user_id", unique=True, background=True)
        logger.info("Database indexes verified successfully")
    except Exception as exc:
        logger.warning("Database index check deferred (Atlas connection pending): %s", type(exc).__name__)
    yield
    await close_database()
    logger.info("RouteMaster API shutdown complete")


app = FastAPI(
    title="RouteMaster API",
    version="1.0.0",
    description="AI Career PathFinder — Enterprise Full-Stack API",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)


# ── Middleware 1: Security Headers ────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        if settings.resolved_cookie_secure:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


# ── Middleware 2: Request Size Limiter ────────────────────────────────────────
class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    MAX_BYTES = 1024 * 1024  # 1 MB limit

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BYTES:
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": "Request payload exceeds size limit (1 MB)."},
            )
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)

# ── CORS Middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "Accept"],
    expose_headers=["X-CSRF-Token", "Retry-After"],
)


# ── Global Safe Error Handler ─────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Internal error processing request %s %s: %s", request.method, request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(routes.router)
app.include_router(skills.router)
app.include_router(resources.router)
app.include_router(projects.router)
app.include_router(progress.router)
app.include_router(recommendations.router)
app.include_router(ai_guide.router)


# ── Health & Readiness Endpoints ──────────────────────────────────────────────
@app.get("/health")
async def health():
    """Simple liveness probe."""
    return {"status": "ok", "service": "RouteMaster API", "environment": settings.environment}


@app.get("/ready")
async def ready():
    """Readiness probe that validates MongoDB Atlas connectivity."""
    try:
        import asyncio
        db = get_database()
        # Fast 3-second ping
        await asyncio.wait_for(db.command("ping"), timeout=3.0)
        return {"status": "ready", "database": "connected"}
    except Exception as exc:
        logger.error("Readiness check failed: %s", type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "database": "disconnected"},
        )

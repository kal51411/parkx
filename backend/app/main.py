import time
import uuid
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text, select

from app.core.config import settings
from app.core.database import engine, AsyncSessionLocal
from app.core.redis_client import get_redis, close_redis
from app.core.exceptions import (
    ParkXException, parkx_exception_handler,
    http_exception_handler, validation_exception_handler,
)
from app.api.v1.router import router

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("parkx_starting", environment=settings.ENVIRONMENT)
    try:
        await get_redis()  # Warm up Redis connection
    except Exception as e:
        logger.warning("redis_warmup_warning", error=str(e))

    # Auto-ensure PostGIS extensions, tables, and demo seed data
    try:
        from app.models.base import Base
        import app.models  # load all models
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_ensured")

        # Check if database has users, otherwise seed demo spots
        from app.models.user import User
        async with AsyncSessionLocal() as session:
            check_res = await session.execute(select(User).limit(1))
            if not check_res.scalar_one_or_none():
                logger.info("seeding_initial_mumbai_parking_data")
                from app.core.seed_data import run_auto_seed
                await run_auto_seed(session)
    except Exception as e:
        logger.error("startup_db_init_failed", error=str(e))

    yield
    # Shutdown
    await close_redis()
    await engine.dispose()
    logger.info("parkx_stopped")


app = FastAPI(
    title="ParkX API",
    description="Real-time parking marketplace for Mumbai. Find, reserve, and manage parking spaces.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS: allow Vercel production, preview deployments, custom domains, and local dev
cors_allowed = list(set(settings.cors_origins_list + [
    "https://parkx-pink.vercel.app",
    "https://parkx.vercel.app",
    "http://localhost:3000",
]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allowed,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    latency_ms = round((time.time() - start_time) * 1000, 2)
    user_id = getattr(request.state, "user_id", None)

    logger.info(
        "http_request",
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        latency_ms=latency_ms,
        user_id=str(user_id) if user_id else None,
    )
    response.headers["X-Request-ID"] = request_id
    return response


# Exception handlers
from fastapi import HTTPException
app.add_exception_handler(ParkXException, parkx_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Routes
app.include_router(router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "parkx-api", "version": settings.APP_VERSION}


@app.get("/ready", tags=["Health"])
async def ready():
    db_ok = False
    redis_ok = False

    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error("db_health_check_failed", error=str(e))

    try:
        redis = await get_redis()
        await redis.ping()
        redis_ok = True
    except Exception as e:
        logger.error("redis_health_check_failed", error=str(e))

    status_code = 200 if (db_ok and redis_ok) else 503
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status_code,
        content={"status": "ready" if (db_ok and redis_ok) else "not_ready", "db": db_ok, "redis": redis_ok},
    )

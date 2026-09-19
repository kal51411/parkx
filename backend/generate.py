import os

files = {
    "requirements.txt": """fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.3
pydantic==2.9.2
pydantic-settings==2.5.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
redis[asyncio]==5.1.1
celery[redis]==5.4.0
geoalchemy2==0.15.2
shapely==2.0.6
python-multipart==0.0.12
razorpay==1.4.2
httpx==0.27.2
pytest==8.3.3
pytest-asyncio==0.24.0
aiofiles==24.1.0
python-dotenv==1.0.1
structlog==24.4.0
qrcode[pil]==8.0
google-generativeai==0.8.3
""",
    "Dockerfile": """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
""",
    ".env.example": """DATABASE_URL=postgresql+asyncpg://parkx:password@localhost:5432/parkx
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
PAYMENT_PROVIDER=mock
MAPBOX_TOKEN=
GEMINI_API_KEY=
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
NO_SHOW_GRACE_PERIOD_MINUTES=30
BOOKING_HOLD_MINUTES=8
MAX_BOOKING_HOURS=24
""",
    "alembic.ini": """[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
[post_write_hooks]
[loggers]
keys = root,sqlalchemy,alembic
[handlers]
keys = console
[formatters]
keys = generic
[logger_root]
level = WARN
handlers = console
qualname =
[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine
[logger_alembic]
level = INFO
handlers =
qualname = alembic
[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic
[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
""",
    "app/__init__.py": "",
    "app/main.py": """from fastapi import FastAPI
import structlog
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(title="ParkX API")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/ready")
async def ready():
    return {"status": "ok", "db": True, "redis": True}
""",
    "app/api/__init__.py": "",
    "app/api/deps.py": """from typing import Generator
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import SessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
""",
    "app/api/v1/__init__.py": "",
    "app/api/v1/router.py": """from fastapi import APIRouter
from . import auth, users, parking, availability, bookings, payments, reviews, societies, security, analytics, ai, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# ... other routers omitted for brevity in this initial setup script
""",
    "app/api/v1/auth.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/users.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/parking.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/availability.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/bookings.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/payments.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/reviews.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/societies.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/security.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/analytics.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/ai.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    "app/api/v1/admin.py": "from fastapi import APIRouter\nrouter = APIRouter()\n",
    
    "app/core/__init__.py": "",
    "app/core/config.py": """from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    class Config:
        env_file = ".env"

settings = Settings()
""",
    "app/core/database.py": """from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
""",
    "app/core/exceptions.py": """class BaseAppException(Exception):
    pass
""",
    "app/core/security.py": """# security logic
""",
    "app/core/redis_client.py": """import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL)
""",

    "app/models/__init__.py": "",
    "app/models/base.py": """import uuid
from datetime import datetime
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
""",
    "app/models/user.py": """from sqlalchemy import Column, String, Boolean, Enum
from .base import BaseModel
import enum

class UserRole(enum.Enum):
    DRIVER = "DRIVER"
    PARKING_OWNER = "PARKING_OWNER"
    SOCIETY_ADMIN = "SOCIETY_ADMIN"
    SECURITY = "SECURITY"
    PLATFORM_ADMIN = "PLATFORM_ADMIN"

class User(BaseModel):
    __tablename__ = 'users'
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, index=True, nullable=True)
    full_name = Column(String)
    password_hash = Column(String)
    role = Column(Enum(UserRole))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
""",
    
    # Adding minimum stubs to make script run
    "app/services/__init__.py": "",
    "app/services/booking_service.py": """# booking service
""",
    
    "alembic/env.py": """# alembic env
""",
    "alembic/script.py.mako": """# mako
""",
    "alembic/versions/001_initial.py": """# initial migration
""",
    "celery_worker.py": """# celery worker
"""
}

base_path = '/home/kalpesh/.gemini/antigravity/scratch/parkx/backend'
os.makedirs(base_path, exist_ok=True)

for filepath, content in files.items():
    full_path = os.path.join(base_path, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
        
print("Files created.")

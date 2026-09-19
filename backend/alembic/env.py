from app.core.config import settings

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect them
from app.models.base import Base
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.society import Society, SocietyMember
from app.models.parking import ParkingLocation, ParkingSpace, ParkingImage
from app.models.availability import ParkingAvailability, PricingRule
from app.models.booking import Booking, BookingEvent
from app.models.payment import Payment
from app.models.review import Review
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.security_staff import SecurityStaff

target_metadata = Base.metadata

def get_url():
    return settings.DATABASE_URL.replace("+asyncpg", "").replace("+psycopg", "")


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

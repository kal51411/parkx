"""Initial database migration — creates all ParkX tables with PostGIS support.

Revision ID: 001_initial
Revises:
Create Date: 2024-01-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from geoalchemy2 import Geometry

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Enums
    op.execute("CREATE TYPE user_role AS ENUM ('DRIVER','PARKING_OWNER','SOCIETY_ADMIN','SECURITY','PLATFORM_ADMIN')")
    op.execute("CREATE TYPE vehicle_type AS ENUM ('TWO_WHEELER','CAR','SUV','VAN','TRUCK')")
    op.execute("CREATE TYPE parking_type AS ENUM ('OPEN','COVERED','BASEMENT','MULTILEVEL','STREET','VALET')")
    op.execute("CREATE TYPE parking_status AS ENUM ('PENDING_VERIFICATION','UNDER_REVIEW','VERIFIED','SUSPENDED','REJECTED')")
    op.execute("CREATE TYPE space_status AS ENUM ('AVAILABLE','OCCUPIED','MAINTENANCE','RESERVED')")
    op.execute("CREATE TYPE cancellation_policy AS ENUM ('FLEXIBLE','MODERATE','STRICT')")
    op.execute("CREATE TYPE booking_status AS ENUM ('PENDING','HELD','PAYMENT_PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','EXPIRED','NO_SHOW','DISPUTED')")
    op.execute("CREATE TYPE booking_event_type AS ENUM ('CREATED','HELD','PAYMENT_INITIATED','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','EXPIRED','NO_SHOW','DISPUTED')")
    op.execute("CREATE TYPE payment_status AS ENUM ('PENDING','PROCESSING','CAPTURED','FAILED','REFUNDED','PARTIALLY_REFUNDED')")
    op.execute("CREATE TYPE payment_provider AS ENUM ('RAZORPAY','MOCK')")
    op.execute("CREATE TYPE notification_type AS ENUM ('BOOKING_CONFIRMED','BOOKING_CANCELLED','PAYMENT_CONFIRMED','PARKING_TIME_APPROACHING','BOOKING_EXPIRED','NO_SHOW','CHECK_IN','CHECK_OUT','REVIEW_REQUEST','LISTING_VERIFIED','LISTING_REJECTED','NEW_BOOKING')")
    op.execute("CREATE TYPE pricing_rule_type AS ENUM ('BASE','PEAK','WEEKEND','DYNAMIC')")
    op.execute("CREATE TYPE member_role AS ENUM ('ADMIN','RESIDENT','STAFF')")

    # users
    op.create_table("users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("DRIVER","PARKING_OWNER","SOCIETY_ADMIN","SECURITY","PLATFORM_ADMIN", name="user_role"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_phone", "users", ["phone"])

    # vehicles
    op.create_table("vehicles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plate_number", sa.String(20), nullable=False, unique=True),
        sa.Column("vehicle_type", sa.Enum("TWO_WHEELER","CAR","SUV","VAN","TRUCK", name="vehicle_type"), nullable=False),
        sa.Column("make", sa.String(100), nullable=False),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # societies
    op.create_table("societies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("city", sa.String(100), nullable=False, server_default="Mumbai"),
        sa.Column("admin_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("total_spaces", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("public_spaces", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # parking_locations
    op.create_table("parking_locations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("society_id", UUID(as_uuid=True), sa.ForeignKey("societies.id"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False, server_default="Mumbai"),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column("geom", Geometry("POINT", srid=4326), nullable=True),
        sa.Column("parking_type", sa.Enum("OPEN","COVERED","BASEMENT","MULTILEVEL","STREET","VALET", name="parking_type"), nullable=False),
        sa.Column("status", sa.Enum("PENDING_VERIFICATION","UNDER_REVIEW","VERIFIED","SUSPENDED","REJECTED", name="parking_status"), nullable=False, server_default="PENDING_VERIFICATION"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("total_spaces", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("vehicle_types_allowed", ARRAY(sa.String()), nullable=True),
        sa.Column("amenities", JSONB(), nullable=True),
        sa.Column("operating_hours", JSONB(), nullable=True),
        sa.Column("cancellation_policy", sa.Enum("FLEXIBLE","MODERATE","STRICT", name="cancellation_policy"), nullable=False, server_default="MODERATE"),
        sa.Column("base_hourly_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("base_daily_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("average_rating", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("total_reviews", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.execute("CREATE INDEX idx_parking_geom ON parking_locations USING GIST(geom)")
    op.create_index("idx_parking_status", "parking_locations", ["status"])
    op.create_index("idx_parking_owner", "parking_locations", ["owner_id"])

    # parking_spaces
    op.create_table("parking_spaces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("space_number", sa.String(20), nullable=False),
        sa.Column("floor", sa.String(20), nullable=True),
        sa.Column("vehicle_type", sa.Enum("TWO_WHEELER","CAR","SUV","VAN","TRUCK", name="vehicle_type"), nullable=False, server_default="CAR"),
        sa.Column("is_covered", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("has_ev_charging", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("status", sa.Enum("AVAILABLE","OCCUPIED","MAINTENANCE","RESERVED", name="space_status"), nullable=False, server_default="AVAILABLE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_spaces_location", "parking_spaces", ["location_id"])

    # parking_images
    op.create_table("parking_images",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(1000), nullable=False),
        sa.Column("caption", sa.String(255), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # parking_availability
    op.create_table("parking_availability",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("space_id", UUID(as_uuid=True), sa.ForeignKey("parking_spaces.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False, server_default="-1"),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # pricing_rules
    op.create_table("pricing_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("parking_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule_type", sa.Enum("BASE","PEAK","WEEKEND","DYNAMIC", name="pricing_rule_type"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("price_multiplier", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("flat_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # bookings
    op.create_table("bookings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("booking_ref", sa.String(30), nullable=False, unique=True),
        sa.Column("driver_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("space_id", UUID(as_uuid=True), sa.ForeignKey("parking_spaces.id"), nullable=False),
        sa.Column("vehicle_id", UUID(as_uuid=True), sa.ForeignKey("vehicles.id"), nullable=False),
        sa.Column("status", sa.Enum("PENDING","HELD","PAYMENT_PENDING","CONFIRMED","CHECKED_IN","COMPLETED","CANCELLED","EXPIRED","NO_SHOW","DISPUTED", name="booking_status"), nullable=False, server_default="PENDING"),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actual_check_in", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_check_out", sa.DateTime(timezone=True), nullable=True),
        sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("pricing_multiplier", sa.Float(), nullable=False, server_default="1.0"),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("qr_token", sa.String(100), nullable=False, unique=True),
        sa.Column("hold_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("cancelled_by", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_bookings_driver", "bookings", ["driver_id"])
    op.create_index("idx_bookings_space", "bookings", ["space_id"])
    op.create_index("idx_bookings_status", "bookings", ["status"])
    op.create_index("idx_bookings_times", "bookings", ["start_time", "end_time"])
    op.create_index("idx_bookings_qr_token", "bookings", ["qr_token"])

    # booking_events
    op.create_table("booking_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("booking_id", UUID(as_uuid=True), sa.ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.Enum("CREATED","HELD","PAYMENT_INITIATED","CONFIRMED","CHECKED_IN","CHECKED_OUT","CANCELLED","EXPIRED","NO_SHOW","DISPUTED", name="booking_event_type"), nullable=False),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # payments
    op.create_table("payments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("booking_id", UUID(as_uuid=True), sa.ForeignKey("bookings.id"), nullable=False, unique=True),
        sa.Column("provider", sa.Enum("RAZORPAY","MOCK", name="payment_provider"), nullable=False),
        sa.Column("provider_order_id", sa.String(255), nullable=False, unique=True),
        sa.Column("provider_payment_id", sa.String(255), nullable=True),
        sa.Column("provider_signature", sa.String(500), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="INR"),
        sa.Column("status", sa.Enum("PENDING","PROCESSING","CAPTURED","FAILED","REFUNDED","PARTIALLY_REFUNDED", name="payment_status"), nullable=False, server_default="PENDING"),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("refund_id", sa.String(255), nullable=True),
        sa.Column("refund_amount", sa.Numeric(10, 2), nullable=True),
        sa.Column("refunded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # reviews
    op.create_table("reviews",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("booking_id", UUID(as_uuid=True), sa.ForeignKey("bookings.id"), nullable=False, unique=True),
        sa.Column("driver_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("parking_locations.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("owner_reply", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )

    # society_members
    op.create_table("society_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("society_id", UUID(as_uuid=True), sa.ForeignKey("societies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("member_role", sa.Enum("ADMIN","RESIDENT","STAFF", name="member_role"), nullable=False, server_default="RESIDENT"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("society_id", "user_id", name="uq_society_member"),
    )

    # security_staff
    op.create_table("security_staff",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("location_id", UUID(as_uuid=True), sa.ForeignKey("parking_locations.id"), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # notifications
    op.create_table("notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.Enum("BOOKING_CONFIRMED","BOOKING_CANCELLED","PAYMENT_CONFIRMED","PARKING_TIME_APPROACHING","BOOKING_EXPIRED","NO_SHOW","CHECK_IN","CHECK_OUT","REVIEW_REQUEST","LISTING_VERIFIED","LISTING_REJECTED","NEW_BOOKING", name="notification_type"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.String(1000), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_notifications_user", "notifications", ["user_id"])

    # audit_logs
    op.create_table("audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=True),
        sa.Column("entity_id", UUID(as_uuid=True), nullable=True),
        sa.Column("ip_address", sa.String(50), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    tables = [
        "audit_logs", "notifications", "security_staff", "society_members",
        "reviews", "payments", "booking_events", "bookings", "pricing_rules",
        "parking_availability", "parking_images", "parking_spaces",
        "parking_locations", "societies", "vehicles", "users",
    ]
    for table in tables:
        op.drop_table(table)

    enums = [
        "user_role", "vehicle_type", "parking_type", "parking_status",
        "space_status", "cancellation_policy", "booking_status",
        "booking_event_type", "payment_status", "payment_provider",
        "notification_type", "pricing_rule_type", "member_role",
    ]
    for enum in enums:
        op.execute(f"DROP TYPE IF EXISTS {enum}")

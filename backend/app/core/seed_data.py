import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleType
from app.models.parking import ParkingLocation, ParkingSpace, ParkingType, ParkingStatus, SpaceStatus
from app.core.security import hash_password
import structlog

logger = structlog.get_logger(__name__)


async def run_auto_seed(db: AsyncSession):
    """Seed minimal initial Mumbai users, vehicles, and parking locations if DB is empty."""
    try:
        # Admin
        admin = User(
            email="admin@parkx.in",
            password_hash=hash_password("Admin@123"),
            full_name="Platform Admin",
            role=UserRole.PLATFORM_ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # Driver
        driver = User(
            email="driver1@test.com",
            password_hash=hash_password("Driver@123"),
            full_name="Rahul Sharma",
            phone="+91-9876543210",
            role=UserRole.DRIVER,
            is_active=True,
            is_verified=True,
        )
        db.add(driver)

        # Owner
        owner = User(
            email="owner1@parkx.in",
            password_hash=hash_password("Owner@123"),
            full_name="Suresh Kumar",
            role=UserRole.PARKING_OWNER,
            is_active=True,
            is_verified=True,
        )
        db.add(owner)

        # Security
        security = User(
            email="security1@parkx.in",
            password_hash=hash_password("Security@123"),
            full_name="Ramesh Guard",
            role=UserRole.SECURITY,
            is_active=True,
            is_verified=True,
        )
        db.add(security)

        await db.flush()

        # Vehicle
        veh = Vehicle(
            owner_id=driver.id,
            plate_number="MH 02 CZ 9021",
            vehicle_type=VehicleType.CAR,
            make="Maruti Suzuki",
            model="Swift",
            is_primary=True,
            is_active=True,
        )
        db.add(veh)

        # Locations in Mumbai
        sample_locs = [
            {
                "name": "BKC Diamond Bourse & Corporate Parking",
                "address": "G-Block, Bandra Kurla Complex, Bandra East, Mumbai 400051",
                "lat": 19.0658,
                "lng": 72.8695,
                "price": 60.0,
                "spaces": 50,
                "type": ParkingType.MULTILEVEL,
            },
            {
                "name": "Hill Road Shoppers Bay & Basement",
                "address": "Hill Road, Near Elco Market, Bandra West, Mumbai 400050",
                "lat": 19.0544,
                "lng": 72.8402,
                "price": 50.0,
                "spaces": 30,
                "type": ParkingType.BASEMENT,
            },
            {
                "name": "Andheri East Metro Hub Parking",
                "address": "Andheri-Kurla Road, Marol Naka, Andheri East, Mumbai 400059",
                "lat": 19.1136,
                "lng": 72.8697,
                "price": 45.0,
                "spaces": 40,
                "type": ParkingType.COVERED,
            },
            {
                "name": "Hiranandani Gardens & Tech Park Lot",
                "address": "Central Avenue, Hiranandani Gardens, Powai, Mumbai 400076",
                "lat": 19.1183,
                "lng": 72.9067,
                "price": 55.0,
                "spaces": 35,
                "type": ParkingType.COVERED,
            },
            {
                "name": "Lower Parel Palladium & Phoenix Deck",
                "address": "Senapati Bapat Marg, Lower Parel, Mumbai 400013",
                "lat": 18.9971,
                "lng": 72.8260,
                "price": 75.0,
                "spaces": 60,
                "type": ParkingType.MULTILEVEL,
            },
            {
                "name": "Marine Drive & Nariman Point Parking",
                "address": "Madame Cama Road, Nariman Point, Mumbai 400021",
                "lat": 18.9298,
                "lng": 72.8235,
                "price": 80.0,
                "spaces": 25,
                "type": ParkingType.OPEN,
            },
        ]

        for s in sample_locs:
            loc = ParkingLocation(
                owner_id=owner.id,
                name=s["name"],
                address=s["address"],
                city="Mumbai",
                latitude=s["lat"],
                longitude=s["lng"],
                parking_type=s["type"],
                status=ParkingStatus.VERIFIED,
                total_spaces=s["spaces"],
                base_hourly_price=s["price"],
                average_rating=4.8,
                total_reviews=24,
                is_demo=True,
                amenities={"cctv": True, "security": True, "ev_charging": True, "covered": True},
            )
            db.add(loc)
            await db.flush()

            # Add spaces
            for i in range(1, 6):
                sp = ParkingSpace(
                    location_id=loc.id,
                    space_number=f"A-{i:02d}",
                    vehicle_type=VehicleType.CAR,
                    is_covered=True,
                    has_ev_charging=(i == 1),
                    status=SpaceStatus.AVAILABLE,
                )
                db.add(sp)

        await db.commit()
        logger.info("auto_seed_completed_successfully")
    except Exception as e:
        await db.rollback()
        logger.error("auto_seed_error", error=str(e))

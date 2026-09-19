#!/usr/bin/env python3
import os
import sys
import argparse
import psycopg2
import bcrypt
import subprocess
from datetime import datetime, timedelta
import random
import uuid
import json

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Mock data definitions
users = [
    # Platform Admin
    {'email': 'admin@parkx.in', 'password': 'Admin@123', 'full_name': 'Platform Admin', 'role': 'PLATFORM_ADMIN'},
    # Drivers
    {'email': 'driver1@test.com', 'password': 'Driver@123', 'full_name': 'Rahul Sharma', 'role': 'DRIVER', 'phone': '+91-9876543210'},
    {'email': 'driver2@test.com', 'password': 'Driver@123', 'full_name': 'Priya Patel', 'role': 'DRIVER', 'phone': '+91-9876543211'},
    {'email': 'driver3@test.com', 'password': 'Driver@123', 'full_name': 'Amit Verma', 'role': 'DRIVER', 'phone': '+91-9876543212'},
    {'email': 'driver4@test.com', 'password': 'Driver@123', 'full_name': 'Sunita Mehta', 'role': 'DRIVER', 'phone': '+91-9876543213'},
    # Parking Owners
    {'email': 'owner1@parkx.in', 'password': 'Owner@123', 'full_name': 'Suresh Kumar', 'role': 'PARKING_OWNER'},
    {'email': 'owner2@parkx.in', 'password': 'Owner@123', 'full_name': 'Anjali Singh', 'role': 'PARKING_OWNER'},
    {'email': 'owner3@parkx.in', 'password': 'Owner@123', 'full_name': 'Vijay Nair', 'role': 'PARKING_OWNER'},
    # Society Admins
    {'email': 'society1@parkx.in', 'password': 'Society@123', 'full_name': 'Ravi Khatri', 'role': 'SOCIETY_ADMIN'},
    {'email': 'society2@parkx.in', 'password': 'Society@123', 'full_name': 'Meera Joshi', 'role': 'SOCIETY_ADMIN'},
    # Security Staff
    {'email': 'security1@parkx.in', 'password': 'Security@123', 'full_name': 'Ramesh Guard', 'role': 'SECURITY'},
    {'email': 'security2@parkx.in', 'password': 'Security@123', 'full_name': 'Dinesh Guard', 'role': 'SECURITY'},
]

locations = [
    {
        'name': 'BKC Corporate Parking', 'address': 'Bandra Kurla Complex, Bandra East, Mumbai 400051',
        'latitude': 19.0658, 'longitude': 72.8695, 'type': 'COVERED', 'status': 'VERIFIED',
        'total_spaces': 50, 'base_hourly_price': 60,
        'amenities': {'ev_charging': True, 'cctv': True, 'security': True, 'covered': True, '24_hours': True},
        'owner': 'owner1@parkx.in'
    },
    {
        'name': 'Bandra Station Road Parking', 'address': 'Station Road, Bandra West, Mumbai 400050',
        'latitude': 19.0544, 'longitude': 72.8402, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 30, 'base_hourly_price': 40,
        'amenities': {'cctv': True, 'security': False, 'covered': False},
        'owner': 'owner2@parkx.in'
    },
    {
        'name': 'Hill Road Shopping Parking', 'address': 'Hill Road, Bandra West, Mumbai 400050',
        'latitude': 19.0528, 'longitude': 72.8347, 'type': 'BASEMENT', 'status': 'VERIFIED',
        'total_spaces': 25, 'base_hourly_price': 50,
        'amenities': {'cctv': True, 'security': True, 'covered': True},
        'owner': 'owner3@parkx.in'
    },
    {
        'name': 'Carter Road Parking Hub', 'address': 'Carter Road, Bandra West, Mumbai 400050',
        'latitude': 19.0614, 'longitude': 72.8287, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 20, 'base_hourly_price': 35,
        'amenities': {'cctv': False, 'security': False},
        'owner': 'owner1@parkx.in'
    },
    {
        'name': 'Andheri East Metro Parking', 'address': 'Marol Naka, Andheri East, Mumbai 400059',
        'latitude': 19.1136, 'longitude': 72.8697, 'type': 'MULTILEVEL', 'status': 'VERIFIED',
        'total_spaces': 80, 'base_hourly_price': 50,
        'amenities': {'ev_charging': True, 'cctv': True, 'security': True, 'covered': True, '24_hours': True},
        'owner': 'owner2@parkx.in'
    },
    {
        'name': 'Andheri West Link Road Parking', 'address': 'Link Road, Andheri West, Mumbai 400053',
        'latitude': 19.1197, 'longitude': 72.8464, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 40, 'base_hourly_price': 45,
        'amenities': {'cctv': True, 'security': False},
        'owner': 'owner3@parkx.in'
    },
    {
        'name': 'MIDC Andheri Industrial Parking', 'address': 'MIDC, Andheri East, Mumbai 400093',
        'latitude': 19.1052, 'longitude': 72.8784, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 60, 'base_hourly_price': 30,
        'amenities': {'security': True, 'cctv': True},
        'owner': 'owner1@parkx.in'
    },
    {
        'name': 'Hiranandani Gardens Parking', 'address': 'Hiranandani Gardens, Powai, Mumbai 400076',
        'latitude': 19.1183, 'longitude': 72.9067, 'type': 'COVERED', 'status': 'VERIFIED',
        'total_spaces': 35, 'base_hourly_price': 55,
        'amenities': {'ev_charging': True, 'cctv': True, 'security': True, 'covered': True, 'washroom': True},
        'owner': 'owner2@parkx.in'
    },
    {
        'name': 'Powai Lake View Parking', 'address': 'Central Avenue, Powai, Mumbai 400076',
        'latitude': 19.1174, 'longitude': 72.8995, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 25, 'base_hourly_price': 40,
        'amenities': {'cctv': True},
        'owner': 'owner3@parkx.in'
    },
    {
        'name': 'Lower Parel Palladium Parking', 'address': 'High Street Phoenix, Lower Parel, Mumbai 400013',
        'latitude': 18.9971, 'longitude': 72.8260, 'type': 'MULTILEVEL', 'status': 'VERIFIED',
        'total_spaces': 100, 'base_hourly_price': 80,
        'amenities': {'ev_charging': True, 'cctv': True, 'security': True, 'covered': True, 'valet': True, 'washroom': True, '24_hours': True},
        'owner': 'owner1@parkx.in'
    },
    {
        'name': 'Worli Sea Face Parking', 'address': 'Dr. Annie Besant Road, Worli, Mumbai 400018',
        'latitude': 19.0122, 'longitude': 72.8218, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 45, 'base_hourly_price': 50,
        'amenities': {'cctv': True, 'security': True},
        'owner': 'owner2@parkx.in'
    },
    {
        'name': 'Dadar Station East Parking', 'address': 'Eastern Express Highway, Dadar East, Mumbai 400014',
        'latitude': 19.0218, 'longitude': 72.8448, 'type': 'COVERED', 'status': 'VERIFIED',
        'total_spaces': 55, 'base_hourly_price': 45,
        'amenities': {'cctv': True, 'security': True, 'covered': True},
        'owner': 'owner3@parkx.in'
    },
    {
        'name': 'Shivaji Park Parking', 'address': 'Shivaji Park, Dadar West, Mumbai 400028',
        'latitude': 19.0285, 'longitude': 72.8400, 'type': 'OPEN', 'status': 'VERIFIED',
        'total_spaces': 30, 'base_hourly_price': 35,
        'amenities': {'cctv': False},
        'owner': 'owner1@parkx.in'
    },
    {
        'name': 'Vashi Sector 17 Parking', 'address': 'Sector 17, Vashi, Navi Mumbai 400703',
        'latitude': 19.0771, 'longitude': 73.0071, 'type': 'MULTILEVEL', 'status': 'VERIFIED',
        'total_spaces': 120, 'base_hourly_price': 30,
        'amenities': {'ev_charging': True, 'cctv': True, 'security': True, 'covered': True, '24_hours': True},
        'owner': 'society1@parkx.in'
    },
    {
        'name': 'Belapur CBD Parking Complex', 'address': 'CBD Belapur, Navi Mumbai 400614',
        'latitude': 19.0229, 'longitude': 73.0401, 'type': 'BASEMENT', 'status': 'VERIFIED',
        'total_spaces': 75, 'base_hourly_price': 35,
        'amenities': {'cctv': True, 'security': True, 'covered': True},
        'owner': 'society2@parkx.in'
    },
    {
        'name': 'Juhu Beach Parking (Coming Soon)', 'address': 'Juhu Beach Road, Juhu, Mumbai 400049',
        'latitude': 19.0948, 'longitude': 72.8258, 'type': 'OPEN', 'status': 'PENDING_VERIFICATION',
        'total_spaces': 20, 'base_hourly_price': 60,
        'amenities': {},
        'owner': 'owner2@parkx.in'
    }
]

def run_migrations():
    print("Running Alembic migrations...")
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True)
    except Exception as e:
        print(f"Skipping migrations (ensure alembic is configured if needed): {e}")

def get_db_connection():
    db_url = os.environ.get('DATABASE_URL', 'postgresql://parkx:parkx_dev_password@localhost:5432/parkx')
    if 'postgresql+asyncpg' in db_url:
        db_url = db_url.replace('postgresql+asyncpg', 'postgresql')
    return psycopg2.connect(db_url)

def main():
    parser = argparse.ArgumentParser(description="Seed ParkX Database")
    parser.add_argument('--reset', action='store_true', help="Clear existing data before seeding")
    args = parser.parse_args()

    run_migrations()

    print("Connecting to database...")
    try:
        conn = get_db_connection()
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"Database connection failed: {e}")
        return

    if args.reset:
        print("Resetting database (deleting existing data)...")
        # Be careful in real applications, here we assume demo environment
        tables = ['reviews', 'bookings', 'pricing_rules', 'parking_availability', 'parking_spaces', 'locations', 'users']
        for table in tables:
            try:
                cur.execute(f"TRUNCATE TABLE {table} CASCADE;")
            except Exception as e:
                print(f"Table {table} might not exist yet or error: {e}")

    print("Seeding Users...")
    user_ids = {}
    for u in users:
        try:
            uid = str(uuid.uuid4())
            pwd = hash_password(u['password'])
            cur.execute(
                "INSERT INTO users (id, email, hashed_password, full_name, role, phone, is_active, is_demo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;",
                (uid, u['email'], pwd, u['full_name'], u['role'], u.get('phone'), True, True)
            )
            user_ids[u['email']] = cur.fetchone()[0]
            print(f"Created user: {u['email']}")
        except Exception as e:
            print(f"Failed to create user {u['email']}: {e}")

    print("Seeding Locations...")
    location_ids = []
    for loc in locations:
        try:
            lid = str(uuid.uuid4())
            owner_id = user_ids.get(loc['owner'])
            if not owner_id:
                print(f"Owner {loc['owner']} not found, skipping {loc['name']}")
                continue
            
            cur.execute(
                "INSERT INTO locations (id, name, address, latitude, longitude, type, status, total_spaces, base_hourly_price, amenities, owner_id, is_demo) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;",
                (lid, loc['name'], loc['address'], loc['latitude'], loc['longitude'], loc['type'], loc['status'], loc['total_spaces'], loc['base_hourly_price'], json.dumps(loc['amenities']), owner_id, True)
            )
            location_ids.append(lid)
            print(f"Created location: {loc['name']}")
            
            # Spaces
            for i in range(1, random.randint(3, 6)):
                cur.execute("INSERT INTO parking_spaces (id, location_id, space_number, is_active) VALUES (%s, %s, %s, %s);", (str(uuid.uuid4()), lid, f"A-{i:02d}", True))
                
            # Availability
            for day in range(7):
                cur.execute("INSERT INTO parking_availability (id, location_id, day_of_week, start_time, end_time) VALUES (%s, %s, %s, %s, %s);", (str(uuid.uuid4()), lid, day, '06:00', '23:00'))
                
            # Pricing rules
            cur.execute("INSERT INTO pricing_rules (id, location_id, rule_type, multiplier, start_time, end_time) VALUES (%s, %s, %s, %s, %s, %s);", (str(uuid.uuid4()), lid, 'PEAK', 1.5, '08:00', '10:00'))
            
            # Reviews
            driver_emails = [u['email'] for u in users if u['role'] == 'DRIVER']
            for _ in range(random.randint(1, 3)):
                driver_email = random.choice(driver_emails)
                driver_id = user_ids.get(driver_email)
                if driver_id:
                    cur.execute("INSERT INTO reviews (id, location_id, user_id, rating, comment) VALUES (%s, %s, %s, %s, %s);", (str(uuid.uuid4()), lid, driver_id, random.randint(3, 5), "Great parking experience!"))
                    
        except Exception as e:
            print(f"Failed to create location {loc['name']}: {e}")

    print("Seed complete!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()

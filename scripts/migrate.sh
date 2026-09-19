#!/bin/bash
set -e
echo '🗄 Running ParkX database migrations...'
cd "$(dirname "$0")/../backend"
alembic upgrade head
echo '✅ Migrations complete'
echo ''
echo '🌱 Seeding demo data...'
python -c "import sys; sys.path.insert(0, '.'); exec(open('../scripts/seed.py').read())"
echo '✅ Demo data seeded'

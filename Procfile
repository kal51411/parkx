web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: cd backend && celery -A celery_worker worker --loglevel=info
beat: cd backend && celery -A celery_worker beat --loglevel=info

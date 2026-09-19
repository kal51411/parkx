from app.workers.celery_app import celery_app

# Expose celery app for: celery -A celery_worker worker
__all__ = ["celery_app"]

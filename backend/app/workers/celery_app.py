from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "parkx",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "expire-held-bookings": {
            "task": "app.workers.tasks.expire_held_bookings",
            "schedule": 60.0,  # every minute
        },
        "detect-no-shows": {
            "task": "app.workers.tasks.detect_no_shows",
            "schedule": 300.0,  # every 5 minutes
        },
        "send-upcoming-reminders": {
            "task": "app.workers.tasks.send_upcoming_reminders",
            "schedule": 300.0,  # every 5 minutes
        },
    },
)

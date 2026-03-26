from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "project_link",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

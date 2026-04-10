from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "hsms",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Manila",
    enable_utc=True,
)
# Tasks will be registered in later phases

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.health_station import router as health_station_router
from app.routers.patient import router as patient_router

app = FastAPI(title="Project LINK HSMS", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(health_station_router, prefix="/api")
app.include_router(patient_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok", "debug": settings.DEBUG}

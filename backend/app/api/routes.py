"""Central API router — includes all module sub-routers under /api/v1/."""
from fastapi import APIRouter
from app.modules.face.router import router as face_router
from app.modules.voice.router import router as voice_router
from app.modules.text.router import router as text_router
from app.modules.fusion.router import router as fusion_router
from app.modules.reports.router import router as reports_router
from app.api.health import router as health_router

# Create the v1 prefix router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all module routers
api_v1_router.include_router(face_router)
api_v1_router.include_router(voice_router)
api_v1_router.include_router(text_router)
api_v1_router.include_router(fusion_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(health_router)

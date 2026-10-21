"""
TruSight FastAPI Application Entry Point.

Startup sequence:
1. Initialize structured logging
2. Create database tables
3. Mount central API router (all modules)
4. Mount WebSocket telemetry endpoint
5. Configure CORS middleware
"""
import os

# Prevent transformers from probing or importing TensorFlow
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

# Suppress strict Protobuf gencode/runtime mismatch checks (e.g. gencode 6.x vs runtime 5.x)
try:
    import google.protobuf.runtime_version as _pb_runtime
    _pb_runtime.ValidateProtobufRuntimeVersion = lambda *args, **kwargs: None
    _pb_runtime._ReportVersionError = lambda *args, **kwargs: None
except Exception:
    pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.database import init_db
from app.api.routes import api_v1_router
from app.api.websocket import router as ws_router
from app.shared.logger import get_logger

logger = get_logger("trusight.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    logger.info("TruSight API starting up...")
    await init_db()
    logger.info("Database ready. All modules active.")
    yield
    logger.info("TruSight API shutting down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "TruSight Explainable AI Truth Verification System — "
        "Multi-modal deception analysis via Face, Voice, and Text modalities."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(api_v1_router)
app.include_router(ws_router)

# Compatibility aliases matching 'final' endpoints
from app.modules.case_analysis.router import upload_case_pdf, case_audio_websocket

app.post("/case", tags=["Case Analysis & Evidence"], include_in_schema=False)(upload_case_pdf)
app.websocket("/ws/audio/{case_id}")(case_audio_websocket)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "TruSight API",
        "version": settings.app_version,
        "status": "operational",
        "docs": "/docs",
        "health": "/api/v1/health",
        "websocket_telemetry": "ws://localhost:8000/ws/telemetry",
        "websocket_interview": "ws://localhost:8000/api/v1/case/ws/{case_id}",
    }

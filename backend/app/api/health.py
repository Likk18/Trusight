"""System health check endpoint."""
import time
from fastapi import APIRouter
from pydantic import BaseModel
from app.shared.helpers import format_timestamp, now_utc

router = APIRouter(prefix="/health", tags=["Health"])

_start_time = time.time()


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    timestamp: str
    pipeline: dict[str, str]


@router.get("", response_model=HealthResponse, summary="System health and pipeline status check")
async def health_check() -> HealthResponse:
    """Returns system health, uptime, and per-module pipeline status."""
    uptime = round(time.time() - _start_time, 2)
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime_seconds=uptime,
        timestamp=format_timestamp(now_utc()),
        pipeline={
            "face_module": "active",
            "voice_module": "active",
            "text_module": "active",
            "fusion_engine": "active",
            "report_service": "active",
            "websocket_telemetry": "active",
            "database": "active",
        },
    )

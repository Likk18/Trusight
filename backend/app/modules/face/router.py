"""
FastAPI router for the Face module.
Exposes endpoints for discrete analysis, live frame processing, and file uploads.
"""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.modules.face import service
from app.modules.face.schemas import (
    FaceAnalysisRequest,
    FaceAnalysisResponse,
    FaceFrameRequest,
    FaceFrameResponse,
)
from app.shared.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/face", tags=["Face Analysis"])


@router.post(
    "/analyze",
    response_model=FaceAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze facial cues for a given session",
)
async def analyze_face(request: FaceAnalysisRequest) -> FaceAnalysisResponse:
    """Analyze face metrics from session state or optional base64 frame payload."""
    try:
        return await service.analyze(request)
    except Exception as exc:
        logger.error(f"Error in /face/analyze: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face analysis failed: {str(exc)}",
        ) from exc


@router.post(
    "/analyze-frame",
    response_model=FaceFrameResponse,
    status_code=status.HTTP_200_OK,
    summary="Real-time webcam frame analysis with 1:1 OpenCV visualizer output",
)
async def analyze_frame(request: FaceFrameRequest) -> FaceFrameResponse:
    """Stream live frame from browser webcam to compute behavioral metrics and annotated frame."""
    try:
        return await service.analyze_frame(request)
    except Exception as exc:
        logger.error(f"Error in /face/analyze-frame: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Frame processing failed: {str(exc)}",
        ) from exc


@router.post(
    "/analyze-file",
    response_model=FaceAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload image or video file for facial deception analysis",
)
async def analyze_face_file(
    file: UploadFile = File(...),
    session_id: str = Form("upload_session"),
) -> FaceAnalysisResponse:
    """Process uploaded video or image file."""
    try:
        content = await file.read()
        filename = file.filename or "upload.jpg"
        return await service.analyze_file(content, filename, session_id)
    except Exception as exc:
        logger.error(f"Error in /face/analyze-file: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File analysis failed: {str(exc)}",
        ) from exc

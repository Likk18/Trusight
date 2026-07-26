"""Face Analysis API router."""
from fastapi import APIRouter
from app.modules.face.schemas import FaceAnalysisRequest, FaceAnalysisResponse
from app.modules.face import service

router = APIRouter(prefix="/face", tags=["Face Analysis"])


@router.post("/analyze", response_model=FaceAnalysisResponse, summary="Analyze facial behavioral signals")
async def analyze_face(request: FaceAnalysisRequest) -> FaceAnalysisResponse:
    """
    Analyze facial signals from a video frame.

    Returns face truthfulness score, confidence, detailed metrics, and key reasons.
    The internal implementation is provided by `service.py` — replace that file
    with a real ML model without touching this router.
    """
    return await service.analyze(request)

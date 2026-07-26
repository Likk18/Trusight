"""Voice Analysis API router."""
from fastapi import APIRouter
from app.modules.voice.schemas import VoiceAnalysisRequest, VoiceAnalysisResponse
from app.modules.voice import service

router = APIRouter(prefix="/voice", tags=["Voice Analysis"])


@router.post("/analyze", response_model=VoiceAnalysisResponse, summary="Analyze vocal acoustic signals")
async def analyze_voice(request: VoiceAnalysisRequest) -> VoiceAnalysisResponse:
    """
    Analyze acoustic properties of a voice stream chunk.

    Returns deception score, verdict, model confidence, detailed metrics, and observations.
    Replace `service.py` with a real ML model without touching this router.
    """
    return await service.analyze(request)

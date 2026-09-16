"""Voice Analysis API router."""
from fastapi import APIRouter, UploadFile, File, Form
from app.modules.voice.schemas import VoiceAnalysisRequest, VoiceAnalysisResponse
from app.modules.voice import service

router = APIRouter(prefix="/voice", tags=["Voice Analysis"])


@router.post("/analyze", response_model=VoiceAnalysisResponse, summary="Analyze vocal acoustic signals")
async def analyze_voice(request: VoiceAnalysisRequest) -> VoiceAnalysisResponse:
    """
    Analyze acoustic properties of a voice stream chunk.
    Returns deception score, verdict, model confidence, detailed metrics, and observations.
    """
    return await service.analyze(request)


@router.post("/analyze-file", response_model=VoiceAnalysisResponse, summary="Analyze uploaded audio file")
async def analyze_voice_file(
    audio: UploadFile = File(..., description="Audio recording file (wav/mp3/ogg/webm/flac)"),
    session_id: str = Form("session_live", description="Active session ID"),
) -> VoiceAnalysisResponse:
    """Analyze raw uploaded audio file."""
    return await service.analyze_file(audio, session_id)

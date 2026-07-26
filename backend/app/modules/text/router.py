"""Text & Fact-Check Analysis API router."""
from fastapi import APIRouter
from app.modules.text.schemas import TextAnalysisRequest, TextAnalysisResponse
from app.modules.text import service

router = APIRouter(prefix="/text", tags=["Text Analysis"])


@router.post("/analyze", response_model=TextAnalysisResponse, summary="Analyze transcript text and fact-check claims")
async def analyze_text(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """
    Analyze transcript for linguistic consistency and cross-reference facts.

    Returns text score, highlighted statements with status, fact-check result cards,
    and key linguistic reasons. Replace `service.py` with a real NLP model.
    """
    return await service.analyze(request)

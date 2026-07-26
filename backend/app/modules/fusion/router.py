"""Fusion Engine API router."""
from fastapi import APIRouter
from app.modules.fusion.schemas import FusionRequest, FusionResponse
from app.modules.fusion import service

router = APIRouter(prefix="/fusion", tags=["Fusion Engine"])


@router.post("/synthesize", response_model=FusionResponse, summary="Synthesize multi-modal truth assessment")
async def synthesize_fusion(request: FusionRequest) -> FusionResponse:
    """
    Fuse face, voice, and text module scores into a final Truth Likelihood Score.

    Accepts only normalized numeric scores — never internal model state.
    Returns overall truth likelihood, fusion confidence, contributors, model agreement,
    verdict, explanation, and system status.
    """
    return await service.run_fusion(request)

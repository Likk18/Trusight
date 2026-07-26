"""Fusion service: orchestrates module API calls and runs the fusion model."""
from app.modules.fusion.schemas import FusionRequest, FusionResponse
from app.modules.fusion.fusion_model import synthesize
from app.shared.logger import get_logger

logger = get_logger(__name__)


async def run_fusion(request: FusionRequest) -> FusionResponse:
    """
    Fusion service entry point.
    Calls the fusion_model with the pre-normalized scores from the request.
    The caller is responsible for fetching individual module scores via their own APIs.
    """
    logger.info(f"[FUSION SERVICE] Running synthesis for session {request.session_id}")
    return synthesize(request)

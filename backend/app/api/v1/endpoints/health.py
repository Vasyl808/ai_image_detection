"""
Health check endpoints.

Provides endpoints for monitoring service health and status.
"""

from fastapi import APIRouter, Depends

from app import __version__
from app.api.deps import get_model
from app.models import DeepfakeDetector
from app.schemas import HealthResponse

router = APIRouter()


@router.get(
    "/",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the service and model are healthy and ready"
)
async def health_check(model: DeepfakeDetector = Depends(get_model)) -> HealthResponse:
    """
    Health check endpoint.

    Verifies that:
    - The service is running
    - The model is loaded and accessible

    Args:
        model: Injected model dependency

    Returns:
        Health status response
    """
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        version=__version__
    )

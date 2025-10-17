"""
Health check endpoints.

Provides endpoints for monitoring service health and status.
"""

from fastapi import APIRouter, Request
from app import __version__
from app.core.config import settings

router = APIRouter()


@router.get(
    "/",
    summary="Health check",
    description="Check if the service and model are healthy and ready"
)
async def health_check(request: Request):
    """
    Health check endpoint.

    Returns service status and version information.
    Useful for load balancers and monitoring systems.
    """
    health_status = {
        "status": "healthy",
        "version": __version__,
        "api_title": settings.API_TITLE
    }
    
    # Add service info if initialized
    if hasattr(request.app.state, 'services'):
        services = request.app.state.services
        health_status.update({
            "services": services.get_info(),
            "device": str(services.device) if services.device else None
        })
    
    return health_status

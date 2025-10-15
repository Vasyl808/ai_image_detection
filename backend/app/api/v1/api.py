"""
API v1 router.

Aggregates all v1 endpoints into a single router.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import detection, health

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    health.router,
    tags=["health"]
)

api_router.include_router(
    detection.router,
    tags=["detection"]
)

"""
API v1 router.

Aggregates all v1 endpoints into a single router with proper REST structure.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, detection, reports

api_router = APIRouter()

# Include endpoint routers with proper REST prefixes
api_router.include_router(
    health.router,
    prefix="/health",
    tags=["health"]
)

api_router.include_router(
    detection.router,
    prefix="/detect",
    tags=["detection"]
)

api_router.include_router(
    reports.router,
    prefix="/reports",
    tags=["reports"]
)

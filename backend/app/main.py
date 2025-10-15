"""
Main FastAPI application.

This is the entry point for the Deepfake Detection API.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api import api_router
from app.api.deps import initialize_model
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the application.
    
    Args:
        app: FastAPI application instance
        
    Yields:
        Control to the application during its lifetime
    """
    # Startup
    logger.info("=" * 60)
    logger.info(f"Starting {settings.API_TITLE} v{__version__}")
    logger.info("=" * 60)
    
    # Initialize model
    initialize_model()
    
    # Ensure results directory exists
    settings.RESULTS_DIR.mkdir(exist_ok=True)
    logger.info(f"Results directory: {settings.RESULTS_DIR.absolute()}")
    
    logger.info("Application startup complete")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    logger.info("Cleanup complete")


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Mount static files for results
app.mount(
    "/results",
    StaticFiles(directory=str(settings.RESULTS_DIR)),
    name="results"
)

# Include API router
app.include_router(api_router)

# Log application info
logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
logger.info(f"Debug mode: {settings.DEBUG}")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

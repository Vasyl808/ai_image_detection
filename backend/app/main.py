"""
Main FastAPI application.

This is the entry point for the Deepfake Detection API.
"""

import asyncio
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
from app.core.session_cache import start_cache_cleanup_task, stop_cache_cleanup_task, get_cache_stats
from app.services import FileService

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
    
    # Start session cache cleanup task
    start_cache_cleanup_task()
    logger.info("Session cache cleanup task started")
    
    # Log current cache statistics
    cache_stats = get_cache_stats()
    logger.info(f"Session cache initialized: {cache_stats['total_sessions']} total sessions, "
                f"{cache_stats['active_sessions']} active, {cache_stats['old_sessions']} old")
    
    cleanup_stop_event = asyncio.Event()
    cleanup_task = asyncio.create_task(
        FileService.run_daily_cleanup_scheduler(cleanup_stop_event)
    )
    
    # Log current file storage statistics
    storage_stats = FileService.get_storage_stats()
    logger.info(f"File storage initialized: {storage_stats['file_count']} files, "
                f"{storage_stats['total_size_mb']} MB total")
    
    logger.info("Application startup complete")
    logger.info("=" * 60)
    
    try:
        yield
    finally:
        logger.info("Shutting down application...")
        
        # Log final session cache statistics
        final_cache_stats = get_cache_stats()
        logger.info(f"Final session cache state: {final_cache_stats['total_sessions']} total sessions")
        
        # Log final file storage statistics
        final_storage_stats = FileService.get_storage_stats()
        logger.info(f"Final file storage state: {final_storage_stats['file_count']} files, "
                    f"{final_storage_stats['total_size_mb']} MB total")
        
        # Stop session cache cleanup task
        stop_cache_cleanup_task()
        logger.info("Session cache cleanup task stopped")
        
        cleanup_stop_event.set()
        await cleanup_task
        logger.info("File cleanup scheduler stopped")
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

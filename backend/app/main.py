"""
Main FastAPI application.

This is the entry point for the Deepfake Detection API.
Handles application lifecycle, middleware setup, and routing.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api import api_router
from app.api.deps import initialize_model_and_services
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.session_cache import start_cache_cleanup_task, stop_cache_cleanup_task, get_cache_stats

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the application:
    - Startup: Initializes model, services, background tasks
    - Shutdown: Cleanup resources, stop background tasks
    
    Args:
        app: FastAPI application instance
        
    Yields:
        Control to the application during its lifetime
    """
    # ========== STARTUP ==========
    logger.info("=" * 70)
    logger.info(f"🚀 Starting {settings.API_TITLE} v{__version__}")
    logger.info("=" * 70)
    
    cleanup_task = None
    cleanup_stop_event = None
    
    try:
        # Initialize model and services - store in app.state
        logger.info("Initializing application services...")
        app.state.services = await initialize_model_and_services()
        logger.info("✅ Services initialized successfully")
        
        # Ensure results directory exists
        settings.RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Results directory: {settings.RESULTS_DIR.absolute()}")
        
        # Start session cache cleanup task
        start_cache_cleanup_task()
        logger.info("✅ Session cache cleanup task started")
        
        # Log current cache statistics
        cache_stats = get_cache_stats()
        logger.info(
            f"Session cache: {cache_stats['total_sessions']} total, "
            f"{cache_stats['active_sessions']} active, "
            f"{cache_stats['old_sessions']} old"
        )
        
        # Start file cleanup scheduler
        cleanup_stop_event = asyncio.Event()
        file_service = app.state.services.file_service
        cleanup_task = asyncio.create_task(
            file_service.run_daily_cleanup_scheduler(cleanup_stop_event)
        )
        logger.info("✅ File cleanup scheduler started")
        
        # Log current file storage statistics
        storage_stats = file_service.get_storage_stats()
        logger.info(
            f"File storage: {storage_stats['file_count']} files, "
            f"{storage_stats['total_size_mb']:.2f} MB total"
        )
        
        logger.info("=" * 70)
        logger.info("✅ Application startup complete - Ready to accept requests")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}", exc_info=True)
        logger.error("Application startup failed - shutting down")
        raise
    
    try:
        # Application is running
        yield
        
    finally:
        # ========== SHUTDOWN ==========
        logger.info("=" * 70)
        logger.info("🛑 Shutting down application...")
        logger.info("=" * 70)
        
        try:
            # Log final session cache statistics
            final_cache_stats = get_cache_stats()
            logger.info(
                f"Final session cache: {final_cache_stats['total_sessions']} total sessions"
            )
            
            # Log final file storage statistics
            if hasattr(app.state, 'services') and app.state.services.file_service:
                final_storage_stats = app.state.services.file_service.get_storage_stats()
                logger.info(
                    f"Final file storage: {final_storage_stats['file_count']} files, "
                    f"{final_storage_stats['total_size_mb']:.2f} MB total"
                )
            
            # Stop session cache cleanup task
            stop_cache_cleanup_task()
            logger.info("✅ Session cache cleanup task stopped")
            
            # Stop file cleanup scheduler with timeout
            if cleanup_stop_event and cleanup_task:
                cleanup_stop_event.set()
                
                try:
                    await asyncio.wait_for(cleanup_task, timeout=5.0)
                    logger.info("✅ File cleanup scheduler stopped")
                except asyncio.TimeoutError:
                    logger.warning("⚠️ File cleanup task timeout - cancelling")
                    cleanup_task.cancel()
                    try:
                        await cleanup_task
                    except asyncio.CancelledError:
                        logger.info("File cleanup task cancelled")
            
            # Clear CUDA cache if available
            if hasattr(app.state, 'services') and app.state.services.device:
                import torch
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    logger.info("✅ CUDA cache cleared")
            
            # Clear model from memory
            if hasattr(app.state, 'services'):
                app.state.services.model = None
                logger.info("✅ Model cleared from memory")
            
            logger.info("=" * 70)
            logger.info("✅ Application shutdown complete")
            logger.info("=" * 70)
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}", exc_info=True)


# Create FastAPI application with lifespan
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)


# ========== MIDDLEWARE ==========

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and responses."""
    logger.debug(f"📥 {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        logger.debug(f"📤 {request.method} {request.url.path} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"❌ Error processing {request.method} {request.url.path}: {e}", exc_info=True)
        raise


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions globally."""
    logger.error(
        f"Unhandled exception for {request.method} {request.url.path}: {exc}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "code": "INTERNAL_ERROR",
            "path": str(request.url.path)
        }
    )


# ========== STATIC FILES ==========

# Mount static files for results
app.mount(
    "/results",
    StaticFiles(directory=str(settings.RESULTS_DIR)),
    name="results"
)

# ========== ROUTES ==========

# Include API router
app.include_router(api_router)

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.API_TITLE}",
        "version": __version__,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
        "health": "/health"
    }


# ========== STARTUP LOGGING ==========

# Log application configuration
logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")
logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
logger.info(f"Debug mode: {settings.DEBUG}")
logger.info(f"API documentation: {'Enabled' if settings.DEBUG else 'Disabled'}")
logger.info(f"Host: {settings.HOST}:{settings.PORT}")


# ========== MAIN ==========

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting uvicorn server...")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG,  # Enable access logs only in debug mode
    )
    
"""
API dependencies.

Contains dependency injection functions for FastAPI endpoints.
Uses app.state for storing services.
"""

from pathlib import Path
import asyncio
import functools
from typing import Optional

import torch
from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models import DeepfakeDetector
from app.services import DetectionService, FileService, PDFReportService

logger = get_logger(__name__)


class AppState:
    """Container for application state with all services."""
    
    def __init__(self):
        self.model: Optional[DeepfakeDetector] = None
        self.device: Optional[torch.device] = None
        self.detection_service: Optional[DetectionService] = None
        self.file_service: Optional[FileService] = None
        self.pdf_report_service: Optional[PDFReportService] = None
    
    def is_initialized(self) -> bool:
        """
        Check if all critical services are initialized.
        
        Returns:
            True if all services are ready, False otherwise
        """
        return all([
            self.model is not None,
            self.device is not None,
            self.detection_service is not None,
            self.file_service is not None,
            self.pdf_report_service is not None
        ])
    
    def get_info(self) -> dict:
        """
        Get information about initialized services.
        
        Returns:
            Dictionary with service initialization status
        """
        return {
            "model_initialized": self.model is not None,
            "device": str(self.device) if self.device else None,
            "detection_service_initialized": self.detection_service is not None,
            "file_service_initialized": self.file_service is not None,
            "pdf_report_service_initialized": self.pdf_report_service is not None,
        }


async def initialize_model_and_services() -> AppState:
    """
    Initialize the model and all services at application startup.
    
    This function:
    1. Sets up the PyTorch device (CPU/CUDA)
    2. Creates and loads the DeepfakeDetector model
    3. Initializes all application services
    
    Returns:
        AppState instance with all services initialized
        
    Raises:
        Exception: If initialization fails (model loading, device setup, etc.)
    """
    state = AppState()
    
    try:
        logger.info("🚀 Initializing model...")
        
        # Set device
        state.device = torch.device(settings.MODEL_DEVICE)
        logger.info(f"Using device: {state.device}")
        
        # Log CUDA availability
        if torch.cuda.is_available():
            logger.info(f"CUDA available: {torch.cuda.get_device_name(0)}")
            logger.info(f"CUDA version: {torch.version.cuda}")
        
        # Create model
        state.model = DeepfakeDetector(num_classes=settings.MODEL_NUM_CLASSES)
        logger.info(f"Model architecture: {state.model.__class__.__name__}")
        
        # Wrap with DataParallel if needed
        if settings.USE_DATAPARALLEL:
            state.model = torch.nn.DataParallel(state.model)
        
        # Try to load custom weights
        checkpoint_path = Path(settings.MODEL_CHECKPOINT_PATH)
        if checkpoint_path.exists():
            try:
                logger.info(f"Loading checkpoint from: {checkpoint_path}")
                loop = asyncio.get_running_loop()
                load_partial = functools.partial(
                    torch.load,
                    checkpoint_path,
                    map_location=settings.MODEL_DEVICE,
                    weights_only=True,  # Security: only load tensor data
                )
                checkpoint = await loop.run_in_executor(None, load_partial)

                state.model.load_state_dict(checkpoint)
                
                # Unwrap DataParallel if needed
                if settings.USE_DATAPARALLEL and isinstance(state.model, torch.nn.DataParallel):
                    state.model = state.model.module
                
                logger.info(f"✅ Loaded custom trained weights from {checkpoint_path}")
                
            except Exception as e:
                logger.warning(f"⚠️ Could not load custom weights: {e}")
                logger.info("Falling back to ImageNet pretrained weights")
        else:
            logger.info("ℹ️ No custom weights found, using ImageNet pretrained weights")
        
        # Move to device and set to eval mode
        state.model.to(state.device)
        state.model.eval()
        
        # Disable gradients for inference
        for param in state.model.parameters():
            param.requires_grad = False
        
        # Log model info
        total_params, trainable_params = state.model.get_num_parameters()
        logger.info(
            f"Model initialized: {total_params:,} total parameters "
            f"({trainable_params:,} trainable)"
        )
        
        # Initialize detection service
        state.detection_service = DetectionService(state.model, state.device)
        logger.info("✅ Detection service initialized")
        
        # Initialize other services
        logger.info("Initializing additional services...")
        state.file_service = FileService()
        state.pdf_report_service = PDFReportService()
        logger.info("✅ All services initialized successfully")
        
        return state
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}", exc_info=True)
        raise


def get_app_state(request: Request) -> AppState:
    """
    Get application state from request.
    
    This is the base dependency that validates service initialization.
    All other service dependencies should use this.
    
    Args:
        request: FastAPI request object
        
    Returns:
        AppState instance with all services
        
    Raises:
        HTTPException: If services are not initialized (503 Service Unavailable)
    """
    if not hasattr(request.app.state, 'services'):
        logger.error(
            "Services not initialized - missing 'services' attribute in app.state. "
            "Check lifespan configuration in main.py"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Service Unavailable",
                "message": "Application services are not initialized. Server may be starting up.",
                "code": "SERVICES_NOT_INITIALIZED"
            }
        )
    
    state: AppState = request.app.state.services
    
    if not state.is_initialized():
        logger.error(
            f"Services partially initialized. Status: {state.get_info()}"
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Service Unavailable",
                "message": "Application services are not fully initialized. Server is starting up.",
                "code": "SERVICES_PARTIALLY_INITIALIZED",
                "services_status": state.get_info()
            }
        )
    
    return state


def get_detection_service(request: Request) -> DetectionService:
    """
    Get detection service from app state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Initialized DetectionService instance
        
    Raises:
        HTTPException: If service is not available (503)
    """
    state = get_app_state(request)
    return state.detection_service


def get_model(request: Request) -> DeepfakeDetector:
    """
    Get ML model from app state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Initialized DeepfakeDetector instance
        
    Raises:
        HTTPException: If model is not available (503)
    """
    state = get_app_state(request)
    return state.model


def get_device(request: Request) -> torch.device:
    """
    Get PyTorch device from app state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        PyTorch device (CPU or CUDA)
        
    Raises:
        HTTPException: If device is not set (503)
    """
    state = get_app_state(request)
    return state.device


def get_file_service(request: Request) -> FileService:
    """
    Get file service from app state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Initialized FileService instance
        
    Raises:
        HTTPException: If service is not available (503)
    """
    state = get_app_state(request)
    return state.file_service


def get_pdf_report_service(request: Request) -> PDFReportService:
    """
    Get PDF report service from app state.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Initialized PDFReportService instance
        
    Raises:
        HTTPException: If service is not available (503)
    """
    state = get_app_state(request)
    return state.pdf_report_service
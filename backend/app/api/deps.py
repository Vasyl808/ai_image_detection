"""
API dependencies.

Contains dependency injection functions for FastAPI endpoints.
"""

from pathlib import Path
from typing import Generator

import torch
from fastapi import Depends

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models import DeepfakeDetector
from app.services import DetectionService

logger = get_logger(__name__)


# Global model instance (initialized once at startup)
_model: DeepfakeDetector = None
_device: torch.device = None
_detection_service: DetectionService = None


def initialize_model() -> None:
    """
    Initialize the model at application startup.
    
    This function loads the model, optionally loads custom weights,
    and moves it to the appropriate device.
    
    Called once during application startup.
    """
    global _model, _device, _detection_service
    
    logger.info("Initializing model...")
    
    # Set device
    _device = torch.device(settings.MODEL_DEVICE)
    logger.info(f"Using device: {_device}")
    
    # Create model
    _model = DeepfakeDetector(
        num_classes=settings.MODEL_NUM_CLASSES
    )
    
    # Wrap with DataParallel if needed
    if settings.USE_DATAPARALLEL:
        _model = torch.nn.DataParallel(_model)
    
    # Try to load custom weights
    checkpoint_path = Path(settings.MODEL_CHECKPOINT_PATH)
    if checkpoint_path.exists():
        try:

            checkpoint = torch.load(checkpoint_path, map_location=settings.MODEL_DEVICE)
            _model.load_state_dict(checkpoint)
            # Get the actual model (unwrap DataParallel if needed)
            _model = _model.module if settings.USE_DATAPARALLEL else _model
            
            logger.info(f"✅ Loaded custom trained weights from {checkpoint_path}")
        except Exception as e:
            logger.warning(f"⚠️ Could not load custom weights: {e}")
            logger.info("Using ImageNet pretrained weights")
    else:
        logger.info("ℹ️ No custom weights found, using ImageNet pretrained weights")
    
    # Move to device and set to eval mode
    _model.to(_device)
    _model.eval()
    
    # Initialize detection service
    _detection_service = DetectionService(_model, _device)
    
    # Log model info
    total_params, trainable_params = _model.get_num_parameters()
    logger.info(f"Model initialized with {total_params:,} parameters ({trainable_params:,} trainable)")


def get_detection_service() -> DetectionService:
    """
    Dependency to get the detection service.
    
    Returns:
        Initialized detection service instance
        
    Raises:
        RuntimeError: If model is not initialized
    """
    if _detection_service is None:
        raise RuntimeError("Model not initialized. Call initialize_model() first.")
    
    return _detection_service


def get_model() -> DeepfakeDetector:
    """
    Dependency to get the model.
    
    Returns:
        Initialized model instance
        
    Raises:
        RuntimeError: If model is not initialized
    """
    if _model is None:
        raise RuntimeError("Model not initialized. Call initialize_model() first.")
    
    return _model


def get_device() -> torch.device:
    """
    Dependency to get the device.
    
    Returns:
        PyTorch device
        
    Raises:
        RuntimeError: If model is not initialized
    """
    if _device is None:
        raise RuntimeError("Model not initialized. Call initialize_model() first.")
    
    return _device

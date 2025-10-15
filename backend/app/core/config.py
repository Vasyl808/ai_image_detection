"""
Application configuration settings.

This module contains all configuration settings for the application,
using pydantic for validation and environment variable support.
"""

from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # API Settings
    API_TITLE: str = "Deepfake Detection API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered deepfake detection with Grad-CAM visualization"
    
    # Server Settings
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # CORS Settings
    CORS_ORIGINS: List[str] = Field(
        default=["*"],
        description="Allowed CORS origins"
    )
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # Model Settings
    MODEL_NAME: str = "efficientnet_b0"
    MODEL_NUM_CLASSES: int = 1
    MODEL_CHECKPOINT_PATH: Optional[str] = "best_efficientnet_model.pth"
    MODEL_DEVICE: str = "cpu"
    USE_DATAPARALLEL: bool = True
    
    # Image Processing Settings
    IMAGE_SIZE: int = 224
    MAX_IMAGE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]
    
    # Grad-CAM Settings
    GRADCAM_COLORMAP: int = 2  # cv2.COLORMAP_JET
    GRADCAM_ALPHA: float = 0.4  # Heatmap transparency
    GRADCAM_BETA: float = 0.6   # Original image transparency
    
    # File Storage Settings
    RESULTS_DIR: Path = Path("results")
    RESULTS_CLEANUP_HOURS: int = 24
    RESULTS_MAX_FILES: int = 1000
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        """Pydantic config class."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create global settings instance
settings = Settings()

# Ensure results directory exists
settings.RESULTS_DIR.mkdir(exist_ok=True)

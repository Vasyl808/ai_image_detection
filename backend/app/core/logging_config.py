"""
Logging configuration for the application.

This module sets up structured logging with appropriate formatters
and handlers for both development and production environments.
"""

import logging
import sys
from typing import Any, Dict

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure application logging.
    
    Sets up logging with the configured level and format from settings.
    Configures both console and file handlers if needed.
    """
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
    
    # Create formatter
    formatter = logging.Formatter(settings.LOG_FORMAT)
    console_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    # Log startup message
    logger.info(f"Logging configured with level: {settings.LOG_LEVEL}")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Name of the logger (typically __name__ of the module)
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)

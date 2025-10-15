"""
Core application modules.

Contains configuration, logging, and other core functionality.
"""

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger

__all__ = ["settings", "setup_logging", "get_logger"]

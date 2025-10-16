"""
Session cache for detection results.

Shared cache for storing detection session data across different API endpoints.
"""

import asyncio
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Tuple, Optional

from app.core.logging_config import get_logger
from app.schemas import DetectionResponse

logger = get_logger(__name__)

# In-memory cache for recent detection sessions
# Maps session_id to (original_image_path, gradcam_path, result_data, timestamp)
detection_cache: Dict[str, Tuple[Path, Path, DetectionResponse, datetime]] = {}

# Configuration
CACHE_CLEANUP_INTERVAL_MINUTES = 60  # Clean up every hour
MAX_SESSION_AGE_MINUTES = 60  # Remove sessions older than 1 hour
MAX_CACHE_SIZE = 1000000  # Maximum number of sessions to keep in cache

# Background cleanup task
_cleanup_task: Optional[asyncio.Task] = None


def start_cache_cleanup_task() -> None:
    """
    Start the background task for cleaning up old cache entries.
    """
    global _cleanup_task

    if _cleanup_task is None or _cleanup_task.done():
        _cleanup_task = asyncio.create_task(_periodic_cache_cleanup())


def stop_cache_cleanup_task() -> None:
    """
    Stop the background cache cleanup task.
    """
    global _cleanup_task

    if _cleanup_task and not _cleanup_task.done():
        _cleanup_task.cancel()


async def _periodic_cache_cleanup() -> None:
    """
    Periodically clean up old cache entries.
    """
    while True:
        try:
            await asyncio.sleep(CACHE_CLEANUP_INTERVAL_MINUTES * 60)
            cleanup_old_sessions()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in cache cleanup task: {e}", exc_info=True)


def cleanup_old_sessions() -> int:
    """
    Clean up old sessions from the cache.

    Removes sessions that are older than MAX_SESSION_AGE_MINUTES or
    if the cache size exceeds MAX_CACHE_SIZE.

    Returns:
        Number of sessions removed
    """
    current_time = datetime.now()
    cutoff_time = current_time - timedelta(minutes=MAX_SESSION_AGE_MINUTES)

    removed_count = 0

    # Remove old sessions
    sessions_to_remove = []
    for session_id, (_, _, _, timestamp) in detection_cache.items():
        if timestamp < cutoff_time:
            sessions_to_remove.append(session_id)

    for session_id in sessions_to_remove:
        del detection_cache[session_id]
        removed_count += 1

    # If still too many sessions, remove oldest ones
    if len(detection_cache) > MAX_CACHE_SIZE:
        # Sort by timestamp (oldest first)
        sorted_sessions = sorted(
            detection_cache.items(),
            key=lambda x: x[1][3]  # Sort by timestamp
        )

        # Remove oldest sessions to get back to MAX_CACHE_SIZE
        excess_count = len(detection_cache) - MAX_CACHE_SIZE
        for i in range(excess_count):
            session_id = sorted_sessions[i][0]
            del detection_cache[session_id]
            removed_count += 1

    if removed_count > 0:
        logger.info(f"Cleaned up {removed_count} old sessions from cache")

    return removed_count


def add_session(
    session_id: str,
    original_path: Path,
    gradcam_path: Path,
    result: DetectionResponse,
) -> None:
    """
    Add a session to the cache.

    Args:
        session_id: Unique session identifier
        original_path: Path to original image file
        gradcam_path: Path to Grad-CAM visualization file
        result: Detection result data
    """
    detection_cache[session_id] = (original_path, gradcam_path, result, datetime.now())


def get_session(session_id: str) -> Optional[Tuple[Path, Path, DetectionResponse, datetime]]:
    """
    Get a session from the cache.

    Args:
        session_id: Session identifier

    Returns:
        Session data tuple or None if not found
    """
    return detection_cache.get(session_id)


def remove_session(session_id: str) -> bool:
    """
    Remove a session from the cache.

    Args:
        session_id: Session identifier

    Returns:
        True if session was removed, False if not found
    """
    if session_id in detection_cache:
        del detection_cache[session_id]
        return True
    return False


def get_cache_stats() -> Dict:
    """
    Get cache statistics.

    Returns:
        Dictionary with cache statistics
    """
    current_time = datetime.now()
    active_sessions = 0
    old_sessions = 0

    for _, (_, _, _, timestamp) in detection_cache.items():
        if current_time - timestamp > timedelta(minutes=MAX_SESSION_AGE_MINUTES):
            old_sessions += 1
        else:
            active_sessions += 1

    return {
        "total_sessions": len(detection_cache),
        "active_sessions": active_sessions,
        "old_sessions": old_sessions,
        "max_age_minutes": MAX_SESSION_AGE_MINUTES,
        "max_size": MAX_CACHE_SIZE,
        "cleanup_interval_minutes": CACHE_CLEANUP_INTERVAL_MINUTES
    }

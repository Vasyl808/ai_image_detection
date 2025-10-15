"""
File management service.

Handles file operations including cleanup of old result files
and file validation.
"""

import asyncio
from datetime import datetime, timedelta, time
from pathlib import Path
from typing import List

from fastapi import UploadFile, HTTPException

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


class FileService:
    """
    Service for file management operations.
    
    Handles validation, cleanup, and other file-related tasks.
    """
    
    @staticmethod
    def validate_image_file(file: UploadFile) -> None:
        """
        Validate uploaded image file.
        
        Checks:
        - File type (must be image)
        - File size (must be under MAX_IMAGE_SIZE_MB)
        
        Args:
            file: Uploaded file to validate
            
        Raises:
            HTTPException: If validation fails
        """
        # Check content type
        if not file.content_type or file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            )
        
        # Check file size (if available)
        if file.size and file.size > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            logger.warning(f"File too large: {file.size / (1024*1024):.2f} MB")
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds {settings.MAX_IMAGE_SIZE_MB} MB limit"
            )
        
        logger.debug(f"File validated: {file.filename}, type: {file.content_type}")
    
    @staticmethod
    def cleanup_old_files(max_age_hours: int = None) -> int:
        """
        Clean up old result files.
        
        Removes files from the results directory that are older than
        the specified age. Uses settings.RESULTS_CLEANUP_HOURS if not specified.
        
        Args:
            max_age_hours: Maximum age of files to keep (in hours).
                          Defaults to settings.RESULTS_CLEANUP_HOURS
                          
        Returns:
            Number of files deleted
            
        Raises:
            RuntimeError: If cleanup operation fails
        """
        if max_age_hours is None:
            max_age_hours = settings.RESULTS_CLEANUP_HOURS
        
        try:
            current_time = datetime.now()
            deleted_count = 0
            
            # Find all Grad-CAM result files
            result_files = list(settings.RESULTS_DIR.glob("gradcam_*.png"))
            
            logger.info(f"Found {len(result_files)} result files")
            
            for file_path in result_files:
                # Get file modification time
                file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                file_age = current_time - file_mtime
                
                # Delete if older than max_age
                if file_age > timedelta(hours=max_age_hours):
                    file_path.unlink()
                    deleted_count += 1
                    logger.debug(f"Deleted old file: {file_path.name}")
            
            logger.info(
                f"Cleanup completed: deleted {deleted_count} files "
                f"older than {max_age_hours} hours"
            )
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}", exc_info=True)
            raise RuntimeError(f"Cleanup operation failed: {str(e)}")
    
    @staticmethod
    def cleanup_by_count(max_files: int = None) -> int:
        """
        Clean up files to maintain a maximum count.
        
        Removes oldest files if the total count exceeds max_files.
        Uses settings.RESULTS_MAX_FILES if not specified.
        
        Args:
            max_files: Maximum number of files to keep.
                      Defaults to settings.RESULTS_MAX_FILES
                      
        Returns:
            Number of files deleted
        """
        if max_files is None:
            max_files = settings.RESULTS_MAX_FILES
        
        try:
            # Get all result files sorted by modification time
            result_files = sorted(
                settings.RESULTS_DIR.glob("gradcam_*.png"),
                key=lambda p: p.stat().st_mtime
            )
            
            files_to_delete = len(result_files) - max_files
            
            if files_to_delete <= 0:
                logger.debug(f"File count ({len(result_files)}) within limit ({max_files})")
                return 0
            
            deleted_count = 0
            
            # Delete oldest files
            for file_path in result_files[:files_to_delete]:
                file_path.unlink()
                deleted_count += 1
                logger.debug(f"Deleted file to maintain count limit: {file_path.name}")
            
            logger.info(
                f"Deleted {deleted_count} files to maintain max count of {max_files}"
            )
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Cleanup by count failed: {e}", exc_info=True)
            raise RuntimeError(f"Cleanup by count failed: {str(e)}")
    
    @staticmethod
    def get_result_files() -> List[Path]:
        """
        Get list of all result files.
        
        Returns:
            List of Path objects for all result files
        """
        return list(settings.RESULTS_DIR.glob("gradcam_*.png"))
    
    @staticmethod
    def get_storage_stats() -> dict:
        """
        Get statistics about stored result files.
        
        Returns:
            Dictionary with file count and total size
        """
        files = FileService.get_result_files()
        total_size = sum(f.stat().st_size for f in files)
        
        return {
            "file_count": len(files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }

    @staticmethod
    async def run_daily_cleanup_scheduler(stop_event: asyncio.Event) -> None:
        while not stop_event.is_set():
            now = datetime.now()
            midnight = datetime.combine(now.date(), time.min)
            if now >= midnight:
                midnight += timedelta(days=1)
            wait_seconds = max((midnight - now).total_seconds(), 0)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=wait_seconds)
                break
            except asyncio.TimeoutError:
                pass
            try:
                deleted = await asyncio.to_thread(FileService.cleanup_old_files)
                logger.info(
                    "Scheduled cleanup executed, deleted %s files", deleted
                )
            except Exception as exc:
                logger.error(
                    "Scheduled cleanup failed: %s", exc,
                    exc_info=True
                )

"""
Deepfake detection endpoints.

Provides endpoints for analyzing images and detecting deepfakes.
"""

import io
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image

from app.api.deps import get_detection_service
from app.core.logging_config import get_logger
from app.schemas import DetectionResponse
from app.services import DetectionService, FileService

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Detect deepfake",
    description="Analyze an image to detect if it's a deepfake with Grad-CAM visualization"
)
async def detect_deepfake(
    file: Annotated[UploadFile, File(description="Image file to analyze")],
    detection_service: DetectionService = Depends(get_detection_service)
) -> DetectionResponse:
    """
    Detect if an uploaded image is a deepfake.
    
    This endpoint:
    1. Validates the uploaded file
    2. Loads and preprocesses the image
    3. Runs deepfake detection
    4. Generates Grad-CAM visualization
    5. Returns prediction with confidence and explanation
    
    Args:
        file: Uploaded image file (JPEG, PNG, WebP)
        detection_service: Injected detection service
        
    Returns:
        Detection response with prediction and Grad-CAM visualization
        
    Raises:
        HTTPException: If file validation or processing fails
    """
    # Validate file
    try:
        FileService.validate_image_file(file)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File validation error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail="File validation failed")
    
    # Read and load image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        logger.info(f"Processing image: {file.filename}, size: {image.size}")
    except Exception as e:
        logger.error(f"Failed to load image: {e}", exc_info=True)
        raise HTTPException(
            status_code=400,
            detail="Invalid image file. Could not read image data."
        )
    
    # Run detection
    try:
        result = detection_service.detect(image)
        return result
    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Detection processing failed: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=dict,
    summary="Get storage statistics",
    description="Get statistics about stored result files"
)
async def get_storage_stats() -> dict:
    """
    Get statistics about stored result files.
    
    Returns information about the number of files and total storage used
    by Grad-CAM visualizations.
    
    Returns:
        Dictionary with file count and storage size
    """
    try:
        stats = FileService.get_storage_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

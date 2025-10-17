"""
Report endpoints.

Provides endpoints for generating PDF reports of detection results.
"""

from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import get_pdf_report_service
from app.core.config import settings
from app.core.logging_config import get_logger
from app.schemas import DetectionResponse
from app.core.session_cache import get_cache_stats, get_session
from app.services import PDFReportService

logger = get_logger(__name__)

router = APIRouter()


@router.get(
    "/report/{session_id}",
    summary="Generate PDF report",
    description="Generate a comprehensive PDF report for a detection session",
    response_class=StreamingResponse,
)
async def generate_pdf_report(
    session_id: str,
    pdf_report_service: PDFReportService = Depends(get_pdf_report_service)
) -> StreamingResponse:
    """
    Generate a PDF report for a detection session.

    This endpoint generates a comprehensive PDF report containing:
    - The analyzed image
    - Detection result (Real/Deepfake)
    - Grad-CAM visualization
    - Interpretation guide

    Args:
        session_id: The session ID from the detection response
        pdf_report_service: Injected PDF report service

    Returns:
        PDF file as streaming response

    Raises:
        HTTPException: If session not found or PDF generation fails
    """
    # Check if session exists
    session_data = get_session(session_id)
    if session_data is None:
        logger.warning(f"Session not found: {session_id}")
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Please analyze the image again."
        )

    try:
        # Get session data
        original_path, gradcam_path, result, timestamp = session_data

        # Verify files exist
        if not original_path.exists():
            logger.error(f"Original image not found: {original_path}")
            raise HTTPException(
                status_code=404,
                detail="Original image file not found"
            )

        if not gradcam_path.exists():
            logger.error(f"Grad-CAM image not found: {gradcam_path}")
            raise HTTPException(
                status_code=404,
                detail="Grad-CAM visualization not found"
            )

        # Generate PDF
        logger.info(f"Generating PDF report for session: {session_id}")
        pdf_buffer = pdf_report_service.generate_report(
            original_image_path=original_path,
            gradcam_image_path=gradcam_path,
            prediction_label=result.prediction.label,
            is_deepfake=result.prediction.is_deepfake,
            gradcam_description=result.explanation.description,
        )

        # Generate filename with timestamp
        filename = f"deepfake_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

        # Note: Session cleanup is handled by the periodic background task
        # Sessions are automatically removed after MAX_SESSION_AGE_MINUTES (default: 60 minutes)
        # This ensures the session remains available for retries if download fails
        logger.debug(f"PDF generated for session {session_id}. Session will be cleaned up by background task.")

        # Return PDF as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF report: {str(e)}"
        )


@router.get(
    "/cache/stats",
    summary="Get session cache statistics",
    description="Get statistics about the session cache including active and old sessions"
)
async def get_cache_statistics() -> dict:
    """
    Get session cache statistics.

    Returns information about the session cache including:
    - Total number of sessions
    - Active sessions (within age limit)
    - Old sessions (exceeding age limit)
    - Cache configuration

    Returns:
        Dictionary with cache statistics
    """
    try:
        stats = get_cache_stats()
        return {
            "success": True,
            "cache_stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cache statistics: {str(e)}"
        )
        
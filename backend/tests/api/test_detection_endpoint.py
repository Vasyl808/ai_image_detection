"""Unit tests for detection API endpoints."""

import pytest
from io import BytesIO
from fastapi import status
from unittest.mock import Mock, patch

from app.schemas import DetectionResponse, PredictionResult, GradCAMExplanation


class TestDetectionEndpoints:
    """Test cases for detection API endpoints."""
    
    def test_detect_deepfake_endpoint(self, test_app, test_image_bytes):
        """Test POST /detect/detect with valid image."""
        # Configure the mock detection service already in app.state.services
        from app.main import app as fastapi_app
        
        mock_response = DetectionResponse(
            success=True,
            prediction=PredictionResult(
                label="AI-generated image",
                is_deepfake=True
            ),
            explanation=GradCAMExplanation(
                gradcam_image="/results/gradcam_test.png",
                description="Test description"
            ),
            session_id="test-session-id"
        )
        
        # Access the mock service from app state and configure it
        fastapi_app.state.services.detection_service.detect.return_value = mock_response
        
        # Send request
        files = {"file": ("test.png", BytesIO(test_image_bytes), "image/png")}
        response = test_app.post("/detect/detect", files=files)
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["prediction"]["is_deepfake"] is True
        assert "session_id" in data
    
    def test_detect_invalid_file_type(self, test_app):
        """Test detection endpoint rejects invalid file types."""
        # Create a fake PDF file
        fake_pdf = BytesIO(b"%PDF-1.4 fake pdf content")
        
        files = {"file": ("document.pdf", fake_pdf, "application/pdf")}
        response = test_app.post("/detect/detect", files=files)
        
        # Should return 400 Bad Request
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid file type" in response.json()["detail"]
    
    def test_detect_missing_file(self, test_app):
        """Test detection endpoint when no file is provided."""
        response = test_app.post("/detect/detect")
        
        # Should return 422 Unprocessable Entity (missing required field)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_detect_real_image_endpoint(self, test_app, test_image_bytes):
        """Test detection of real image."""
        from app.main import app as fastapi_app
        
        mock_response = DetectionResponse(
            success=True,
            prediction=PredictionResult(
                label="Real",
                is_deepfake=False
            ),
            explanation=GradCAMExplanation(
                gradcam_image="/results/gradcam_real.png",
                description="Image appears to be authentic"
            ),
            session_id="test-session-real"
        )
        
        # Configure the mock
        fastapi_app.state.services.detection_service.detect.return_value = mock_response
        
        files = {"file": ("real.jpg", BytesIO(test_image_bytes), "image/jpeg")}
        response = test_app.post("/detect/detect", files=files)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["prediction"]["is_deepfake"] is False
        assert data["prediction"]["label"] == "Real"
    
    def test_detect_invalid_image_data(self, test_app):
        """Test detection with corrupt image data."""
        corrupt_data = BytesIO(b"not an image")
        
        files = {"file": ("corrupt.png", corrupt_data, "image/png")}
        response = test_app.post("/detect/detect", files=files)
        
        # Should return 400 Bad Request
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_storage_stats_endpoint(self, test_app):
        """Test GET /detect/stats."""
        from app.main import app as fastapi_app
        from unittest.mock import MagicMock
        
        # Create a fresh mock for file_service
        mock_file_service = MagicMock()
        mock_file_service.get_storage_stats.return_value = {
            "file_count": 10,
            "total_size_bytes": 1024000,
            "total_size_mb": 1.0
        }
        
        # Replace file_service in app state
        original_file_service = fastapi_app.state.services.file_service
        fastapi_app.state.services.file_service = mock_file_service
        
        try:
            response = test_app.get("/detect/stats")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert data["stats"]["file_count"] == 10
            assert data["stats"]["total_size_mb"] == 1.0
        finally:
            # Restore original
            fastapi_app.state.services.file_service = original_file_service
    
    def test_storage_stats_error_handling(self, test_app):
        """Test error handling in storage stats endpoint."""
        from app.main import app as fastapi_app
        from unittest.mock import MagicMock
        
        # Create a mock that raises an exception
        mock_file_service = MagicMock()
        mock_file_service.get_storage_stats.side_effect = Exception("Database error")
        
        original_file_service = fastapi_app.state.services.file_service
        fastapi_app.state.services.file_service = mock_file_service
        
        try:
            response = test_app.get("/detect/stats")
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        finally:
            fastapi_app.state.services.file_service = original_file_service
    
    def test_detect_service_error(self, test_app, test_image_bytes):
        """Test detection endpoint handles service errors."""
        from app.main import app as fastapi_app
        
        # Configure mock to raise exception
        fastapi_app.state.services.detection_service.detect.side_effect = Exception("Model error")
        
        try:
            files = {"file": ("test.png", BytesIO(test_image_bytes), "image/png")}
            response = test_app.post("/detect/detect", files=files)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "failed" in response.json()["detail"].lower()
        finally:
            # Reset to return a value instead of raising
            fastapi_app.state.services.detection_service.detect.side_effect = None
    
    def test_detect_file_validation_exception(self, test_app, test_image_bytes):
        """Test detection endpoint handles file validation exceptions."""
        from app.main import app as fastapi_app
        from unittest.mock import MagicMock
        
        # Create a mock file_service that raises a generic exception
        mock_file_service = MagicMock()
        mock_file_service.validate_image_file.side_effect = Exception("Unexpected error")
        
        original_file_service = fastapi_app.state.services.file_service
        fastapi_app.state.services.file_service = mock_file_service
        
        try:
            files = {"file": ("test.png", BytesIO(test_image_bytes), "image/png")}
            response = test_app.post("/detect/detect", files=files)
            
            # Should return 400 Bad Request for validation failures
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "validation failed" in response.json()["detail"].lower()
        finally:
            fastapi_app.state.services.file_service = original_file_service
    
    def test_detect_no_content_type(self, test_app, test_image_bytes):
        """Test detection rejects file with no content type."""
        files = {"file": ("test.png", BytesIO(test_image_bytes), None)}
        response = test_app.post("/detect/detect", files=files)
        
        # Should return error (either 400 or 500 depending on how file is processed)
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR]


"""Unit tests for report generation API endpoints."""

import pytest
from io import BytesIO
from datetime import datetime
from fastapi import status
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

from app.schemas import DetectionResponse, PredictionResult, GradCAMExplanation


class TestReportsEndpoints:
    """Test cases for report generation API endpoints."""
    
    def test_generate_pdf_report_success(self, test_app, tmp_path):
        """Test successful PDF report generation."""
        from app.main import app as fastapi_app
        
        session_id = "test-session-123"
        
        # Create mock paths and files
        mock_original = tmp_path / "original.png"
        mock_gradcam = tmp_path / "gradcam.png"
        
        # Create dummy image files
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(mock_original)
        img.save(mock_gradcam)
        
        mock_result = DetectionResponse(
            success=True,
            prediction=PredictionResult(label="AI-generated image", is_deepfake=True),
            explanation=GradCAMExplanation(
                gradcam_image="/results/gradcam.png",
                description="Test"
            )
        )
        
        # Mock session retrieval 
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            # Mock session return as tuple (original_path, gradcam_path, result, timestamp)
            mock_get_session.return_value = (mock_original, mock_gradcam, mock_result, datetime.now())
            
            # Configure PDF service mock
            mock_pdf_buffer = BytesIO(b"%PDF-1.4 test content")
            fastapi_app.state.services.pdf_report_service.generate_report = MagicMock(return_value=mock_pdf_buffer)
            
            # Make request (GET /reports/report/{session_id})
            response = test_app.get(f"/reports/report/{session_id}")
        
        # Verify response
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "application/pdf"
        assert "content-disposition" in response.headers
    
    def test_generate_pdf_invalid_session(self, test_app):
        """Test PDF generation with invalid session ID."""
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            mock_get_session.return_value = None
            
            response = test_app.get("/reports/report/invalid-session")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()
    
    def test_generate_pdf_missing_session_id(self, test_app):
        """Test PDF generation without session_id returns 404 (route not found)."""
        # This should return 404 or 307 redirect since /reports/report/ is not a valid route
        response = test_app.get("/reports/report/")
        
        # Should return 404 Not Found (no matching route) or 307 redirect
        assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_307_TEMPORARY_REDIRECT]
    
    def test_generate_pdf_service_error(self, test_app, tmp_path):
        """Test PDF generation handles service errors."""
        from app.main import app as fastapi_app
        
        session_id = "test-error-session"
        
        # Create mock paths and files
        mock_original = tmp_path / "original.png"
        mock_gradcam = tmp_path / "gradcam.png"
        
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(mock_original)
        img.save(mock_gradcam)
        
        mock_result = DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
        
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            mock_get_session.return_value = (mock_original, mock_gradcam, mock_result, datetime.now())
            
            # Configure PDF service to raise exception
            fastapi_app.state.services.pdf_report_service.generate_report = MagicMock(
                side_effect=Exception("PDF generation failed")
            )
            
            response = test_app.get(f"/reports/report/{session_id}")
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_generate_pdf_response_headers(self, test_app, tmp_path):
        """Test that PDF response has correct headers."""
        from app.main import app as fastapi_app
        
        session_id = "test-headers"
        
        # Create mock paths and files
        mock_original = tmp_path / "original.png"
        mock_gradcam = tmp_path / "gradcam.png"
        
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(mock_original)
        img.save(mock_gradcam)
        
        mock_result = DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
        
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            mock_get_session.return_value = (mock_original, mock_gradcam, mock_result, datetime.now())
            
            # Reset PDF service to return buffer
            mock_pdf_buffer = BytesIO(b"%PDF-1.4 content")
            fastapi_app.state.services.pdf_report_service.generate_report = MagicMock(return_value=mock_pdf_buffer)
            
            response = test_app.get(f"/reports/report/{session_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "application/pdf"
        
        # Check for download header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert ".pdf" in content_disposition
    
    def test_generate_pdf_missing_original_file(self, test_app, tmp_path):
        """Test PDF generation when original image file is missing."""
        from app.main import app as fastapi_app
        
        session_id = "test-missing-original"
        
        # Only create gradcam file, not original
        mock_original = tmp_path / "nonexistent_original.png"
        mock_gradcam = tmp_path / "gradcam.png"
        
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(mock_gradcam)
        
        mock_result = DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
        
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            mock_get_session.return_value = (mock_original, mock_gradcam, mock_result, datetime.now())
            
            response = test_app.get(f"/reports/report/{session_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "original" in response.json()["detail"].lower()
    
    def test_generate_pdf_missing_gradcam_file(self, test_app, tmp_path):
        """Test PDF generation when gradcam image file is missing."""
        from app.main import app as fastapi_app
        
        session_id = "test-missing-gradcam"
        
        # Only create original file, not gradcam
        mock_original = tmp_path / "original.png"
        mock_gradcam = tmp_path / "nonexistent_gradcam.png"
        
        from PIL import Image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(mock_original)
        
        mock_result = DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
        
        with patch('app.api.v1.endpoints.reports.get_session') as mock_get_session:
            mock_get_session.return_value = (mock_original, mock_gradcam, mock_result, datetime.now())
            
            response = test_app.get(f"/reports/report/{session_id}")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "grad-cam" in response.json()["detail"].lower()


class TestCacheStatsEndpoint:
    """Test cases for cache statistics endpoint."""
    
    def test_get_cache_stats_success(self, test_app):
        """Test successful cache stats retrieval."""
        with patch('app.api.v1.endpoints.reports.get_cache_stats') as mock_stats:
            mock_stats.return_value = {
                "total_sessions": 5,
                "active_sessions": 3,
                "old_sessions": 2,
                "max_age_minutes": 60,
                "max_size": 1000000,
                "cleanup_interval_minutes": 60
            }
            
            response = test_app.get("/reports/cache/stats")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["cache_stats"]["total_sessions"] == 5
    
    def test_get_cache_stats_error(self, test_app):
        """Test cache stats endpoint error handling."""
        with patch('app.api.v1.endpoints.reports.get_cache_stats') as mock_stats:
            mock_stats.side_effect = Exception("Cache error")
            
            response = test_app.get("/reports/cache/stats")
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


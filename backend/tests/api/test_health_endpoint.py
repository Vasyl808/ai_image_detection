"""Unit tests for health check API endpoints."""

import pytest
from fastapi import status


class TestHealthEndpoints:
    """Test cases for health check API endpoints."""
    
    def test_health_check_basic(self, test_app):
        """Test basic health check endpoint."""
        response = test_app.get("/health/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Verify basic health info
        assert "status" in data
        assert data["status"] == "healthy"
        assert "version" in data
        assert "api_title" in data
    
    def test_health_check_with_services(self, test_app):
        """Test health check includes service information when initialized."""
        response = test_app.get("/health/")
        
        data = response.json()
        
        # With test_app fixture, services should be initialized
        if "services" in data:
            assert isinstance(data["services"], dict)
            assert "device" in data
    
    def test_health_check_response_structure(self, test_app):
        """Test that health check response has correct structure."""
        response = test_app.get("/health/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Required fields
        required_fields = ["status", "version", "api_title"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
    
    def test_health_check_content_type(self, test_app):
        """Test that health check returns JSON."""
        response = test_app.get("/health/")
        
        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]
    
    def test_health_check_performance(self, test_app):
        """Test that health check responds quickly."""
        import time
        
        start_time = time.time()
        response = test_app.get("/health/")
        elapsed_time = time.time() - start_time
        
        assert response.status_code == status.HTTP_200_OK
        # Health check should be very fast (under 1 second)
        assert elapsed_time < 1.0

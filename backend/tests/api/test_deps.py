"""Unit tests for API dependencies."""

import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from pathlib import Path

import torch
from fastapi import HTTPException


class TestAppState:
    """Test cases for AppState class."""
    
    def test_app_state_initialization(self):
        """Test AppState initializes with all None values."""
        from app.api.deps import AppState
        
        state = AppState()
        
        assert state.model is None
        assert state.device is None
        assert state.detection_service is None
        assert state.file_service is None
        assert state.pdf_report_service is None
    
    def test_is_initialized_false_when_empty(self):
        """Test is_initialized returns False when services not set."""
        from app.api.deps import AppState
        
        state = AppState()
        assert state.is_initialized() is False
    
    def test_is_initialized_false_when_partial(self):
        """Test is_initialized returns False with partial initialization."""
        from app.api.deps import AppState
        
        state = AppState()
        state.model = Mock()
        state.device = torch.device("cpu")
        # Other services not set
        
        assert state.is_initialized() is False
    
    def test_is_initialized_true_when_complete(self):
        """Test is_initialized returns True when all services are set."""
        from app.api.deps import AppState
        
        state = AppState()
        state.model = Mock()
        state.device = torch.device("cpu")
        state.detection_service = Mock()
        state.file_service = Mock()
        state.pdf_report_service = Mock()
        
        assert state.is_initialized() is True
    
    def test_get_info_empty_state(self):
        """Test get_info returns correct values for empty state."""
        from app.api.deps import AppState
        
        state = AppState()
        info = state.get_info()
        
        assert info["model_initialized"] is False
        assert info["device"] is None
        assert info["detection_service_initialized"] is False
        assert info["file_service_initialized"] is False
        assert info["pdf_report_service_initialized"] is False
    
    def test_get_info_full_state(self):
        """Test get_info returns correct values for fully initialized state."""
        from app.api.deps import AppState
        
        state = AppState()
        state.model = Mock()
        state.device = torch.device("cpu")
        state.detection_service = Mock()
        state.file_service = Mock()
        state.pdf_report_service = Mock()
        
        info = state.get_info()
        
        assert info["model_initialized"] is True
        assert info["device"] == "cpu"
        assert info["detection_service_initialized"] is True
        assert info["file_service_initialized"] is True
        assert info["pdf_report_service_initialized"] is True


class TestGetAppState:
    """Test cases for get_app_state dependency."""
    
    def test_get_app_state_missing_services(self):
        """Test get_app_state raises 503 when services missing."""
        from app.api.deps import get_app_state
        
        mock_request = Mock()
        mock_request.app.state = Mock(spec=[])  # No 'services' attribute
        
        with pytest.raises(HTTPException) as exc_info:
            get_app_state(mock_request)
        
        assert exc_info.value.status_code == 503
        assert "SERVICES_NOT_INITIALIZED" in str(exc_info.value.detail)
    
    def test_get_app_state_partial_initialization(self):
        """Test get_app_state raises 503 when services partially initialized."""
        from app.api.deps import get_app_state, AppState
        
        state = AppState()
        state.model = Mock()  # Only model set
        
        mock_request = Mock()
        mock_request.app.state.services = state
        
        with pytest.raises(HTTPException) as exc_info:
            get_app_state(mock_request)
        
        assert exc_info.value.status_code == 503
        assert "SERVICES_PARTIALLY_INITIALIZED" in str(exc_info.value.detail)
    
    def test_get_app_state_success(self):
        """Test get_app_state returns state when fully initialized."""
        from app.api.deps import get_app_state, AppState
        
        state = AppState()
        state.model = Mock()
        state.device = torch.device("cpu")
        state.detection_service = Mock()
        state.file_service = Mock()
        state.pdf_report_service = Mock()
        
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_app_state(mock_request)
        assert result is state


class TestServiceDependencies:
    """Test cases for individual service dependencies."""
    
    def _create_initialized_state(self):
        """Helper to create a fully initialized state."""
        from app.api.deps import AppState
        
        state = AppState()
        state.model = Mock()
        state.device = torch.device("cpu")
        state.detection_service = Mock()
        state.file_service = Mock()
        state.pdf_report_service = Mock()
        return state
    
    def test_get_detection_service(self):
        """Test get_detection_service returns correct service."""
        from app.api.deps import get_detection_service
        
        state = self._create_initialized_state()
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_detection_service(mock_request)
        assert result is state.detection_service
    
    def test_get_model(self):
        """Test get_model returns correct model."""
        from app.api.deps import get_model
        
        state = self._create_initialized_state()
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_model(mock_request)
        assert result is state.model
    
    def test_get_device(self):
        """Test get_device returns correct device."""
        from app.api.deps import get_device
        
        state = self._create_initialized_state()
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_device(mock_request)
        assert result == torch.device("cpu")
    
    def test_get_file_service(self):
        """Test get_file_service returns correct service."""
        from app.api.deps import get_file_service
        
        state = self._create_initialized_state()
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_file_service(mock_request)
        assert result is state.file_service
    
    def test_get_pdf_report_service(self):
        """Test get_pdf_report_service returns correct service."""
        from app.api.deps import get_pdf_report_service
        
        state = self._create_initialized_state()
        mock_request = Mock()
        mock_request.app.state.services = state
        
        result = get_pdf_report_service(mock_request)
        assert result is state.pdf_report_service


class TestInitializeModelAndServices:
    """Test cases for initialize_model_and_services function."""
    
    @pytest.mark.asyncio
    async def test_initialize_without_checkpoint(self):
        """Test initialization when checkpoint doesn't exist."""
        from app.api.deps import initialize_model_and_services, AppState
        
        with patch('app.api.deps.settings') as mock_settings:
            mock_settings.MODEL_DEVICE = 'cpu'
            mock_settings.MODEL_NUM_CLASSES = 1
            mock_settings.USE_DATAPARALLEL = False
            mock_settings.MODEL_CHECKPOINT_PATH = '/nonexistent/path.pth'
            
            state = await initialize_model_and_services()
            
            assert isinstance(state, AppState)
            assert state.is_initialized()
            assert state.device == torch.device('cpu')
    
    @pytest.mark.asyncio
    async def test_initialize_with_checkpoint(self, tmp_path):
        """Test initialization with valid checkpoint."""
        from app.api.deps import initialize_model_and_services
        from app.models import DeepfakeDetector
        
        # Create a mock checkpoint
        checkpoint_path = tmp_path / "model.pth"
        mock_model = DeepfakeDetector(num_classes=1)
        torch.save(mock_model.state_dict(), checkpoint_path)
        
        with patch('app.api.deps.settings') as mock_settings:
            mock_settings.MODEL_DEVICE = 'cpu'
            mock_settings.MODEL_NUM_CLASSES = 1
            mock_settings.USE_DATAPARALLEL = False
            mock_settings.MODEL_CHECKPOINT_PATH = str(checkpoint_path)
            
            state = await initialize_model_and_services()
            
            assert state.is_initialized()
    
    @pytest.mark.asyncio
    async def test_initialize_with_invalid_checkpoint(self, tmp_path):
        """Test initialization with invalid checkpoint falls back to pretrained."""
        from app.api.deps import initialize_model_and_services
        
        # Create an invalid checkpoint file
        checkpoint_path = tmp_path / "invalid_model.pth"
        checkpoint_path.write_bytes(b"invalid data")
        
        with patch('app.api.deps.settings') as mock_settings:
            mock_settings.MODEL_DEVICE = 'cpu'
            mock_settings.MODEL_NUM_CLASSES = 1
            mock_settings.USE_DATAPARALLEL = False
            mock_settings.MODEL_CHECKPOINT_PATH = str(checkpoint_path)
            
            # Should not raise, falls back to pretrained weights
            state = await initialize_model_and_services()
            assert state.is_initialized()

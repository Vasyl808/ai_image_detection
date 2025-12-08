"""Unit tests for DetectionService."""

import pytest
import torch
from pathlib import Path
from PIL import Image
from unittest.mock import Mock, patch, MagicMock

from app.services.detection_service import DetectionService
from app.schemas import DetectionResponse


class TestDetectionService:
    """Test cases for DetectionService."""
    
    def test_initialization(self, mock_model, mock_device):
        """Test that DetectionService initializes correctly."""
        service = DetectionService(mock_model, mock_device)
        
        assert service.model == mock_model
        assert service.device == mock_device
        assert service.gradcam is not None
    
    def test_detect_deepfake(self, mock_detection_service, test_image):
        """Test detection of a deepfake image."""
        # Mock the internal methods
        with patch.object(
            mock_detection_service, '_run_inference', return_value=(True, 1)
        ) as mock_inference, \
        patch.object(
            mock_detection_service, '_generate_gradcam', return_value="/results/gradcam_test.png"
        ) as mock_gradcam:
            
            result = mock_detection_service.detect(test_image)
            
            # Verify the response
            assert isinstance(result, DetectionResponse)
            assert result.success is True
            assert result.prediction.is_deepfake is True
            assert result.prediction.label == "AI-generated image"
            assert result.explanation.gradcam_image == "/results/gradcam_test.png"
            
            # Verify methods were called
            mock_inference.assert_called_once()
            mock_gradcam.assert_called_once()
    
    def test_detect_real_image(self, mock_detection_service, test_image):
        """Test detection of a real image."""
        with patch.object(
            mock_detection_service, '_run_inference', return_value=(False, 0)
        ), \
        patch.object(
            mock_detection_service, '_generate_gradcam', return_value="/results/gradcam_real.png"
        ):
            
            result = mock_detection_service.detect(test_image)
            
            assert result.success is True
            assert result.prediction.is_deepfake is False
            assert result.prediction.label == "Real"
    
    def test_run_inference_deepfake(self, mock_detection_service, mock_torch_tensor):
        """Test inference that predicts deepfake."""
        # Mock model to return high probability (>0.5)
        mock_detection_service.model.return_value = torch.tensor([[0.8]])
        
        is_deepfake, predicted_class = mock_detection_service._run_inference(mock_torch_tensor)
        
        assert is_deepfake is True
        assert predicted_class == 1
    
    def test_run_inference_real(self, mock_detection_service, mock_torch_tensor):
        """Test inference that predicts real image."""
        # Mock model to return low probability (<0.5)
        mock_detection_service.model.return_value = torch.tensor([[-0.5]])
        
        is_deepfake, predicted_class = mock_detection_service._run_inference(mock_torch_tensor)
        
        assert is_deepfake is False
        assert predicted_class == 0
    
    def test_generate_gradcam(
        self, mock_detection_service, test_image, mock_torch_tensor, test_settings
    ):
        """Test Grad-CAM generation and saving."""
        with patch('app.services.detection_service.settings', test_settings), \
             patch.object(mock_detection_service.gradcam, 'generate_cam') as mock_cam:
            
            # Mock CAM generation
            import numpy as np
            mock_cam.return_value = np.random.rand(224, 224)
            
            gradcam_url = mock_detection_service._generate_gradcam(
                test_image, mock_torch_tensor, predicted_class=1
            )
            
            # Verify return format
            assert gradcam_url.startswith("/results/")
            assert gradcam_url.endswith(".png")
            
            # Verify CAM was generated
            mock_cam.assert_called_once()
    
    def test_detect_error_handling(self, mock_detection_service, test_image):
        """Test that detection handles errors gracefully."""
        # Mock preprocess to raise an exception
        with patch('app.services.detection_service.preprocess_image', side_effect=Exception("Processing error")):
            
            with pytest.raises(RuntimeError, match="Detection failed"):
                mock_detection_service.detect(test_image)
    
    def test_detect_with_grayscale_image(self, mock_detection_service):
        """Test detection with grayscale image (should be converted to RGB)."""
        grayscale_image = Image.new('L', (224, 224), color=128)
        
        with patch.object(
            mock_detection_service, '_run_inference', return_value=(False, 0)
        ), \
        patch.object(
            mock_detection_service, '_generate_gradcam', return_value="/results/gradcam.png"
        ):
            
            result = mock_detection_service.detect(grayscale_image)
            assert result.success is True
    
    def test_gradcam_requires_grad(self, mock_detection_service, test_image, mock_torch_tensor):
        """Test that gradients are enabled for Grad-CAM generation."""
        with patch('app.services.detection_service.settings') as mock_settings, \
             patch.object(mock_detection_service.gradcam, 'generate_cam') as mock_cam:
            
            import numpy as np
            mock_cam.return_value = np.random.rand(224, 224)
            mock_settings.RESULTS_DIR = Path("/tmp/results")
            
            # Call generate_gradcam
            mock_detection_service._generate_gradcam(test_image, mock_torch_tensor, 1)
            
            # Verify tensor has requires_grad enabled
            assert mock_torch_tensor.requires_grad is True

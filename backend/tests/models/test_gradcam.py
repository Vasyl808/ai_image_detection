"""Unit tests for GradCAM module."""

import pytest
import numpy as np
from pathlib import Path
from unittest.mock import Mock, patch
import torch
from PIL import Image

from app.models.gradcam import GradCAM, apply_colormap_on_image, save_gradcam_visualization


class TestGradCAMInit:
    """Test cases for GradCAM initialization."""
    
    def test_initialization(self):
        """Test GradCAM initialization with model."""
        from app.models.deepfake_detector import DeepfakeDetector
        
        model = DeepfakeDetector(num_classes=1, pretrained=False)
        gradcam = GradCAM(model)
        
        assert gradcam.model is model


class TestGenerateCam:
    """Test cases for generate_cam method."""
    
    @pytest.fixture
    def gradcam_instance(self):
        """Create GradCAM instance for testing."""
        from app.models.deepfake_detector import DeepfakeDetector
        model = DeepfakeDetector(num_classes=1, pretrained=False)
        return GradCAM(model)
    
    @pytest.fixture
    def sample_input(self):
        """Create sample input tensor."""
        tensor = torch.randn(1, 3, 224, 224)
        tensor.requires_grad = True
        return tensor
    
    def test_generate_cam_shape(self, gradcam_instance, sample_input):
        """Test that generate_cam returns correct shape."""
        cam = gradcam_instance.generate_cam(sample_input)
        
        # CAM should be 2D with spatial dimensions
        assert len(cam.shape) == 2
    
    def test_generate_cam_values_normalized(self, gradcam_instance, sample_input):
        """Test that CAM values are normalized to [0, 1]."""
        cam = gradcam_instance.generate_cam(sample_input)
        
        assert cam.min() >= 0.0
        assert cam.max() <= 1.0
    
    def test_generate_cam_with_target_class_1(self, gradcam_instance, sample_input):
        """Test generate_cam with target class 1 (deepfake)."""
        cam = gradcam_instance.generate_cam(sample_input, target_class=1)
        
        assert isinstance(cam, np.ndarray)
    
    def test_generate_cam_with_target_class_0(self, gradcam_instance, sample_input):
        """Test generate_cam with target class 0 (real)."""
        cam = gradcam_instance.generate_cam(sample_input, target_class=0)
        
        assert isinstance(cam, np.ndarray)
    
    def test_generate_cam_without_target_class(self, gradcam_instance, sample_input):
        """Test generate_cam using predicted class."""
        cam = gradcam_instance.generate_cam(sample_input, target_class=None)
        
        assert isinstance(cam, np.ndarray)


class TestApplyColormapOnImage:
    """Test cases for apply_colormap_on_image function."""
    
    @pytest.fixture
    def sample_pil_image(self):
        """Create sample PIL image."""
        return Image.new('RGB', (224, 224), color='blue')
    
    @pytest.fixture
    def sample_activation_map(self):
        """Create sample activation map."""
        return np.random.rand(7, 7).astype(np.float32)
    
    def test_apply_colormap_pil_input(self, sample_pil_image, sample_activation_map):
        """Test with PIL Image input."""
        heatmap, overlayed = apply_colormap_on_image(sample_pil_image, sample_activation_map)
        
        assert isinstance(heatmap, np.ndarray)
        assert isinstance(overlayed, np.ndarray)
        assert heatmap.shape[2] == 3  # RGB
        assert overlayed.shape == heatmap.shape
    
    def test_apply_colormap_numpy_input(self, sample_activation_map):
        """Test with numpy array input."""
        np_image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        heatmap, overlayed = apply_colormap_on_image(np_image, sample_activation_map)
        
        assert isinstance(heatmap, np.ndarray)
        assert isinstance(overlayed, np.ndarray)
    
    def test_apply_colormap_grayscale_input(self, sample_activation_map):
        """Test with grayscale numpy array input."""
        grayscale_image = np.random.randint(0, 255, (224, 224), dtype=np.uint8)
        
        heatmap, overlayed = apply_colormap_on_image(grayscale_image, sample_activation_map)
        
        assert overlayed.shape[2] == 3  # Should be converted to RGB
    
    def test_apply_colormap_rgba_input(self, sample_activation_map):
        """Test with RGBA numpy array input."""
        rgba_image = np.random.randint(0, 255, (224, 224, 4), dtype=np.uint8)
        
        heatmap, overlayed = apply_colormap_on_image(rgba_image, sample_activation_map)
        
        assert overlayed.shape[2] == 3  # Should be converted to RGB
    
    def test_apply_colormap_pil_non_rgb(self, sample_activation_map):
        """Test with non-RGB PIL image (e.g., RGBA)."""
        rgba_image = Image.new('RGBA', (224, 224), color=(255, 0, 0, 128))
        
        heatmap, overlayed = apply_colormap_on_image(rgba_image, sample_activation_map)
        
        assert overlayed.shape[2] == 3
    
    def test_apply_colormap_resizes_activation(self, sample_pil_image):
        """Test that activation map is resized to image dimensions."""
        small_cam = np.random.rand(7, 7).astype(np.float32)
        
        heatmap, overlayed = apply_colormap_on_image(sample_pil_image, small_cam)
        
        # Heatmap should match image size
        assert heatmap.shape[:2] == (224, 224)


class TestSaveGradcamVisualization:
    """Test cases for save_gradcam_visualization function."""
    
    def test_save_visualization(self, tmp_path):
        """Test saving Grad-CAM visualization to file."""
        original_image = Image.new('RGB', (224, 224), color='green')
        cam = np.random.rand(7, 7).astype(np.float32)
        save_path = str(tmp_path / "gradcam_viz.png")
        
        save_gradcam_visualization(original_image, cam, save_path)
        
        assert Path(save_path).exists()
    
    def test_saved_file_is_valid_image(self, tmp_path):
        """Test that saved file is a valid image."""
        original_image = Image.new('RGB', (224, 224), color='red')
        cam = np.random.rand(7, 7).astype(np.float32)
        save_path = str(tmp_path / "gradcam_test.png")
        
        save_gradcam_visualization(original_image, cam, save_path)
        
        # Verify it can be opened as an image
        loaded = Image.open(save_path)
        assert loaded.size == (224, 224)

"""Unit tests for DeepfakeDetector model."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch
import torch

from app.models.deepfake_detector import DeepfakeDetector


class TestDeepfakeDetectorInit:
    """Test cases for DeepfakeDetector initialization."""
    
    def test_initialization_pretrained(self):
        """Test model initialization with pretrained weights."""
        model = DeepfakeDetector(num_classes=1, pretrained=True)
        
        assert model is not None
        assert isinstance(model, DeepfakeDetector)
        assert hasattr(model, 'efficientnet')
        assert hasattr(model, 'features')
        assert hasattr(model, 'avgpool')
    
    def test_initialization_not_pretrained(self):
        """Test model initialization without pretrained weights."""
        model = DeepfakeDetector(num_classes=1, pretrained=False)
        
        assert model is not None
        assert isinstance(model, DeepfakeDetector)
    
    def test_initialization_custom_num_classes(self):
        """Test model initialization with custom number of classes."""
        model = DeepfakeDetector(num_classes=2, pretrained=False)
        
        assert model is not None
        # Check classifier output layer
        classifier = model.efficientnet.classifier
        final_layer = classifier[-1]
        assert final_layer.out_features == 2
    
    def test_gradients_storage_initialized(self):
        """Test that gradient storage is initialized as None."""
        model = DeepfakeDetector(num_classes=1, pretrained=False)
        
        assert model.gradients is None
        assert model.activations is None


class TestDeepfakeDetectorForward:
    """Test cases for forward pass methods."""
    
    @pytest.fixture
    def model(self):
        """Create a model instance for testing."""
        return DeepfakeDetector(num_classes=1, pretrained=False)
    
    @pytest.fixture
    def sample_input(self):
        """Create sample input tensor."""
        return torch.randn(1, 3, 224, 224)
    
    def test_forward_output_shape(self, model, sample_input):
        """Test standard forward pass output shape."""
        model.eval()  # Use eval mode to avoid BatchNorm requiring >1 samples
        with torch.no_grad():
            output = model(sample_input)
        
        assert output.shape == (1, 1)
    
    def test_forward_with_cam_output_shape(self, model, sample_input):
        """Test forward_with_cam output shape."""
        model.eval()  # Use eval mode to avoid BatchNorm issue
        sample_input.requires_grad = True
        
        output = model.forward_with_cam(sample_input)
        
        assert output.shape == (1, 1)
    
    def test_forward_with_cam_stores_activations(self, model, sample_input):
        """Test that forward_with_cam stores activations."""
        model.eval()  # Use eval mode to avoid BatchNorm issue
        sample_input.requires_grad = True
        
        _ = model.forward_with_cam(sample_input)
        
        assert model.activations is not None
    
    def test_forward_with_cam_gradient_hook(self, model):
        """Test gradient hook during backward pass."""
        # Use batch size of 2 for training mode (BatchNorm requirement)
        sample_input = torch.randn(2, 3, 224, 224, requires_grad=True)
        model.train()
        
        output = model.forward_with_cam(sample_input)
        output.sum().backward()
        
        assert model.gradients is not None
    
    def test_save_gradient_hook(self, model):
        """Test _save_gradient method."""
        test_grad = torch.randn(1, 512, 7, 7)
        
        model._save_gradient(test_grad)
        
        assert model.gradients is test_grad


class TestDeepfakeDetectorWeights:
    """Test cases for weight loading and saving."""
    
    @pytest.fixture
    def model(self):
        """Create a model instance for testing."""
        return DeepfakeDetector(num_classes=1, pretrained=False)
    
    def test_save_weights(self, model, tmp_path):
        """Test saving model weights."""
        save_path = tmp_path / "test_weights.pth"
        
        model.save_weights(save_path)
        
        assert save_path.exists()
    
    def test_load_weights_success(self, model, tmp_path):
        """Test loading valid weights."""
        # Save weights first
        save_path = tmp_path / "test_weights.pth"
        model.save_weights(save_path)
        
        # Load into new model
        new_model = DeepfakeDetector(num_classes=1, pretrained=False)
        result = new_model.load_weights(save_path)
        
        assert result is new_model  # Returns self for chaining
    
    def test_load_weights_file_not_found(self, model, tmp_path):
        """Test loading from non-existent path raises error."""
        fake_path = tmp_path / "nonexistent.pth"
        
        with pytest.raises(FileNotFoundError):
            model.load_weights(fake_path)
    
    def test_load_weights_corrupted_file(self, model, tmp_path):
        """Test loading corrupted weights raises RuntimeError."""
        corrupt_path = tmp_path / "corrupt.pth"
        corrupt_path.write_bytes(b"not a valid pytorch checkpoint")
        
        with pytest.raises(RuntimeError):
            model.load_weights(corrupt_path)
    
    def test_load_weights_with_dataparallel(self, model, tmp_path):
        """Test loading weights saved with DataParallel prefix."""
        # Create state dict with 'module.' prefix
        state_dict = model.state_dict()
        prefixed_state_dict = {f"module.{k}": v for k, v in state_dict.items()}
        
        save_path = tmp_path / "dataparallel_weights.pth"
        torch.save(prefixed_state_dict, save_path)
        
        # Load with dataparallel flag
        new_model = DeepfakeDetector(num_classes=1, pretrained=False)
        result = new_model.load_weights(save_path, use_dataparallel=True)
        
        assert result is new_model


class TestDeepfakeDetectorParameters:
    """Test cases for parameter counting methods."""
    
    @pytest.fixture
    def model(self):
        """Create a model instance for testing."""
        return DeepfakeDetector(num_classes=1, pretrained=False)
    
    def test_count_parameters(self, model):
        """Test _count_parameters returns positive number."""
        count = model._count_parameters()
        
        assert count > 0
        assert isinstance(count, int)
    
    def test_get_num_parameters(self, model):
        """Test get_num_parameters returns tuple."""
        total, trainable = model.get_num_parameters()
        
        assert total > 0
        assert trainable > 0
        assert trainable <= total
    
    def test_parameters_after_freezing(self, model):
        """Test parameter counts after freezing layers."""
        total_before, trainable_before = model.get_num_parameters()
        
        # Freeze all parameters
        for param in model.parameters():
            param.requires_grad = False
        
        total_after, trainable_after = model.get_num_parameters()
        
        assert total_before == total_after
        assert trainable_after == 0

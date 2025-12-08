"""Unit tests for image processing utilities."""

import pytest
import torch
import numpy as np
from PIL import Image

from app.utils.image_processing import (
    preprocess_image,
    denormalize_image,
    tensor_to_pil,
    validate_image_dimensions,
    resize_image_if_needed
)


class TestImageProcessing:
    """Test cases for image processing utilities."""
    
    def test_preprocess_image(self, test_image):
        """Test image preprocessing."""
        tensor = preprocess_image(test_image)
        
        # Verify tensor shape: (1, 3, 224, 224)
        assert tensor.shape == (1, 3, 224, 224)
        assert tensor.dtype == torch.float32
    
    def test_preprocess_grayscale_image(self):
        """Test preprocessing converts grayscale to RGB."""
        grayscale = Image.new('L', (256, 256), color=128)
        tensor = preprocess_image(grayscale)
        
        # Should still have 3 channels after conversion
        assert tensor.shape == (1, 3, 224, 224)
    
    def test_preprocess_rgba_image(self):
        """Test preprocessing handles RGBA images."""
        rgba_image = Image.new('RGBA', (200, 200), color=(255, 0, 0, 255))
        tensor = preprocess_image(rgba_image)
        
        # Should be converted to RGB
        assert tensor.shape == (1, 3, 224, 224)
    
    def test_image_tensor_shape(self, test_image):
        """Test that preprocessed tensor has correct shape."""
        tensor = preprocess_image(test_image)
        
        batch_size, channels, height, width = tensor.shape
        assert batch_size == 1
        assert channels == 3
        assert height == 224
        assert width == 224
    
    def test_image_normalization(self, test_image):
        """Test that image is normalized correctly."""
        tensor = preprocess_image(test_image)
        
        # ImageNet normalization should result in values roughly in range [-3, 3]
        # (depending on the input image)
        assert tensor.min() >= -5.0  # Rough bounds
        assert tensor.max() <= 5.0
    
    def test_denormalize_image(self):
        """Test image denormalization."""
        # Create a normalized tensor
        normalized = torch.randn(3, 224, 224)
        
        denormalized = denormalize_image(normalized)
        
        # Denormalized values should be in [0, 1]
        assert denormalized.min() >= 0.0
        assert denormalized.max() <= 1.0
        assert denormalized.shape == normalized.shape
    
    def test_tensor_to_pil(self):
        """Test conversion from tensor to PIL Image."""
        # Create a random tensor
        tensor = torch.rand(3, 224, 224)
        
        image = tensor_to_pil(tensor, denormalize=False)
        
        assert isinstance(image, Image.Image)
        assert image.size == (224, 224)
        assert image.mode == 'RGB'
    
    def test_tensor_to_pil_with_batch(self):
        """Test tensor to PIL with batch dimension."""
        tensor_batch = torch.rand(1, 3, 224, 224)
        
        image = tensor_to_pil(tensor_batch, denormalize=False)
        
        assert isinstance(image, Image.Image)
        assert image.size == (224, 224)
    
    def test_tensor_to_pil_with_denormalization(self):
        """Test tensor to PIL with denormalization."""
        # Create normalized tensor
        normalized = torch.randn(3, 100, 100)
        
        image = tensor_to_pil(normalized, denormalize=True)
        
        assert isinstance(image, Image.Image)
        assert image.size == (100, 100)
    
    def test_validate_image_dimensions_valid(self):
        """Test validation of valid image dimensions."""
        valid_image = Image.new('RGB', (512, 512))
        
        assert validate_image_dimensions(valid_image) is True
    
    def test_validate_image_dimensions_too_large(self):
        """Test validation rejects images that are too large."""
        large_image = Image.new('RGB', (5000, 5000))
        
        assert validate_image_dimensions(large_image, max_dimension=4096) is False
    
    def test_validate_image_dimensions_too_small(self):
        """Test validation rejects images that are too small."""
        small_image = Image.new('RGB', (20, 20))
        
        assert validate_image_dimensions(small_image) is False
    
    def test_validate_image_dimensions_edge_cases(self):
        """Test validation edge cases."""
        # Exactly at minimum
        min_image = Image.new('RGB', (32, 32))
        assert validate_image_dimensions(min_image) is True
        
        # Just below minimum
        below_min = Image.new('RGB', (31, 31))
        assert validate_image_dimensions(below_min) is False
    
    def test_resize_image_if_needed_no_resize(self):
        """Test that small images are not resized."""
        small_image = Image.new('RGB', (500, 500))
        
        resized = resize_image_if_needed(small_image, max_dimension=2048)
        
        # Should be the same image
        assert resized.size == (500, 500)
    
    def test_resize_image_if_needed_width_exceeds(self):
        """Test resizing when width exceeds maximum."""
        wide_image = Image.new('RGB', (3000, 1000))
        
        resized = resize_image_if_needed(wide_image, max_dimension=2048)
        
        # Width should be reduced to max_dimension
        assert resized.width == 2048
        # Height should be proportionally reduced
        assert resized.height < 1000
        # Aspect ratio should be maintained (approximately)
        original_ratio = wide_image.width / wide_image.height
        resized_ratio = resized.width / resized.height
        assert abs(original_ratio - resized_ratio) < 0.01
    
    def test_resize_image_if_needed_height_exceeds(self):
        """Test resizing when height exceeds maximum."""
        tall_image = Image.new('RGB', (1000, 3000))
        
        resized = resize_image_if_needed(tall_image, max_dimension=2048)
        
        # Height should be reduced to max_dimension
        assert resized.height == 2048
        # Width should be proportionally reduced
        assert resized.width < 1000
    
    def test_resize_maintains_aspect_ratio(self):
        """Test that resizing maintains aspect ratio."""
        image = Image.new('RGB', (2400, 1600))
        
        resized = resize_image_if_needed(image, max_dimension=1200)
        
        # Calculate aspect ratios
        original_ratio = 2400 / 1600
        resized_ratio = resized.width / resized.height
        
        # Should be approximately the same
        assert abs(original_ratio - resized_ratio) < 0.01
    
    def test_preprocess_large_image(self):
        """Test preprocessing of a large image."""
        large_image = Image.new('RGB', (2000, 2000))
        
        tensor = preprocess_image(large_image)
        
        # Should be resized to 224x224
        assert tensor.shape == (1, 3, 224, 224)
    
    def test_preprocess_small_image(self):
        """Test preprocessing of a small image."""
        small_image = Image.new('RGB', (100, 100))
        
        tensor = preprocess_image(small_image)
        
        # Should be resized to 224x224
        assert tensor.shape == (1, 3, 224, 224)

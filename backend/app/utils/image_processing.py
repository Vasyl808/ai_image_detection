"""
Image processing utilities.

Contains helper functions for image preprocessing and manipulation.
"""

import torch
from PIL import Image
from torchvision import transforms

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)


# Define image transformation pipeline
_transform = transforms.Compose([
    transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],  # ImageNet normalization
        std=[0.229, 0.224, 0.225]
    )
])


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Preprocess PIL Image for model input.
    
    Applies the following transformations:
    1. Convert to RGB (if not already)
    2. Resize to model input size (224x224)
    3. Convert to tensor
    4. Normalize using ImageNet statistics
    5. Add batch dimension
    
    Args:
        image: PIL Image object
        
    Returns:
        Preprocessed tensor of shape (1, 3, IMAGE_SIZE, IMAGE_SIZE)
    """
    # Ensure RGB format
    if image.mode != 'RGB':
        logger.debug(f"Converting image from {image.mode} to RGB")
        image = image.convert('RGB')
    
    # Apply transformations
    tensor = _transform(image)
    
    # Add batch dimension
    tensor = tensor.unsqueeze(0)
    
    logger.debug(f"Image preprocessed to tensor of shape {tensor.shape}")
    
    return tensor


def denormalize_image(tensor: torch.Tensor) -> torch.Tensor:
    """
    Denormalize a normalized image tensor.
    
    Reverses the ImageNet normalization to get original pixel values.
    
    Args:
        tensor: Normalized image tensor
        
    Returns:
        Denormalized tensor with values in [0, 1]
    """
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    
    if tensor.is_cuda:
        mean = mean.cuda()
        std = std.cuda()
    
    denormalized = tensor * std + mean
    denormalized = torch.clamp(denormalized, 0, 1)
    
    return denormalized


def tensor_to_pil(tensor: torch.Tensor, denormalize: bool = True) -> Image.Image:
    """
    Convert tensor to PIL Image.
    
    Args:
        tensor: Image tensor of shape (C, H, W) or (1, C, H, W)
        denormalize: Whether to denormalize the tensor first
        
    Returns:
        PIL Image
    """
    # Remove batch dimension if present
    if tensor.dim() == 4:
        tensor = tensor.squeeze(0)
    
    # Denormalize if needed
    if denormalize:
        tensor = denormalize_image(tensor)
    
    # Convert to numpy and PIL
    tensor = tensor.cpu().clamp(0, 1)
    numpy_image = tensor.numpy().transpose(1, 2, 0)
    numpy_image = (numpy_image * 255).astype('uint8')
    
    return Image.fromarray(numpy_image)


def validate_image_dimensions(image: Image.Image, max_dimension: int = 4096) -> bool:
    """
    Validate that image dimensions are within acceptable range.
    
    Args:
        image: PIL Image to validate
        max_dimension: Maximum allowed dimension (width or height)
        
    Returns:
        True if valid, False otherwise
    """
    width, height = image.size
    
    if width > max_dimension or height > max_dimension:
        logger.warning(
            f"Image dimensions ({width}x{height}) exceed maximum ({max_dimension})"
        )
        return False
    
    if width < 32 or height < 32:
        logger.warning(
            f"Image dimensions ({width}x{height}) are too small (minimum 32x32)"
        )
        return False
    
    return True


def resize_image_if_needed(
    image: Image.Image,
    max_dimension: int = 2048
) -> Image.Image:
    """
    Resize image if it exceeds maximum dimension while maintaining aspect ratio.
    
    Args:
        image: PIL Image to resize
        max_dimension: Maximum allowed dimension
        
    Returns:
        Resized PIL Image (or original if no resize needed)
    """
    width, height = image.size
    
    if width <= max_dimension and height <= max_dimension:
        return image
    
    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = max_dimension
        new_height = int(height * (max_dimension / width))
    else:
        new_height = max_dimension
        new_width = int(width * (max_dimension / height))
    
    logger.info(f"Resizing image from {width}x{height} to {new_width}x{new_height}")
    
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

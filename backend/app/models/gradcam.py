"""
Grad-CAM (Gradient-weighted Class Activation Mapping) implementation.

This module provides Grad-CAM visualization for understanding which regions
of an image influenced the model's decision.

Reference:
    "Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization"
    https://arxiv.org/abs/1610.02391
"""

from typing import Optional, Tuple

import cv2
import numpy as np
import torch
from PIL import Image

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models.deepfake_detector import DeepfakeDetector

logger = get_logger(__name__)


class GradCAM:
    """
    Grad-CAM visualization generator.
    
    Generates class activation maps by computing the gradient of the target class
    with respect to feature maps, then creating a weighted combination of these
    feature maps to highlight important regions.
    
    Attributes:
        model: The neural network model to visualize
    """
    
    def __init__(self, model: DeepfakeDetector) -> None:
        """
        Initialize Grad-CAM with a model.
        
        Args:
            model: The deepfake detector model
        """
        self.model = model
        self.model.eval()
    
    def generate_cam(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None
    ) -> np.ndarray:
        """
        Generate Grad-CAM heatmap for an input image.
        
        The process:
        1. Forward pass through the model with activation storage
        2. Compute gradients with respect to the target class
        3. Weight the feature maps by gradient importance
        4. Aggregate to create a heatmap
        
        Args:
            input_tensor: Input image tensor of shape (1, 3, H, W)
            target_class: Target class for visualization (0=Real, 1=Fake).
                         If None, uses the predicted class.
                         
        Returns:
            Heatmap as numpy array of shape (H, W) with values in [0, 1]
        """
        # Forward pass with activation storage
        score = self.model.forward_with_cam(input_tensor)
        
        # Determine target class if not specified
        if target_class is None:
            with torch.no_grad():
                prediction = torch.sigmoid(score)
                target_class = int(prediction.round().item())
        
        # For binary classification with single output:
        # - If target is class 1 (fake), maximize the output
        # - If target is class 0 (real), minimize the output (maximize negative)
        if int(target_class) == 1:
            output = score
        else:
            output = -score
        
        # Backward pass to compute gradients
        self.model.zero_grad()
        output.backward(retain_graph=True)
        
        # Get gradients and activations
        gradients = self.model.gradients  # Shape: (1, C, H, W)
        activations = self.model.activations  # Shape: (1, C, H, W)
        
        if gradients is None or activations is None:
            logger.warning("Gradients or activations are None, returning empty CAM")
            return np.zeros((input_tensor.shape[2], input_tensor.shape[3]))
        
        # Compute weights using Global Average Pooling of gradients
        weights = torch.mean(gradients, dim=(2, 3), keepdim=True)  # Shape: (1, C, 1, 1)
        
        # Compute weighted sum of activation maps
        cam = torch.sum(weights * activations, dim=1).squeeze()  # Shape: (H, W)
        
        # Apply ReLU to keep only positive influences
        cam = torch.relu(cam)
        
        # Normalize to [0, 1]
        cam_min = cam.min()
        cam_max = cam.max()
        
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min + 1e-8)
        else:
            cam = torch.zeros_like(cam)
        
        return cam.detach().cpu().numpy()


def apply_colormap_on_image(
    original_image: Image.Image,
    activation_map: np.ndarray,
    colormap: int = cv2.COLORMAP_JET
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Apply colormap to activation map and overlay on original image.
    
    Creates a heatmap visualization by:
    1. Resizing the activation map to match the original image size
    2. Applying a colormap (default: JET colormap for red-yellow-blue visualization)
    3. Blending the heatmap with the original image
    
    Args:
        original_image: Original PIL Image
        activation_map: Activation map array of shape (H, W) with values in [0, 1]
        colormap: OpenCV colormap constant (default: COLORMAP_JET)
        
    Returns:
        Tuple of (heatmap, overlayed_image) where:
        - heatmap: Colored heatmap as RGB numpy array
        - overlayed_image: Overlay of heatmap on original image as RGB numpy array
    """
    # Convert PIL Image to numpy array
    if isinstance(original_image, Image.Image):
        org_img = np.array(original_image)
    else:
        org_img = original_image
    
    # Resize activation map to match original image dimensions
    height, width = org_img.shape[:2]
    heatmap = cv2.resize(activation_map, (width, height))
    
    # Convert to uint8 range [0, 255]
    heatmap = np.uint8(255 * heatmap)
    
    # Apply colormap
    heatmap = cv2.applyColorMap(heatmap, colormap)
    
    # Convert BGR to RGB (OpenCV uses BGR)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    
    # Create overlay using weighted sum
    # Default: 60% original image, 40% heatmap
    overlayed_img = cv2.addWeighted(
        org_img,
        settings.GRADCAM_BETA,
        heatmap,
        settings.GRADCAM_ALPHA,
        0
    )
    
    return heatmap, overlayed_img


def save_gradcam_visualization(
    original_image: Image.Image,
    cam: np.ndarray,
    save_path: str
) -> None:
    """
    Save Grad-CAM visualization to a file.
    
    Args:
        original_image: Original PIL Image
        cam: Activation map from generate_cam()
        save_path: Path where to save the visualization
    """
    _, overlayed = apply_colormap_on_image(original_image, cam)
    
    # Convert RGB to BGR for OpenCV saving
    overlayed_bgr = cv2.cvtColor(overlayed, cv2.COLOR_RGB2BGR)
    
    cv2.imwrite(save_path, overlayed_bgr)
    logger.info(f"Saved Grad-CAM visualization to {save_path}")

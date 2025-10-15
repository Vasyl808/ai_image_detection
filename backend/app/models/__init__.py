"""
PyTorch models for deepfake detection.

Contains the neural network architectures and Grad-CAM implementation.
"""

from app.models.deepfake_detector import DeepfakeDetector
from app.models.gradcam import GradCAM, apply_colormap_on_image, save_gradcam_visualization

__all__ = [
    "DeepfakeDetector",
    "GradCAM",
    "apply_colormap_on_image",
    "save_gradcam_visualization",
]

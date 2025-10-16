"""
Detection service for deepfake analysis.

Handles the business logic for detecting deepfakes, including
model inference and Grad-CAM generation.
"""

from datetime import datetime
from pathlib import Path
from typing import Tuple
import uuid

import cv2
import torch
from PIL import Image

from app.core.config import settings
from app.core.logging_config import get_logger
from app.models import DeepfakeDetector, GradCAM, apply_colormap_on_image
from app.schemas import DetectionResponse, PredictionResult, GradCAMExplanation
from app.utils.image_processing import preprocess_image

logger = get_logger(__name__)


class DetectionService:
    """
    Service for deepfake detection operations.
    
    This service encapsulates the detection logic including model inference,
    Grad-CAM generation, and result formatting.
    
    Attributes:
        model: The deepfake detector model
        gradcam: Grad-CAM generator
        device: PyTorch device (CPU or CUDA)
    """
    
    def __init__(self, model: DeepfakeDetector, device: torch.device) -> None:
        """
        Initialize the detection service.
        
        Args:
            model: Loaded deepfake detector model
            device: PyTorch device for inference
        """
        self.model = model
        self.device = device
        self.gradcam = GradCAM(model)
        
        logger.info("Detection service initialized")
    
    def detect(self, image: Image.Image) -> DetectionResponse:
        """
        Detect if an image is a deepfake and generate explanation.
        
        This method:
        1. Preprocesses the image
        2. Runs model inference
        3. Generates Grad-CAM visualization
        4. Saves the visualization to a file
        5. Returns structured response
        
        Args:
            image: PIL Image to analyze
            
        Returns:
            Complete detection response with prediction and visualization
            
        Raises:
            RuntimeError: If detection fails
        """
        try:
            # Preprocess image
            img_tensor = preprocess_image(image).to(self.device)
            
            # Model inference
            is_deepfake, predicted_class = self._run_inference(img_tensor)
            
            # Generate Grad-CAM visualization
            gradcam_url = self._generate_gradcam(image, img_tensor, predicted_class)
            
            # Create response
            label = "AI-generated image" if is_deepfake else "Real"
            
            response = DetectionResponse(
                success=True,
                prediction=PredictionResult(
                    label=label,
                    is_deepfake=is_deepfake
                ),
                explanation=GradCAMExplanation(
                    gradcam_image=gradcam_url,
                    description=(
                        f"The highlighted regions show areas that contributed most to "
                        f"classifying this image as {label.lower()}. Red areas indicate "
                        f"regions that strongly influenced the decision."
                    )
                )
            )
            
            logger.info(
                f"Detection completed: {label}"
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Detection failed: {e}", exc_info=True)
            raise RuntimeError(f"Detection failed: {str(e)}")
    
    def _run_inference(self, img_tensor: torch.Tensor) -> Tuple[bool, int]:
        """
        Run model inference on preprocessed image.
        
        Args:
            img_tensor: Preprocessed image tensor
            
        Returns:
            Tuple of (is_deepfake, predicted_class)
        """
        with torch.no_grad():
            output = self.model(img_tensor)
            prediction_prob = torch.sigmoid(output).item()
        
        is_deepfake = prediction_prob > 0.5
        predicted_class = 1 if is_deepfake else 0
        
        return is_deepfake, predicted_class
    
    def _generate_gradcam(
        self,
        original_image: Image.Image,
        img_tensor: torch.Tensor,
        predicted_class: int
    ) -> str:
        """
        Generate and save Grad-CAM visualization.
        
        Args:
            original_image: Original PIL Image
            img_tensor: Preprocessed tensor for Grad-CAM
            predicted_class: Predicted class (0 or 1)
            
        Returns:
            URL path to the saved Grad-CAM image
        """
        # Ensure gradients are enabled
        img_tensor.requires_grad = True
        
        # Generate CAM
        cam = self.gradcam.generate_cam(img_tensor, target_class=predicted_class)
        
        # Apply colormap and create overlay
        _, overlayed_img = apply_colormap_on_image(original_image, cam)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        filename = f"gradcam_{timestamp}_{unique_id}.png"
        filepath = settings.RESULTS_DIR / filename
        
        # Save overlay image
        cv2.imwrite(
            str(filepath),
            cv2.cvtColor(overlayed_img, cv2.COLOR_RGB2BGR)
        )
        
        logger.debug(f"Saved Grad-CAM visualization: {filename}")
        
        # Return URL path
        return f"/results/{filename}"

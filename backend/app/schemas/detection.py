"""
Pydantic schemas for detection API.

Contains request and response models for the deepfake detection endpoints.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class PredictionResult(BaseModel):
    """Model prediction result."""
    
    label: str = Field(..., description="Predicted label: 'Real' or 'Deepfake'")
    is_deepfake: bool = Field(..., description="Whether the image is predicted as deepfake")
    confidence: float = Field(..., ge=0.0, le=100.0, description="Confidence score (0-100)")
    probabilities: "Probabilities" = Field(..., description="Class probabilities")


class Probabilities(BaseModel):
    """Class probabilities."""
    
    real: float = Field(..., ge=0.0, le=100.0, description="Probability of being real (0-100)")
    fake: float = Field(..., ge=0.0, le=100.0, description="Probability of being fake (0-100)")


class GradCAMExplanation(BaseModel):
    """Grad-CAM visualization explanation."""
    
    gradcam_image: str = Field(..., description="URL to Grad-CAM overlay image")
    description: str = Field(..., description="Human-readable explanation of the visualization")


class DetectionResponse(BaseModel):
    """Complete detection API response."""
    
    success: bool = Field(..., description="Whether the detection was successful")
    prediction: PredictionResult = Field(..., description="Prediction results")
    explanation: GradCAMExplanation = Field(..., description="Visual explanation via Grad-CAM")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "success": True,
                "prediction": {
                    "label": "Real",
                    "is_deepfake": False,
                    "confidence": 87.45,
                    "probabilities": {
                        "real": 87.45,
                        "fake": 12.55
                    }
                },
                "explanation": {
                    "gradcam_image": "/results/gradcam_20231015_120000_abc123.png",
                    "description": "The highlighted regions show areas that contributed most to classifying this image as real."
                }
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str = Field(..., description="Service status")
    model_loaded: bool = Field(..., description="Whether the model is loaded")
    version: str = Field(..., description="API version")


class ErrorResponse(BaseModel):
    """Error response model."""
    
    detail: str = Field(..., description="Error description")
    error_code: Optional[str] = Field(None, description="Optional error code")


# Update forward refs
PredictionResult.model_rebuild()

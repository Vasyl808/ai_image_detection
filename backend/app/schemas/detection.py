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


class GradCAMExplanation(BaseModel):
    """Grad-CAM visualization explanation."""
    
    gradcam_image: str = Field(..., description="URL to Grad-CAM overlay image")
    description: str = Field(..., description="Human-readable explanation of the visualization")


class DetectionResponse(BaseModel):
    """Complete detection API response."""
    
    success: bool = Field(..., description="Whether the detection was successful")
    prediction: PredictionResult = Field(..., description="Prediction results")
    explanation: GradCAMExplanation = Field(..., description="Visual explanation via Grad-CAM")
    session_id: Optional[str] = Field(None, description="Session ID for PDF report generation")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "success": True,
                "prediction": {
                    "label": "Real",
                    "is_deepfake": False
                },
                "explanation": {
                    "gradcam_image": "/results/gradcam_20231015_120000_abc123.png",
                    "description": "The highlighted regions show areas that contributed most to classifying this image as real."
                }
            }
        }


class ErrorResponse(BaseModel):
    """Error response model."""
    
    detail: str = Field(..., description="Error description")
    error_code: Optional[str] = Field(None, description="Optional error code")


# Update forward refs
PredictionResult.model_rebuild()

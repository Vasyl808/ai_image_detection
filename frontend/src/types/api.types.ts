/**
 * API types and interfaces
 * 
 * Type definitions for API requests and responses
 */

/**
 * Prediction result from the model
 */
export interface PredictionResult {
  label: "Real" | "AI-generated image";
  is_deepfake: boolean;
}

/**
 * Grad-CAM visualization explanation
 */
export interface GradCAMExplanation {
  gradcam_image: string;
  description: string;
}

/**
 * Complete detection API response
 */
export interface DetectionResponse {
  success: boolean;
  prediction: PredictionResult;
  explanation: GradCAMExplanation;
  session_id?: string;
}

/**
 * API error response
 */
export interface ApiError {
  detail: string;
  error_code?: string;
}
/**
 * API types and interfaces
 * 
 * Type definitions for API requests and responses
 */

/**
 * Prediction result from the model
 */
export interface PredictionResult {
  label: "Real" | "Deepfake";
  is_deepfake: boolean;
  confidence: number;
  probabilities: Probabilities;
}

/**
 * Class probabilities
 */
export interface Probabilities {
  real: number;
  fake: number;
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
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: string;
  model_loaded: boolean;
  version: string;
}

/**
 * Cleanup response
 */
export interface CleanupResponse {
  success: boolean;
  deleted_files: number;
  message: string;
}

/**
 * API error response
 */
export interface ApiError {
  detail: string;
  error_code?: string;
}

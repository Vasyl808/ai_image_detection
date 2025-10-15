/**
 * Detection service
 * 
 * API service for deepfake detection operations
 */

import { AxiosError } from "axios";
import apiClient from "./apiClient";
import type {
  DetectionResponse,
  HealthCheckResponse,
  ApiError,
} from "../../types";

/**
 * Analyze an image for deepfake detection
 * 
 * @param imageFile - Image file to analyze
 * @returns Detection result with prediction and Grad-CAM
 * @throws {Error} If the request fails
 */
export async function analyzeImage(imageFile: File): Promise<DetectionResponse> {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await apiClient.post<DetectionResponse>("/detect", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;

      if (error.response) {
        // Server responded with error
        throw new Error(apiError?.detail || "Server error occurred");
      } else if (error.request) {
        // No response from server
        throw new Error(
          "No response from server. Please check if the backend is running."
        );
      }
    }

    throw new Error("Failed to analyze image");
  }
}

/**
 * Check API health status
 * 
 * @returns Health check response
 * @throws {Error} If the request fails
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await apiClient.get<HealthCheckResponse>("/health");
    return response.data;
  } catch (error) {
    throw new Error("Failed to check health status");
  }
}

/**
 * Get storage statistics
 * 
 * @returns Storage statistics
 * @throws {Error} If the request fails
 */
export async function getStorageStats(): Promise<{
  success: boolean;
  stats: {
    file_count: number;
    total_size_bytes: number;
    total_size_mb: number;
  };
}> {
  try {
    const response = await apiClient.get("/stats");
    return response.data;
  } catch (error) {
    throw new Error("Failed to get storage statistics");
  }
}

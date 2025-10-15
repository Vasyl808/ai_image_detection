/**
 * Application configuration constants
 */

/**
 * API base URL from environment variable or default
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Allowed image file types for upload
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/**
 * Maximum image file size in megabytes
 */
export const MAX_IMAGE_SIZE_MB = 10;

/**
 * Maximum image file size in bytes
 */
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * API request timeout in milliseconds
 */
export const API_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Application metadata
 */
export const APP_METADATA = {
  name: "Deepfake Detector",
  version: "1.0.0",
  description: "AI-powered deepfake detection with visual explanations",
} as const;

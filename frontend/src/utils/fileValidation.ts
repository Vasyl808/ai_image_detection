/**
 * File validation utilities
 * 
 * Helper functions for validating uploaded files
 */

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "../constants";

/**
 * Result of file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate if a file is an allowed image type
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageType(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Validate if a file is within size limits
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageSize(file: File): FileValidationResult {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds the 10MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validate image file (type and size)
 * 
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): FileValidationResult {
  const typeValidation = validateImageType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  const sizeValidation = validateImageSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Create a data URL from a File object
 * 
 * @param file - File to convert
 * @returns Promise resolving to data URL
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size to human-readable string
 * 
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

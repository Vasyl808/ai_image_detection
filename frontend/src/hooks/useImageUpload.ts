/**
 * Image upload hook
 * 
 * Custom hook for handling image upload with validation and preview
 */

import { useState, useCallback } from "react";
import { validateImageFile, createImagePreview } from "../utils";

export interface UseImageUploadReturn {
  selectedFile: File | null;
  preview: string | null;
  error: string | null;
  isValid: boolean;
  handleFileSelect: (file: File) => Promise<void>;
  clearSelection: () => void;
}

/**
 * Hook for managing image upload state and validation
 * 
 * @returns Image upload state and handlers
 */
export function useImageUpload(): UseImageUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle file selection with validation
   */
  const handleFileSelect = useCallback(async (file: File): Promise<void> => {
    // Reset previous state
    setError(null);
    setSelectedFile(null);
    setPreview(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    try {
      // Create preview
      const previewUrl = await createImagePreview(file);

      // Update state
      setSelectedFile(file);
      setPreview(previewUrl);
    } catch (err) {
      setError("Failed to load image preview");
      console.error("Preview creation failed:", err);
    }
  }, []);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback((): void => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    selectedFile,
    preview,
    error,
    isValid: selectedFile !== null && error === null,
    handleFileSelect,
    clearSelection,
  };
}

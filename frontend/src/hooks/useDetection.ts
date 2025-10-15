/**
 * Detection hook
 * 
 * Custom hook for handling deepfake detection requests
 */

import { useState, useCallback } from "react";
import { analyzeImage } from "../services";
import type { DetectionResponse } from "../types";

export interface UseDetectionReturn {
  result: DetectionResponse | null;
  isLoading: boolean;
  error: string | null;
  detectDeepfake: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing detection state and operations
 * 
 * @returns Detection state and handlers
 */
export function useDetection(): UseDetectionReturn {
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Perform deepfake detection on an image
   */
  const detectDeepfake = useCallback(async (file: File): Promise<void> => {
    // Reset previous state
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const detectionResult = await analyzeImage(file);
      setResult(detectionResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setError(errorMessage);
      console.error("Detection error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset detection state
   */
  const reset = useCallback((): void => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    isLoading,
    error,
    detectDeepfake,
    reset,
  };
}

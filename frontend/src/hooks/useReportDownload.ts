/**
 * useReportDownload Hook
 *
 * Custom hook for handling PDF report download functionality
 */

import { useState } from "react";
import { downloadReport, triggerBlobDownload } from "../services";

export interface UseReportDownloadReturn {
  /** Whether a report is currently being downloaded */
  isDownloading: boolean;
  /** Error message if download failed */
  downloadError: string | null;
  /** Function to download a report for a session */
  downloadReport: (sessionId: string) => Promise<void>;
  /** Function to clear download error */
  clearDownloadError: () => void;
}

/**
 * Hook for managing PDF report download state and logic
 *
 * @returns Object with download state, error state, and download function
 */
export function useReportDownload(): UseReportDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * Download PDF report for a detection session
   *
   * @param sessionId - Session ID from detection response
   * @throws {Error} If the request fails or session not found
   */
  const handleDownloadReport = async (sessionId: string): Promise<void> => {
    if (!sessionId) {
      setDownloadError("Session expired. Please analyze the image again.");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Download report using the report service
      const { blob, filename } = await downloadReport(sessionId);

      // Trigger browser download
      triggerBlobDownload(blob, filename);
    } catch (error) {
      console.error("Failed to download report:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to download report";
      setDownloadError(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Clear the current download error
   */
  const clearDownloadError = () => {
    setDownloadError(null);
  };

  return {
    isDownloading,
    downloadError,
    downloadReport: handleDownloadReport,
    clearDownloadError,
  };
}

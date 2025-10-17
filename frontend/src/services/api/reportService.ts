/**
 * Report service
 * 
 * API service for report generation and download operations
 */

import { AxiosError } from "axios";
import apiClient from "./apiClient";

/**
 * Download PDF report for a detection session
 * 
 * @param sessionId - Session ID from detection response
 * @returns Blob containing the PDF file and suggested filename
 * @throws {Error} If the request fails or session not found
 */
export async function downloadReport(sessionId: string): Promise<{
  blob: Blob;
  filename: string;
}> {
  try {
    const response = await apiClient.get(`/reports/report/${sessionId}`, {
      responseType: "blob",
    });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"];
    let filename = `deepfake_report_${Date.now()}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    return {
      blob: response.data,
      filename,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new Error(
          "Session not found or expired. Please analyze the image again."
        );
      } else if (error.response) {
        throw new Error(
          error.response.data?.detail || "Failed to generate report"
        );
      } else if (error.request) {
        throw new Error(
          "No response from server. Please check if the backend is running."
        );
      }
    }

    throw new Error("Failed to download report");
  }
}

/**
 * Utility function to trigger browser download from blob
 * 
 * @param blob - File blob to download
 * @param filename - Suggested filename
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  
  // Append to body, click, and cleanup
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * User-facing messages and text constants
 */

export const ERROR_MESSAGES = {
  FILE_TYPE_INVALID: "Please select an image file (JPEG, PNG, or WebP)",
  FILE_SIZE_EXCEEDED: "Image size must be less than 10MB",
  UPLOAD_FAILED: "Failed to upload image. Please try again.",
  ANALYSIS_FAILED: "Failed to analyze image. Please try again.",
  NETWORK_ERROR: "No response from server. Please check if the backend is running.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

export const INFO_MESSAGES = {
  UPLOAD_PROMPT: "Click to upload or drag and drop",
  UPLOAD_INSTRUCTIONS: "PNG, JPG, JPEG, WEBP up to 10MB",
  IMAGE_READY: "Image ready for analysis",
  WAITING_FOR_IMAGE: "Upload an image and click \"Analyze\" to see results",
  ANALYZING: "Analyzing...",
} as const;

export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: "Analysis completed successfully",
} as const;

export const GRADCAM_MESSAGES = {
  TITLE: "Visual Explanation (Grad-CAM)",
  RED_AREAS: "Red areas indicate regions that strongly influenced the decision",
  RED_YELLOW_AREAS: "Red/Yellow areas",
  RED_YELLOW_DESCRIPTION: "Regions that strongly influenced the prediction",
  BLUE_GREEN_AREAS: "Blue/Green areas",
  BLUE_GREEN_DESCRIPTION: "Regions with less influence on the decision",
  GENERAL_INFO: "Look for unusual patterns or artifacts that might indicate manipulation",
  INTERPRETATION_TITLE: "How to interpret the heatmap:",
} as const;

export const REPORT_MESSAGES = {
  DOWNLOAD_BUTTON: "Download PDF Report",
  GENERATING: "Generating report...",
  ERROR: "Failed to generate PDF report. Please try again.",
  SUCCESS: "Report downloaded successfully",
} as const;

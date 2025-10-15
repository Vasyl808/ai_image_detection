/**
 * Detection Page
 * 
 * Page for uploading and analyzing images for deepfake detection
 */

import { FC } from "react";
import { AlertCircle } from "lucide-react";
import { ImageUpload, ResultDisplay, ErrorMessage, LoadingSpinner } from "../components";
import { useImageUpload, useDetection } from "../hooks";
import { INFO_MESSAGES } from "../constants";

/**
 * Detection page component with vertical layout
 */
export const DetectionPage: FC = () => {
  const {
    selectedFile,
    preview,
    error: uploadError,
    isValid,
    handleFileSelect,
    clearSelection,
  } = useImageUpload();

  const {
    result,
    isLoading,
    error: detectionError,
    detectDeepfake,
    reset: resetDetection,
  } = useDetection();

  /**
   * Handle image analysis
   */
  const handleAnalyze = async (): Promise<void> => {
    if (!selectedFile || !isValid) return;

    try {
      await detectDeepfake(selectedFile);
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  /**
   * Handle reset
   */
  const handleReset = (): void => {
    clearSelection();
    resetDetection();
  };

  /**
   * Get combined error message
   */
  const errorMessage = uploadError || detectionError;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-200px)]">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-xl shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Deepfake Detection
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload an image to analyze it for AI-generated or manipulated content. Get
            instant results with visual explanations.
          </p>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <ErrorMessage
            message={errorMessage}
            onDismiss={() => {
              clearSelection();
              resetDetection();
            }}
            className="mb-8"
          />
        )}

        {/* Vertical Layout: Upload -> Results */}
        <div className="space-y-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <ImageUpload
              onImageSelect={handleFileSelect}
              imagePreview={preview}
              disabled={isLoading}
            />

            {/* Action Buttons */}
            {selectedFile && !result && (
              <div className="flex gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !isValid}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {INFO_MESSAGES.ANALYZING}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Analyze Image
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="btn-secondary"
                  type="button"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Results Section - Below Upload */}
          {isLoading && (
            <div className="card flex items-center justify-center p-12">
              <LoadingSpinner message={INFO_MESSAGES.ANALYZING} size="lg" />
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <ResultDisplay result={result} onReset={handleReset} />
            </div>
          )}

          {!isLoading && !result && !selectedFile && (
            <div className="card flex items-center justify-center text-center p-12 border-2 border-dashed">
              <div>
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {INFO_MESSAGES.WAITING_FOR_IMAGE}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Upload an image above to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
            How to use:
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Upload an image by dragging and dropping or clicking the upload area</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Click "Analyze Image" to start the detection process</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                Review the results, confidence score, and Grad-CAM visualization below
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

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
import styles from "./DetectionPage.module.css";

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
    <div className={styles.container}>
      <div className={styles.maxWidthContainer}>
        {/* Page Header */}
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <div className={styles.iconWrapper}>
              <AlertCircle className={styles.icon} aria-hidden="true" />
            </div>
          </div>
          <h1 className={styles.title}>
            Deepfake Detection
          </h1>
          <p className={styles.description}>
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
            className={styles.errorContainer}
          />
        )}

        {/* Vertical Layout: Upload -> Results */}
        <div className={styles.verticalLayout}>
          {/* Upload Section */}
          <div className={styles.uploadSection}>
            <ImageUpload
              onImageSelect={handleFileSelect}
              imagePreview={preview}
              disabled={isLoading}
            />

            {/* Action Buttons */}
            {selectedFile && !result && (
              <div className={styles.actionButtons}>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !isValid}
                  className={styles.analyzeButton}
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <div className={styles.spinner} />
                      {INFO_MESSAGES.ANALYZING}
                    </>
                  ) : (
                    <>
                      <AlertCircle className={styles.buttonIcon} />
                      Analyze Image
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className={styles.resetButton}
                  type="button"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Results Section - Below Upload */}
          {isLoading && (
            <div className={styles.loadingCard}>
              <LoadingSpinner message={INFO_MESSAGES.ANALYZING} size="lg" />
            </div>
          )}

          {result && (
            <div className={styles.resultsSection}>
              <ResultDisplay result={result} onReset={handleReset} />
            </div>
          )}

          {!isLoading && !result && !selectedFile && (
            <div className={styles.emptyCard}>
              <div>
                <div className={styles.emptyIconWrapper}>
                  <AlertCircle className={styles.emptyIcon} />
                </div>
                <p className={styles.emptyMessage}>
                  {INFO_MESSAGES.WAITING_FOR_IMAGE}
                </p>
                <p className={styles.emptySubMessage}>
                  Upload an image above to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className={styles.infoPanel}>
          <h3 className={styles.infoPanelTitle}>
            How to use:
          </h3>
          <ol className={styles.infoPanelList}>
            <li className={styles.infoPanelItem}>
              <span className={styles.infoPanelNumber}>1.</span>
              <span>Upload an image by dragging and dropping or clicking the upload area</span>
            </li>
            <li className={styles.infoPanelItem}>
              <span className={styles.infoPanelNumber}>2.</span>
              <span>Click "Analyze Image" to start the detection process</span>
            </li>
            <li className={styles.infoPanelItem}>
              <span className={styles.infoPanelNumber}>3.</span>
              <span>
                Review the results and Grad-CAM visualization below
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

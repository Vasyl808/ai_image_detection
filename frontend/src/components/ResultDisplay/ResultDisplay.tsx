/**
 * ResultDisplay Component
 * 
 * Displays detection results with Grad-CAM visualization
 */

import React from "react";
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react";
import clsx from "clsx";
import { API_BASE_URL, GRADCAM_MESSAGES, REPORT_MESSAGES } from "../../constants";
import { useReportDownload } from "../../hooks";
import type { DetectionResponse } from "../../types";
import styles from "./ResultDisplay.module.css";

export interface ResultDisplayProps {
  /** Detection result to display */
  result: DetectionResponse;
  /** Callback when user wants to analyze another image */
  onReset: () => void;
}

/**
 * Component to display detection results with visual explanations
 */
export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  const { prediction, explanation, session_id } = result;
  const isDeepfake = prediction.is_deepfake;
  const { isDownloading, downloadError, downloadReport: handleDownloadReport } = useReportDownload();

  /**
   * Handle PDF report download
   */
  const onDownloadReport = () => {
    if (session_id) {
      handleDownloadReport(session_id);
    }
  };

  return (
    <div className={styles.container}>
      {/* Main Result Card */}
      <div
        className={clsx(styles.resultCard, {
          [styles.resultCardDeepfake]: isDeepfake,
          [styles.resultCardAuthentic]: !isDeepfake,
        })}
      >
        <div className={styles.resultHeader}>
          <div className={styles.resultContent}>
            {isDeepfake ? (
              <XCircle className={clsx(styles.icon, styles.iconDeepfake)} />
            ) : (
              <CheckCircle className={clsx(styles.icon, styles.iconAuthentic)} />
            )}
            <div>
              <h2 className={styles.resultTitle}>
                {prediction.label}
              </h2>
              <p
                className={clsx(styles.resultDescription, {
                  [styles.descriptionDeepfake]: isDeepfake,
                  [styles.descriptionAuthentic]: !isDeepfake,
                })}
              >
                {isDeepfake
                  ? "This image appears to be AI-generated or manipulated"
                  : "This image appears to be authentic"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grad-CAM Visualization */}
      <div className={styles.gradcamCard}>
        <div className={styles.gradcamHeader}>
          <TrendingUp className={styles.gradcamIcon} />
          <h3 className={styles.gradcamTitle}>
            {GRADCAM_MESSAGES.TITLE}
          </h3>
        </div>

        <div className={styles.gradcamImageContainer}>
          <img
            src={`${API_BASE_URL}${explanation.gradcam_image}`}
            alt="Grad-CAM visualization"
            className={styles.gradcamImage}
            crossOrigin="anonymous"
            loading="lazy"
          />
        </div>

        <div className={styles.gradcamDescription}>
          <p className={styles.descriptionText}>
            {explanation.description}
          </p>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className={styles.interpretationCard}>
        <h3 className={styles.interpretationTitle}>
          {GRADCAM_MESSAGES.INTERPRETATION_TITLE}
        </h3>
        <ul className={styles.interpretationList}>
          <li className={styles.interpretationItem}>
            <span className={clsx(styles.bullet, styles.bulletRed)} aria-hidden="true">
              •
            </span>
            <span>
              <strong className={clsx(styles.highlight, styles.highlightRed)}>
                {GRADCAM_MESSAGES.RED_YELLOW_AREAS}:
              </strong>{" "}
              {GRADCAM_MESSAGES.RED_YELLOW_DESCRIPTION}
            </span>
          </li>
          <li className={styles.interpretationItem}>
            <span className={clsx(styles.bullet, styles.bulletBlue)} aria-hidden="true">
              •
            </span>
            <span>
              <strong className={clsx(styles.highlight, styles.highlightBlue)}>
                {GRADCAM_MESSAGES.BLUE_GREEN_AREAS}:
              </strong>{" "}
              {GRADCAM_MESSAGES.BLUE_GREEN_DESCRIPTION}
            </span>
          </li>
          <li className={styles.interpretationItem}>
            <span className={clsx(styles.bullet, styles.bulletGray)} aria-hidden="true">
              •
            </span>
            <span>{GRADCAM_MESSAGES.GENERAL_INFO}</span>
          </li>
        </ul>
      </div>

      {/* Download Error */}
      {downloadError && (
        <div className={styles.errorCard}>
          <p className={styles.errorText}>{downloadError}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        {/* Download PDF Report Button */}
        <button
          onClick={onDownloadReport}
          disabled={isDownloading || !session_id}
          className={styles.downloadButton}
          type="button"
          title={!session_id ? "Session expired" : "Download comprehensive PDF report"}
        >
          {isDownloading ? (
            <>
              <div className={styles.spinner} />
              {REPORT_MESSAGES.GENERATING}
            </>
          ) : (
            <>
              <Download className={styles.buttonIcon} />
              {REPORT_MESSAGES.DOWNLOAD_BUTTON}
            </>
          )}
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className={styles.resetButton}
          type="button"
        >
          <RefreshCw className={styles.buttonIcon} />
          Analyze Another Image
        </button>
      </div>
    </div>
  );
};

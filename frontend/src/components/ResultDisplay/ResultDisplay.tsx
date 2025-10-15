/**
 * ResultDisplay Component
 * 
 * Displays detection results with Grad-CAM visualization
 */

import React from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import { API_BASE_URL, GRADCAM_MESSAGES } from "../../constants";
import type { DetectionResponse } from "../../types";

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
  const { prediction, explanation } = result;
  const isDeepfake = prediction.is_deepfake;

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <div
        className={clsx("card", {
          "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800": isDeepfake,
          "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800": !isDeepfake,
        })}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isDeepfake ? (
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {prediction.label}
              </h2>
              <p
                className={clsx("text-sm", {
                  "text-red-700 dark:text-red-300": isDeepfake,
                  "text-green-700 dark:text-green-300": !isDeepfake,
                })}
              >
                {isDeepfake
                  ? "This image appears to be AI-generated or manipulated"
                  : "This image appears to be authentic"}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confidence
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {prediction.confidence}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={clsx("h-3 rounded-full transition-all duration-500", {
                "bg-red-600": isDeepfake,
                "bg-green-600": !isDeepfake,
              })}
              style={{ width: `${prediction.confidence}%` }}
              role="progressbar"
              aria-valuenow={prediction.confidence}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Probability Breakdown */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Real
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {prediction.probabilities.real}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fake
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {prediction.probabilities.fake}%
            </p>
          </div>
        </div>
      </div>

      {/* Grad-CAM Visualization */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {GRADCAM_MESSAGES.TITLE}
          </h3>
        </div>

        <div className="mb-4">
          <img
            src={`${API_BASE_URL}${explanation.gradcam_image}`}
            alt="Grad-CAM visualization"
            className="w-full rounded-lg shadow-md"
            crossOrigin="anonymous"
            loading="lazy"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            {explanation.description}
          </p>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div className="card bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {GRADCAM_MESSAGES.INTERPRETATION_TITLE}
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-red-600 font-bold mt-0.5" aria-hidden="true">
              •
            </span>
            <span>
              <strong className="text-red-600">
                {GRADCAM_MESSAGES.RED_YELLOW_AREAS}:
              </strong>{" "}
              {GRADCAM_MESSAGES.RED_YELLOW_DESCRIPTION}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5" aria-hidden="true">
              •
            </span>
            <span>
              <strong className="text-blue-600">
                {GRADCAM_MESSAGES.BLUE_GREEN_AREAS}:
              </strong>{" "}
              {GRADCAM_MESSAGES.BLUE_GREEN_DESCRIPTION}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-600 font-bold mt-0.5" aria-hidden="true">
              •
            </span>
            <span>{GRADCAM_MESSAGES.GENERAL_INFO}</span>
          </li>
        </ul>
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="btn-primary w-full flex items-center justify-center gap-2"
        type="button"
      >
        <RefreshCw className="w-5 h-5" />
        Analyze Another Image
      </button>
    </div>
  );
};

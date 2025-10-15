/**
 * ErrorMessage Component
 * 
 * Displays error messages with appropriate styling
 */

import React from "react";
import { XCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";

export interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Error title (optional) */
  title?: string;
  /** Error severity level */
  severity?: "error" | "warning";
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error message display component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = "Error",
  severity = "error",
  onDismiss,
  className,
}) => {
  const isError = severity === "error";

  return (
    <div
      className={clsx(
        "card",
        {
          "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800": isError,
          "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800": !isError,
        },
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p
            className={clsx("font-medium", {
              "text-red-900 dark:text-red-200": isError,
              "text-yellow-900 dark:text-yellow-200": !isError,
            })}
          >
            {title}
          </p>
          <p
            className={clsx("text-sm mt-1", {
              "text-red-700 dark:text-red-300": isError,
              "text-yellow-700 dark:text-yellow-300": !isError,
            })}
          >
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={clsx(
              "flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
              {
                "text-red-600 dark:text-red-400": isError,
                "text-yellow-600 dark:text-yellow-400": !isError,
              }
            )}
            aria-label="Dismiss error"
            type="button"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

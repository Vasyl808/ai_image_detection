/**
 * ErrorMessage Component
 * 
 * Displays error messages with appropriate styling
 */

import React from "react";
import { XCircle, AlertCircle } from "lucide-react";
import clsx from "clsx";
import styles from "./ErrorMessage.module.css";

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
        styles.container,
        {
          [styles.containerError]: isError,
          [styles.containerWarning]: !isError,
        },
        className
      )}
      role="alert"
    >
      <div className={styles.content}>
        {isError ? (
          <XCircle className={clsx(styles.icon, styles.iconError)} />
        ) : (
          <AlertCircle className={clsx(styles.icon, styles.iconWarning)} />
        )}
        <div className={styles.textContainer}>
          <p
            className={clsx(styles.title, {
              [styles.titleError]: isError,
              [styles.titleWarning]: !isError,
            })}
          >
            {title}
          </p>
          <p
            className={clsx(styles.message, {
              [styles.messageError]: isError,
              [styles.messageWarning]: !isError,
            })}
          >
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={clsx(
              styles.dismissButton,
              {
                [styles.dismissButtonError]: isError,
                [styles.dismissButtonWarning]: !isError,
              }
            )}
            aria-label="Dismiss error"
            type="button"
          >
            <XCircle className={styles.dismissIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

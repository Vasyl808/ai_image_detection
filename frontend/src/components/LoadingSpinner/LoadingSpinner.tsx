/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner with optional message
 */

import React from "react";
import clsx from "clsx";
import styles from "./LoadingSpinner.module.css";

export interface LoadingSpinnerProps {
  /** Loading message to display */
  message?: string;
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading spinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg,
  };

  return (
    <div
      className={clsx(styles.container, className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={clsx(
          styles.spinner,
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {message && (
        <p className={styles.message}>{message}</p>
      )}
      <span className={styles.srOnly}>{message}</span>
    </div>
  );
};

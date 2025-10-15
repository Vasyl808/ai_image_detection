/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner with optional message
 */

import React from "react";
import clsx from "clsx";

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
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={clsx("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
    >
      <div
        className={clsx(
          "border-primary-200 border-t-primary-600 rounded-full animate-spin",
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
};

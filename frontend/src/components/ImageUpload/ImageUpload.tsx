/**
 * ImageUpload Component
 * 
 * Handles image file upload with drag-and-drop and validation
 */

import React, { useRef, useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";
import { INFO_MESSAGES } from "../../constants";

export interface ImageUploadProps {
  /** Callback when a valid image is selected */
  onImageSelect: (file: File) => void;
  /** Current image preview URL */
  imagePreview: string | null;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Image upload component with drag-and-drop support
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  imagePreview,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file && !disabled) {
        onImageSelect(file);
      }
    },
    [onImageSelect, disabled]
  );

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect, disabled]
  );

  /**
   * Handle click to open file picker
   */
  const handleClick = useCallback((): void => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className={clsx("card", className)}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Upload Image
      </h2>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={clsx(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          {
            "cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50":
              !disabled && !imagePreview,
            "border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20":
              imagePreview,
            "border-gray-300 dark:border-gray-600": !imagePreview,
            "opacity-50 cursor-not-allowed": disabled,
          }
        )}
      >
        {imagePreview ? (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click or drag to change image
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <div>
              <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                {INFO_MESSAGES.UPLOAD_PROMPT}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {INFO_MESSAGES.UPLOAD_INSTRUCTIONS}
              </p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload image file"
        />
      </div>

      {imagePreview && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <span>{INFO_MESSAGES.IMAGE_READY}</span>
        </div>
      )}
    </div>
  );
};

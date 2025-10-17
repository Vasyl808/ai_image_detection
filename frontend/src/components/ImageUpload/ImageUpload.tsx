/**
 * ImageUpload Component
 * 
 * Handles image file upload with drag-and-drop and validation
 */

import React, { useRef, useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";
import { INFO_MESSAGES } from "../../constants";
import styles from "./ImageUpload.module.css";

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
    <div className={clsx(styles.container, className)}>
      <h2 className={styles.title}>
        Upload Image
      </h2>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={clsx(
          styles.dropzone,
          {
            [styles.dropzoneActive]: !disabled && !imagePreview,
            [styles.dropzoneWithPreview]: imagePreview,
            [styles.dropzoneDefault]: !imagePreview,
            [styles.dropzoneDisabled]: disabled,
          }
        )}
      >
        {imagePreview ? (
          <div className={styles.previewContainer}>
            <img
              src={imagePreview}
              alt="Preview"
              className={styles.previewImage}
            />
            <p className={styles.previewText}>
              Click or drag to change image
            </p>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <div className={styles.iconWrapper}>
              <div className={styles.iconCircle}>
                <Upload className={styles.uploadIcon} />
              </div>
            </div>
            <div className={styles.textContainer}>
              <p className={styles.promptTitle}>
                {INFO_MESSAGES.UPLOAD_PROMPT}
              </p>
              <p className={styles.promptInstructions}>
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
          className={styles.fileInput}
          aria-label="Upload image file"
        />
      </div>

      {imagePreview && (
        <div className={styles.statusBar}>
          <ImageIcon className={styles.statusIcon} />
          <span>{INFO_MESSAGES.IMAGE_READY}</span>
        </div>
      )}
    </div>
  );
};

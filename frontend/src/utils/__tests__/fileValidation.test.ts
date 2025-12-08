/**
 * Unit tests for file validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateImageType,
  validateImageSize,
  validateImageFile,
  createImagePreview,
  formatFileSize,
  type FileValidationResult,
} from '../fileValidation';

describe('fileValidation', () => {
  describe('validateImageType', () => {
    it('should validate allowed image types', () => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      allowedTypes.forEach((type) => {
        const file = new File(['content'], 'test.jpg', { type });
        const result = validateImageType(file);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject disallowed image types', () => {
      const disallowedTypes = ['image/gif', 'image/bmp', 'application/pdf', 'text/plain'];

      disallowedTypes.forEach((type) => {
        const file = new File(['content'], 'test.file', { type });
        const result = validateImageType(file);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid file type');
      });
    });

    it('should return error message with allowed types', () => {
      const file = new File(['content'], 'test.gif', { type: 'image/gif' });
      const result = validateImageType(file);

      expect(result.error).toContain('image/jpeg');
      expect(result.error).toContain('image/png');
    });
  });

  describe('validateImageSize', () => {
    it('should validate files within size limit', () => {
      const sizes = [
        100, // 100 bytes
        1024 * 1024, // 1 MB
        5 * 1024 * 1024, // 5 MB
        10 * 1024 * 1024, // 10 MB (exactly at limit)
      ];

      sizes.forEach((size) => {
        const content = new ArrayBuffer(size);
        const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
        const result = validateImageSize(file);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject files exceeding size limit', () => {
      const size = 11 * 1024 * 1024; // 11 MB
      const content = new ArrayBuffer(size);
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageSize(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('exceeds the 10MB limit');
    });

    it('should include file size in error message', () => {
      const size = 15 * 1024 * 1024; // 15 MB
      const content = new ArrayBuffer(size);
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageSize(file);

      expect(result.error).toContain('15.00MB');
    });
  });

  describe('validateImageFile', () => {
    it('should validate files that pass both type and size checks', () => {
      const content = new ArrayBuffer(1024 * 1024); // 1 MB
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail if type validation fails', () => {
      const content = new ArrayBuffer(1024); // Small file
      const file = new File([content], 'test.gif', { type: 'image/gif' });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should fail if size validation fails', () => {
      const content = new ArrayBuffer(15 * 1024 * 1024); // 15 MB
      const file = new File([content], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds the 10MB limit');
    });

    it('should prioritize type validation over size validation', () => {
      const content = new ArrayBuffer(15 * 1024 * 1024); // 15 MB
      const file = new File([content], 'test.gif', { type: 'image/gif' });
      const result = validateImageFile(file);

      expect(result.valid).toBe(false);
      // Should fail on type first
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('createImagePreview', () => {
    it('should create a data URL from a file', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const preview = await createImagePreview(file);

      expect(preview).toBeDefined();
      expect(typeof preview).toBe('string');
      expect(preview).toContain('data:');
      expect(preview).toContain('image/jpeg');
    });

    it('should handle different image types', async () => {
      const types = ['image/jpeg', 'image/png', 'image/webp'];

      for (const type of types) {
        const file = new File(['content'], 'test', { type });
        const preview = await createImagePreview(file);

        expect(preview).toContain(`data:${type}`);
      }
    });

    it('should reject promise on FileReader error', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to simulate an error
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }
        onerror: ((event: Event) => void) | null = null;
        onloadend: ((event: Event) => void) | null = null;
        result: string | null = null;
      } as any;

      await expect(createImagePreview(file)).rejects.toThrow('Failed to read file');

      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(9876543210)).toBe('9.2 GB');
    });
  });
});

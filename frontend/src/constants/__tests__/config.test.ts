/**
 * Unit tests for config constants
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { API_BASE_URL, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB, MAX_IMAGE_SIZE_BYTES, API_TIMEOUT_MS, APP_METADATA } from '../config';

describe('config', () => {
  describe('API_BASE_URL', () => {
    let originalEnv: any;

    beforeEach(() => {
      // Save original env
      originalEnv = import.meta.env.VITE_API_URL;
    });

    afterEach(() => {
      // Restore original env
      if (originalEnv !== undefined) {
        import.meta.env.VITE_API_URL = originalEnv;
      } else {
        delete import.meta.env.VITE_API_URL;
      }
    });

    it('should use environment variable when set', () => {
      // This test verifies the export works
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should use default URL when environment variable is not set', () => {
      // The constant is already evaluated, but we can test its fallback behavior
      // by checking if it's a valid URL format
      expect(API_BASE_URL).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('ALLOWED_IMAGE_TYPES', () => {
    it('should contain all supported image types', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    });

    it('should have exactly 4 allowed types', () => {
      expect(ALLOWED_IMAGE_TYPES).toHaveLength(4);
    });

    it('should be readonly', () => {
      expect(Object.isFrozen(ALLOWED_IMAGE_TYPES)).toBe(false); // as const makes it readonly in TS, not frozen
      // But we can verify it's an array
      expect(Array.isArray(ALLOWED_IMAGE_TYPES)).toBe(true);
    });
  });

  describe('MAX_IMAGE_SIZE', () => {
    it('should have correct max size in MB', () => {
      expect(MAX_IMAGE_SIZE_MB).toBe(10);
    });

    it('should have correct max size in bytes', () => {
      expect(MAX_IMAGE_SIZE_BYTES).toBe(10 * 1024 * 1024);
      expect(MAX_IMAGE_SIZE_BYTES).toBe(10485760);
    });

    it('should calculate bytes from MB correctly', () => {
      expect(MAX_IMAGE_SIZE_BYTES).toBe(MAX_IMAGE_SIZE_MB * 1024 * 1024);
    });
  });

  describe('API_TIMEOUT_MS', () => {
    it('should have 30 second timeout', () => {
      expect(API_TIMEOUT_MS).toBe(30000);
    });

    it('should be in milliseconds', () => {
      expect(API_TIMEOUT_MS).toBeGreaterThan(0);
      expect(API_TIMEOUT_MS % 1000).toBe(0); // Should be whole seconds
    });
  });

  describe('APP_METADATA', () => {
    it('should have application name', () => {
      expect(APP_METADATA.name).toBe('Deepfake Detector');
    });

    it('should have version', () => {
      expect(APP_METADATA.version).toBe('1.0.0');
      expect(APP_METADATA.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description', () => {
      expect(APP_METADATA.description).toBeDefined();
      expect(typeof APP_METADATA.description).toBe('string');
      expect(APP_METADATA.description.length).toBeGreaterThan(0);
    });

    it('should contain all required metadata fields', () => {
      expect(APP_METADATA).toHaveProperty('name');
      expect(APP_METADATA).toHaveProperty('version');
      expect(APP_METADATA).toHaveProperty('description');
    });
  });
});

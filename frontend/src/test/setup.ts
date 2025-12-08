/**
 * Test setup file
 * 
 * Global test configuration and utilities
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader for testing file uploads
class MockFileReader {
  result: string | ArrayBuffer | null = null;
  error: Error | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(file: Blob): void {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }

  readAsText(file: Blob): void {
    setTimeout(() => {
      this.result = 'mock text content';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
}

global.FileReader = MockFileReader as any;

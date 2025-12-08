/**
 * Unit tests for useImageUpload hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageUpload } from '../useImageUpload';
import * as utils from '../../utils';

// Mock the utils
vi.mock('../../utils', () => ({
  validateImageFile: vi.fn(),
  createImagePreview: vi.fn(),
}));

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null values and invalid state', () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(false);
    expect(typeof result.current.handleFileSelect).toBe('function');
    expect(typeof result.current.clearSelection).toBe('function');
  });

  it('should handle valid file selection', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({ valid: true });
    vi.mocked(utils.createImagePreview).mockResolvedValue('data:image/jpeg;base64,preview');

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.selectedFile).toBe(file);
    expect(result.current.preview).toBe('data:image/jpeg;base64,preview');
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(true);
    expect(utils.validateImageFile).toHaveBeenCalledWith(file);
    expect(utils.createImagePreview).toHaveBeenCalledWith(file);
  });

  it('should handle invalid file type', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({
      valid: false,
      error: 'Invalid file type',
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.gif', { type: 'image/gif' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBe('Invalid file type');
    expect(result.current.isValid).toBe(false);
    expect(utils.createImagePreview).not.toHaveBeenCalled();
  });

  it('should handle file size validation error', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({
      valid: false,
      error: 'File size exceeds limit',
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['large content'], 'large.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.error).toBe('File size exceeds limit');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it('should handle preview creation error', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({ valid: true });
    vi.mocked(utils.createImagePreview).mockRejectedValue(new Error('Preview failed'));

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.error).toBe('Failed to load image preview');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it('should reset state when selecting new file after error', async () => {
    // First selection fails
    vi.mocked(utils.validateImageFile).mockReturnValueOnce({
      valid: false,
      error: 'Invalid file',
    });

    const { result } = renderHook(() => useImageUpload());
    const file1 = new File(['content1'], 'invalid.gif', { type: 'image/gif' });

    await act(async () => {
      await result.current.handleFileSelect(file1);
    });

    expect(result.current.error).toBe('Invalid file');

    // Second selection succeeds
    vi.mocked(utils.validateImageFile).mockReturnValueOnce({ valid: true });
    vi.mocked(utils.createImagePreview).mockResolvedValueOnce('data:image/png;base64,preview');

    const file2 = new File(['content2'], 'valid.png', { type: 'image/png' });

    await act(async () => {
      await result.current.handleFileSelect(file2);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.selectedFile).toBe(file2);
    expect(result.current.preview).toBe('data:image/png;base64,preview');
    expect(result.current.isValid).toBe(true);
  });

  it('should clear selection and reset all state', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({ valid: true });
    vi.mocked(utils.createImagePreview).mockResolvedValue('data:image/jpeg;base64,preview');

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    // Select a file
    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.selectedFile).toBe(file);
    expect(result.current.isValid).toBe(true);

    // Clear selection
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.preview).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isValid).toBe(false);
  });

  it('should handle validation error without error message', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({
      valid: false,
      // No error message provided
    });

    const { result } = renderHook(() => useImageUpload());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.handleFileSelect(file);
    });

    expect(result.current.error).toBe('Invalid file');
  });

  it('should replace previous selection when selecting new file', async () => {
    vi.mocked(utils.validateImageFile).mockReturnValue({ valid: true });
    vi.mocked(utils.createImagePreview)
      .mockResolvedValueOnce('data:image/jpeg;base64,preview1')
      .mockResolvedValueOnce('data:image/png;base64,preview2');

    const { result } = renderHook(() => useImageUpload());
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.png', { type: 'image/png' });

    // First selection
    await act(async () => {
      await result.current.handleFileSelect(file1);
    });

    expect(result.current.selectedFile).toBe(file1);
    expect(result.current.preview).toBe('data:image/jpeg;base64,preview1');

    // Second selection
    await act(async () => {
      await result.current.handleFileSelect(file2);
    });

    expect(result.current.selectedFile).toBe(file2);
    expect(result.current.preview).toBe('data:image/png;base64,preview2');
  });
});

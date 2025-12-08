/**
 * Unit tests for useDetection hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDetection } from '../useDetection';
import * as services from '../../services';

// Mock the services
vi.mock('../../services', () => ({
  analyzeImage: vi.fn(),
}));

describe('useDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null result, no loading, and no error', () => {
    const { result } = renderHook(() => useDetection());

    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.detectDeepfake).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should set loading state when detecting deepfake', async () => {
    const mockResponse = {
      prediction: 'REAL',
      confidence: 0.95,
      gradcam_image: 'base64-data',
      session_id: 'session-123',
    };

    vi.mocked(services.analyzeImage).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    const { result } = renderHook(() => useDetection());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.detectDeepfake(file);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should successfully detect deepfake and update result', async () => {
    const mockResponse = {
      prediction: 'FAKE',
      confidence: 0.87,
      gradcam_image: 'base64-gradcam',
      session_id: 'session-456',
    };

    vi.mocked(services.analyzeImage).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDetection());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.detectDeepfake(file);
    });

    expect(result.current.result).toEqual(mockResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(services.analyzeImage).toHaveBeenCalledWith(file);
  });

  it('should handle detection errors', async () => {
    const errorMessage = 'Failed to analyze image';
    vi.mocked(services.analyzeImage).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useDetection());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.detectDeepfake(file);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    vi.mocked(services.analyzeImage).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useDetection());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.detectDeepfake(file);
    });

    expect(result.current.error).toBe('Failed to analyze image');
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should reset previous state when starting new detection', async () => {
    const mockResponse1 = {
      prediction: 'REAL',
      confidence: 0.9,
      gradcam_image: 'data1',
      session_id: 'session-1',
    };

    const mockResponse2 = {
      prediction: 'FAKE',
      confidence: 0.8,
      gradcam_image: 'data2',
      session_id: 'session-2',
    };

    vi.mocked(services.analyzeImage)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useDetection());
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

    // First detection
    await act(async () => {
      await result.current.detectDeepfake(file1);
    });

    expect(result.current.result).toEqual(mockResponse1);

    // Second detection
    await act(async () => {
      await result.current.detectDeepfake(file2);
    });

    expect(result.current.result).toEqual(mockResponse2);
    expect(result.current.error).toBeNull();
  });

  it('should clear error when starting new detection after error', async () => {
    vi.mocked(services.analyzeImage)
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({
        prediction: 'REAL',
        confidence: 0.95,
        gradcam_image: 'data',
        session_id: 'session-123',
      });

    const { result } = renderHook(() => useDetection());
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

    // First detection (error)
    await act(async () => {
      await result.current.detectDeepfake(file1);
    });

    expect(result.current.error).toBe('First error');

    // Second detection (success)
    await act(async () => {
      await result.current.detectDeepfake(file2);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeDefined();
  });

  it('should reset all state to initial values', async () => {
    const mockResponse = {
      prediction: 'FAKE',
      confidence: 0.85,
      gradcam_image: 'data',
      session_id: 'session-789',
    };

    vi.mocked(services.analyzeImage).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDetection());
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    // Perform detection
    await act(async () => {
      await result.current.detectDeepfake(file);
    });

    expect(result.current.result).toEqual(mockResponse);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

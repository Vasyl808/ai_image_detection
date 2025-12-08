/**
 * Unit tests for useReportDownload hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportDownload } from '../useReportDownload';
import * as services from '../../services';

// Mock the services
vi.mock('../../services', () => ({
  downloadReport: vi.fn(),
  triggerBlobDownload: vi.fn(),
}));

describe('useReportDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useReportDownload());

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadError).toBeNull();
    expect(typeof result.current.downloadReport).toBe('function');
    expect(typeof result.current.clearDownloadError).toBe('function');
  });

  it('should successfully download report', async () => {
    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    const mockResponse = {
      blob: mockBlob,
      filename: 'report_123.pdf',
    };

    vi.mocked(services.downloadReport).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('session-123');
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadError).toBeNull();
    expect(services.downloadReport).toHaveBeenCalledWith('session-123');
    expect(services.triggerBlobDownload).toHaveBeenCalledWith(mockBlob, 'report_123.pdf');
  });

  it('should set downloading state during download', async () => {
    const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
    const mockResponse = {
      blob: mockBlob,
      filename: 'report.pdf',
    };

    vi.mocked(services.downloadReport).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    const { result } = renderHook(() => useReportDownload());

    act(() => {
      result.current.downloadReport('session-123');
    });

    expect(result.current.isDownloading).toBe(true);
    expect(result.current.downloadError).toBeNull();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.isDownloading).toBe(false);
  });

  it('should handle download error', async () => {
    const errorMessage = 'Session not found';
    vi.mocked(services.downloadReport).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('invalid-session');
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadError).toBe(errorMessage);
    expect(services.triggerBlobDownload).not.toHaveBeenCalled();
  });

  it('should handle non-Error exceptions', async () => {
    vi.mocked(services.downloadReport).mockRejectedValueOnce('String error');

    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('session-123');
    });

    expect(result.current.downloadError).toBe('Failed to download report');
  });

  it('should handle empty session ID', async () => {
    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('');
    });

    expect(result.current.downloadError).toBe('Session expired. Please analyze the image again.');
    expect(result.current.isDownloading).toBe(false);
    expect(services.downloadReport).not.toHaveBeenCalled();
  });

  it('should clear previous error when downloading again', async () => {
    // First download fails
    vi.mocked(services.downloadReport).mockRejectedValueOnce(new Error('First error'));

    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('session-1');
    });

    expect(result.current.downloadError).toBe('First error');

    // Second download succeeds
    const mockBlob = new Blob(['content'], { type: 'application/pdf' });
    vi.mocked(services.downloadReport).mockResolvedValueOnce({
      blob: mockBlob,
      filename: 'report.pdf',
    });

    await act(async () => {
      await result.current.downloadReport('session-2');
    });

    expect(result.current.downloadError).toBeNull();
  });

  it('should clear download error', async () => {
    vi.mocked(services.downloadReport).mockRejectedValueOnce(new Error('Download failed'));

    const { result } = renderHook(() => useReportDownload());

    // Trigger error
    await act(async () => {
      await result.current.downloadReport('session-123');
    });

    expect(result.current.downloadError).toBe('Download failed');

    // Clear error
    act(() => {
      result.current.clearDownloadError();
    });

    expect(result.current.downloadError).toBeNull();
  });

  it('should set downloading to false even if error occurs', async () => {
    vi.mocked(services.downloadReport).mockRejectedValueOnce(new Error('Download failed'));

    const { result } = renderHook(() => useReportDownload());

    await act(async () => {
      await result.current.downloadReport('session-123');
    });

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadError).toBe('Download failed');
  });

  it('should handle multiple consecutive downloads', async () => {
    const mockBlob1 = new Blob(['PDF 1'], { type: 'application/pdf' });
    const mockBlob2 = new Blob(['PDF 2'], { type: 'application/pdf' });

    vi.mocked(services.downloadReport)
      .mockResolvedValueOnce({ blob: mockBlob1, filename: 'report1.pdf' })
      .mockResolvedValueOnce({ blob: mockBlob2, filename: 'report2.pdf' });

    const { result } = renderHook(() => useReportDownload());

    // First download
    await act(async () => {
      await result.current.downloadReport('session-1');
    });

    expect(services.triggerBlobDownload).toHaveBeenCalledWith(mockBlob1, 'report1.pdf');

    // Second download
    await act(async () => {
      await result.current.downloadReport('session-2');
    });

    expect(services.triggerBlobDownload).toHaveBeenCalledWith(mockBlob2, 'report2.pdf');
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadError).toBeNull();
  });
});

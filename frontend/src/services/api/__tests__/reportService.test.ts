/**
 * Unit tests for report service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadReport, triggerBlobDownload } from '../reportService';
import apiClient from '../apiClient';

// Mock the apiClient
vi.mock('../apiClient');

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadReport', () => {
    it('should successfully download a report', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const mockHeaders = {
        'content-disposition': 'attachment; filename="report_123.pdf"',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: mockHeaders,
      });

      const result = await downloadReport('session-123');

      expect(result.blob).toBe(mockBlob);
      expect(result.filename).toBe('report_123.pdf');
      expect(apiClient.get).toHaveBeenCalledWith('/reports/report/session-123', {
        responseType: 'blob',
      });
    });

    it('should parse filename from content-disposition header', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      const testCases = [
        {
          header: 'attachment; filename="my_custom_report.pdf"',
          expected: 'my_custom_report.pdf',
        },
        {
          header: 'attachment; filename=simple_name.pdf',
          expected: 'simple_name.pdf',
        },
      ];

      for (const testCase of testCases) {
        vi.mocked(apiClient.get).mockResolvedValueOnce({
          data: mockBlob,
          headers: { 'content-disposition': testCase.header },
        });

        const result = await downloadReport('session-123');
        expect(result.filename).toBe(testCase.expected);
      }
    });

    it('should use default filename when content-disposition is missing', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: {},
      });

      const result = await downloadReport('session-123');

      expect(result.filename).toMatch(/^deepfake_report_\d+\.pdf$/);
    });

    it('should throw error for 404 not found', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
        },
      } as any;

      vi.mocked(apiClient.get).mockRejectedValueOnce(errorResponse);

      await expect(downloadReport('invalid-session')).rejects.toThrow(
        'Session not found or expired. Please analyze the image again.'
      );
    });

    it('should throw error with server error message', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status:500,
          data: {
            detail: 'Failed to generate PDF',
          },
        },
      } as any;

      vi.mocked(apiClient.get).mockRejectedValueOnce(errorResponse);

      await expect(downloadReport('session-123')).rejects.toThrow(
        'Failed to generate PDF'
      );
    });

    it('should throw error when no response from server', async () => {
      const errorResponse = {
        isAxiosError: true,
        request: {},
        response: undefined,
      } as any;

      vi.mocked(apiClient.get).mockRejectedValueOnce(errorResponse);

      await expect(downloadReport('session-123')).rejects.toThrow(
        'No response from server. Please check if the backend is running.'
      );
    });

    it('should throw generic error for unknown errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Unknown error'));

      await expect(downloadReport('session-123')).rejects.toThrow(
        'Failed to download report'
      );
    });

    it('should handle response error without detail', async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      } as any;

      vi.mocked(apiClient.get).mockRejectedValueOnce(errorResponse);

      await expect(downloadReport('session-123')).rejects.toThrow(
        'Failed to generate report'
      );
    });

    it('should use default filename when content-disposition has no match', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-disposition': 'invalid-header' },
      });

      const result = await downloadReport('session-123');

      expect(result.filename).toMatch(/^deepfake_report_\d+\.pdf$/);
    });
  });

  describe('triggerBlobDownload', () => {
    let createElementSpy: ReturnType<typeof vi.spyOn>;
    let appendChildSpy: ReturnType<typeof vi.spyOn>;
    let removeChildSpy: ReturnType<typeof vi.spyOn>;
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      mockLink = document.createElement('a');
      mockLink.click = vi.fn();

      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    });

    afterEach(() => {
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should trigger download with correct blob and filename', () => {
      const blob = new Blob(['test content'], { type: 'application/pdf' });
      const filename = 'test_report.pdf';

      triggerBlobDownload(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.href).toContain('mock-url');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
    });

    it('should create and revoke object URL', () => {
      const blob = new Blob(['content'], { type: 'application/pdf' });

      triggerBlobDownload(blob, 'test.pdf');

      expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should cleanup link element from DOM', () => {
      const blob = new Blob(['content'], { type: 'application/pdf' });

      triggerBlobDownload(blob, 'test.pdf');

      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });
});

/**
 * Unit tests for detection service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import { analyzeImage } from '../detectionService';
import apiClient from '../apiClient';

// Mock the apiClient
vi.mock('../apiClient');

describe('detectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should successfully analyze an image', async () => {
      const mockResponse = {
        prediction: 'REAL',
        confidence: 0.95,
        gradcam_image: 'base64-encoded-gradcam',
        session_id: 'test-session-123',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await analyzeImage(file);

      expect(result).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/detect/detect',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    });

    it('should send file in FormData', async () => {
      const mockResponse = {
        prediction: 'FAKE',
        confidence: 0.85,
        gradcam_image: 'base64-data',
        session_id: 'session-456',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const file = new File(['test content'], 'image.png', { type: 'image/png' });
      await analyzeImage(file);

      const callArgs = vi.mocked(apiClient.post).mock.calls[0];
      const formData = callArgs[1] as FormData;

      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('file')).toBe(file);
    });

    it('should throw error with server error message', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            detail: 'Invalid image format',
          },
        },
      } as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(errorResponse);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(analyzeImage(file)).rejects.toThrow('Invalid image format');
    });

    it('should throw error when server responds with generic error', async () => {
      const errorResponse = {
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(errorResponse);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(analyzeImage(file)).rejects.toThrow('Server error occurred');
    });

    it('should throw error when no response from server', async () => {
      const errorResponse = {
        request: {},
        response: undefined,
      } as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(errorResponse);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(analyzeImage(file)).rejects.toThrow(
        'No response from server. Please check if the backend is running.'
      );
    });

    it('should throw generic error for unknown errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Unknown error'));

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(analyzeImage(file)).rejects.toThrow('Failed to analyze image');
    });

    it('should handle errors with isAxiosError flag', async () => {
      const errorResponse = {
        isAxiosError: true,
        request: {},
        response: undefined,
      } as AxiosError;

      vi.mocked(apiClient.post).mockRejectedValueOnce(errorResponse);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      await expect(analyzeImage(file)).rejects.toThrow(
        'No response from server. Please check if the backend is running.'
      );
    });
  });
});

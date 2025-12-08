/**
 * Unit tests for API client and interceptors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing anything else
vi.mock('axios');

describe('apiClient', () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let requestErrorHandler: any;
  let responseInterceptor: any;
  let responseErrorHandler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock interceptors
    const mockInterceptors = {
      request: {
        use: vi.fn((success, error) => {
          requestInterceptor = success;
          requestErrorHandler = error;
        }),
      },
      response: {
        use: vi.fn((success, error) => {
          responseInterceptor = success;
          responseErrorHandler = error;
        }),
      },
    };

    mockAxiosInstance = {
      interceptors: mockInterceptors,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);

    // Import apiClient to trigger module initialization
    await import('../apiClient');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration', () => {
    it('should create axios instance with correct base config', () => {
      expect(axios.create).toHaveBeenCalled();
      
      const createCall = vi.mocked(axios.create).mock.calls[0]?.[0];
      expect(createCall).toBeDefined();
      expect(createCall).toMatchObject({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('request interceptor', () => {
    it('should pass through successful requests', async () => {
      const mockConfig = {
        url: '/test',
        method: 'GET',
        headers: {},
      };

      const result = await requestInterceptor(mockConfig);
      expect(result).toBe(mockConfig);
    });

    it('should handle request errors', async () => {
      const mockError = new Error('Request setup failed');
      await expect(requestErrorHandler(mockError)).rejects.toThrow('Request setup failed');
    });
  });

  describe('response interceptor', () => {
    it('should pass through successful responses', async () => {
      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      const result = await responseInterceptor(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it('should handle server errors with response', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { detail: 'Server error' },
        },
        isAxiosError: true,
      };

      await expect(responseErrorHandler(mockError)).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith(
        'API Error:',
        500,
        { detail: 'Server error' }
      );
    });

    it('should handle network errors (no response)', async () => {
      const mockError = {
        request: {},
        isAxiosError: true,
      };

      await expect(responseErrorHandler(mockError)).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith(
        'Network Error: No response from server'
      );
    });

    it('should handle other errors', async () => {
      const mockError = {
        message: 'Something went wrong',
        isAxiosError: true,
      };

      await expect(responseErrorHandler(mockError)).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalledWith(
        'Error:',
        'Something went wrong'
      );
    });

    it('should handle errors with different status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const status of statusCodes) {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const mockError = {
          response: {
            status,
            data: { detail: `Error ${status}` },
          },
          isAxiosError: true,
        };

        await expect(responseErrorHandler(mockError)).rejects.toEqual(mockError);
        expect(console.error).toHaveBeenCalledWith(
          'API Error:',
          status,
          { detail: `Error ${status}` }
        );
      }
    });

    it('should handle errors without detailed data', async () => {
      const mockError = {
        response: {
          status: 500,
          data: null,
        },
        isAxiosError: true,
      };

      await expect(responseErrorHandler(mockError)).rejects.toEqual(mockError);
      expect(console.error).toHaveBeenCalled();
    });
  });
});


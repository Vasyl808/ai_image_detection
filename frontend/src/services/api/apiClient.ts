/**
 * API client configuration
 * 
 * Axios instance with default configuration for API requests
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../../constants";

/**
 * Create and configure axios instance
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor
 * 
 * Can be used to add auth tokens, logging, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    // e.g., config.headers.Authorization = `Bearer ${token}`
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * 
 * Handles common response patterns and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error("API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error("Network Error: No response from server");
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

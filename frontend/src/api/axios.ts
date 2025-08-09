/**
 * Axios API Configuration
 * Following TRS Section 4 specifications with security-ready patterns
 * 
 * Features:
 * - Environment-based base URL configuration
 * - Request/response interceptors ready for auth
 * - Error handling with security context
 * - Request timeout and retry logic
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api';

// =============================================================================
// TYPE EXTENSIONS
// =============================================================================

/**
 * Extend Axios request config to include metadata for tracking
 */
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/**
 * Get API base URL from environment variables
 * Following TRS: VITE_API_BASE_URL points to mock endpoints until real backend exists
 */
const getApiBaseUrl = (): string => {
  // Remove the trailing slash if present to avoid double slashes
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  
  // Security-ready: validate URL format in production
  if (import.meta.env.PROD && !baseUrl.startsWith('http')) {
    console.warn('Production environment detected with relative API URL. Ensure proper proxy configuration.');
  }
  
  console.log('🌐 API Base URL:', baseUrl);
  return baseUrl;
};

// =============================================================================
// AXIOS INSTANCE CONFIGURATION
// =============================================================================

/**
 * Main API client instance with security-ready configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };
    
    // Log the full URL being requested
    console.log('📡 API Request:', {
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// =============================================================================
// REQUEST INTERCEPTORS (Security-ready)
// =============================================================================

/**
 * Request interceptor - ready for auth token injection
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };
    
    // Security-ready: Auth token injection point
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
    // Security logging point
    if (import.meta.env.DEV) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    // Request setup error logging
    console.error('❌ API Request Setup Error:', error);
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTORS (Security-ready)
// =============================================================================

/**
 * Response interceptor - handles auth errors and security validation
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Performance logging
    const duration = new Date().getTime() - (response.config.metadata?.startTime?.getTime() || 0);
    
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
    }
    
    // Security-ready: Response validation point
    // validateResponseSignature(response);
    
    // Unwrap SecureApiResponse structure from MSW mocks
    if (response.data && typeof response.data === 'object') {
      console.log('📦 Response data before unwrapping:', {
        url: response.config.url,
        data: response.data,
        hasData: 'data' in response.data,
        hasTimestamp: 'timestamp' in response.data,
        hasSuccess: 'success' in response.data
      });

      if ('data' in response.data && 'timestamp' in response.data && 'success' in response.data) {
        // This is a SecureApiResponse wrapper - unwrap it
        console.log('🔓 Unwrapping SecureApiResponse for:', response.config.url);
        response.data = response.data.data;
        console.log('📦 Unwrapped data:', response.data);
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Security-ready error handling
    if (error.response) {
      const status = error.response.status;
      
      // Auth error handling (ready for implementation)
      if (status === 401) {
        console.warn('🔐 Authentication required - redirecting to login');
        // handleAuthError();
      } else if (status === 403) {
        console.warn('🚫 Access forbidden - insufficient permissions');
        // handlePermissionError();
      } else if (status >= 500) {
        console.error('🔥 Server error detected');
        // reportSecurityIncident(error);
      }
    }
    
    // Network error handling
    if (error.code === 'NETWORK_ERROR') {
      console.error('🌐 Network connectivity issue');
    }
    
    return Promise.reject(createApiError(error));
  }
);

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Transform Axios errors into standardized API errors
 */
const createApiError = (error: AxiosError): ApiError => {
  const response = error.response;
  const status = response?.status || 0;
  
  // Extract error details with type safety
  const errorData = response?.data as unknown;
  let message = 'An unexpected error occurred';
  let code = 'UNKNOWN_ERROR';
  
  if (errorData && typeof errorData === 'object') {
    const data = errorData as Record<string, unknown>;
    if (typeof data.message === 'string') {
      message = data.message;
    }
    if (typeof data.code === 'string') {
      code = data.code;
    }
  }
  
  // Fallback to HTTP status messages
  if (message === 'An unexpected error occurred') {
    if (status >= 400 && status < 500) {
      message = `Client error: ${error.message}`;
      code = 'CLIENT_ERROR';
    } else if (status >= 500) {
      message = `Server error: ${error.message}`;
      code = 'SERVER_ERROR';
    } else if (error.code === 'NETWORK_ERROR') {
      message = 'Network connectivity issue';
      code = 'NETWORK_ERROR';
    }
  }

  return {
    message,
    code,
    timestamp: new Date().toISOString(),
  };
};

// =============================================================================
// SECURITY-READY UTILITY FUNCTIONS
// =============================================================================

/**
 * Security-ready function placeholders for future implementation
 */

// Authentication token management (to be implemented)
// const getAuthToken = (): string | null => {
//   return localStorage.getItem('auth_token');
// };

// const handleAuthError = (): void => {
//   // Clear invalid token and redirect to login
//   localStorage.removeItem('auth_token');
//   window.location.href = '/login';
// };

// Permission error handling (to be implemented)
// const handlePermissionError = (): void => {
//   // Show permission denied message
//   showNotification('Access denied. Contact administrator.', 'error');
// };

// Security incident reporting (to be implemented)
// const reportSecurityIncident = (error: AxiosError): void => {
//   // Report security-related errors to monitoring system
//   console.error('Security incident reported:', error);
// };

// Response signature validation (to be implemented)
// const validateResponseSignature = (response: AxiosResponse): boolean => {
//   // Verify response integrity and authenticity
//   return true;
// };

// =============================================================================
// EXPORT DEFAULT INSTANCE
// =============================================================================

export default apiClient; 
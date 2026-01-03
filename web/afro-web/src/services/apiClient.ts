import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, getRememberMe } from './authService';

/**
 * API Client (Frontend)
 * 
 * Configured axios instance with:
 * - Automatic token injection
 * - Token refresh on 401
 * - Error handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if it's a token_expired error
      const errorData = error.response.data as any;
      
      if (errorData?.error === 'token_expired') {
        if (isRefreshing) {
          // Queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        const refreshTokenValue = getRefreshToken();
        
        if (!refreshTokenValue) {
          clearTokens();
          window.location.href = '/onboarding';
          return Promise.reject(error);
        }
        
        try {
          // Refresh token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshTokenValue,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens (preserve remember me preference)
          setTokens(accessToken, newRefreshToken, getRememberMe());
          
          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          
          processQueue();
          isRefreshing = false;
          
          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          isRefreshing = false;
          
          // Clear tokens and redirect to onboarding
          clearTokens();
          window.location.href = '/onboarding';
          
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;






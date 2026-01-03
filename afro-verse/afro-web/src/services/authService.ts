import { apiClient } from './apiClient';

/**
 * Auth Service (Frontend)
 * 
 * Handles authentication API calls and token management.
 */

export interface SendOTPResponse {
  otpSessionId: string;
  message: string;
}

export interface VerifyOTPResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  user: {
    id: string;
    phoneE164: string;
    username: string;
    displayName: string;
    tribeId: string | null;
    avatar?: any;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  phoneE164: string;
  username: string;
  displayName: string;
  bio?: string;
  tribeId: string;
  avatar?: {
    imagePath: string;
    thumbPath: string;
  };
  counters: {
    posts: number;
    respectsReceived: number;
  };
  createdAt: string;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phoneE164: string): Promise<SendOTPResponse> {
  const response = await apiClient.post('/auth/otp/send', {
    phoneE164,
  });
  
  return response.data;
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  otpSessionId: string,
  code: string
): Promise<VerifyOTPResponse> {
  // Validate inputs
  if (!otpSessionId) {
    throw new Error('Session ID is required');
  }
  
  if (!code || code.length !== 6) {
    throw new Error('Code must be 6 digits');
  }
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Verifying OTP', {
      otpSessionId: otpSessionId.substring(0, 8) + '...',
      codeLength: code.length,
    });
  }
  
  try {
    const response = await apiClient.post('/auth/otp/verify', {
      otpSessionId,
      code,
    });
    
    return response.data;
  } catch (error: any) {
    // Enhanced error logging
    if (process.env.NODE_ENV === 'development') {
      console.error('OTP verification error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await apiClient.post('/auth/refresh', {
    refreshToken,
  });
  
  return response.data;
}

/**
 * Logout
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', {
    refreshToken,
  });
}

/**
 * Get current user
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get('/users/me');
  return response.data;
}

/**
 * Token Storage
 */

const ACCESS_TOKEN_KEY = 'afromoji_access_token';
const REFRESH_TOKEN_KEY = 'afromoji_refresh_token';
const REMEMBER_ME_KEY = 'afromoji_remember_me';

/**
 * Get storage based on remember me preference
 */
function getStorage(): Storage {
  if (typeof window === 'undefined') return {} as Storage;
  
  // Check if user has remember me enabled
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
}

/**
 * Set remember me preference
 */
export function setRememberMe(remember: boolean): void {
  if (typeof window === 'undefined') return;
  
  if (remember) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

/**
 * Get remember me preference
 */
export function getRememberMe(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function setTokens(accessToken: string, refreshToken: string, rememberMe: boolean = true): void {
  if (typeof window === 'undefined') return;
  
  console.log('🔐 Setting tokens:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    rememberMe,
    storage: rememberMe ? 'localStorage' : 'sessionStorage',
  });
  
  // Set remember me preference
  setRememberMe(rememberMe);
  
  // Store tokens in appropriate storage
  const storage = getStorage();
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  // Verify tokens were saved
  const savedAccessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const savedRefreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  console.log('✅ Tokens saved:', {
    accessTokenSaved: !!savedAccessToken,
    refreshTokenSaved: !!savedRefreshToken,
    accessTokenLength: savedAccessToken?.length,
  });
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try both storages (for migration)
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try both storages (for migration)
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🗑️ Clearing all tokens');
  console.trace('clearTokens called from:');
  
  // Clear from both storages
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}






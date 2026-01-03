import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  sendOTP,
  verifyOTP,
  refreshToken as refreshTokenAPI,
  logout as logoutAPI,
  getMe,
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  type User,
} from '../services/authService';

/**
 * Auth Store (Frontend)
 * 
 * Manages authentication state and token refresh.
 */

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // OTP Flow
  otpSessionId: string | null;
  phoneE164: string | null;
  
  // Actions
  sendOTP: (phoneE164: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<{ isNewUser: boolean }>;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpSessionId: null,
      phoneE164: null,
      
      // Send OTP
      sendOTP: async (phoneE164: string) => {
        try {
          set({ isLoading: true, error: null, phoneE164 });
          
          const response = await sendOTP(phoneE164);
          
          set({
            otpSessionId: response.otpSessionId,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to send OTP';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },
      
      // Verify OTP
      verifyOTP: async (code: string) => {
        try {
          const { otpSessionId } = get();
          
          if (!otpSessionId) {
            throw new Error('No OTP session');
          }
          
          set({ isLoading: true, error: null });
          
          const response = await verifyOTP(otpSessionId, code);
          
          // Store tokens (default to remember me = true for convenience)
          setTokens(response.accessToken, response.refreshToken, true);
          
          set({
            user: {
              ...response.user,
              tribeId: response.user.tribeId || '',
              counters: { posts: 0, respectsReceived: 0 },
              createdAt: new Date().toISOString(),
            } as any,
            isAuthenticated: true,
            isLoading: false,
            otpSessionId: null,
            phoneE164: null,
          });
          
          return {
            isNewUser: response.isNewUser,
          };
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Invalid code';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },
      
      // Refresh token
      refreshToken: async () => {
        try {
          const refreshTokenValue = getRefreshToken();
          
          if (!refreshTokenValue) {
            throw new Error('No refresh token');
          }
          
          const response = await refreshTokenAPI(refreshTokenValue);
          
          // Update tokens (preserve remember me preference)
          const { getRememberMe } = await import('../services/authService');
          setTokens(response.accessToken, response.refreshToken, getRememberMe());
          
          // Load user data
          await get().loadUser();
        } catch (error: any) {
          // If refresh fails, logout
          await get().logout();
          throw error;
        }
      },
      
      // Logout
      logout: async () => {
        try {
          const refreshTokenValue = getRefreshToken();
          
          if (refreshTokenValue) {
            await logoutAPI(refreshTokenValue);
          }
        } catch (error) {
          // Ignore logout errors
        } finally {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            otpSessionId: null,
            phoneE164: null,
            error: null,
          });
        }
      },
      
      // Load user
      loadUser: async () => {
        try {
          const accessToken = getAccessToken();
          
          if (!accessToken) {
            set({ isAuthenticated: false, user: null });
            return;
          }
          
          set({ isLoading: true });
          
          const user = await getMe();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          // If loading user fails, try refreshing token
          try {
            await get().refreshToken();
          } catch (refreshError) {
            // If refresh fails, logout
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Auto-refresh token when app loads
 */
if (typeof window !== 'undefined') {
  const accessToken = getAccessToken();
  
  if (accessToken) {
    useAuthStore.getState().loadUser();
  }
}




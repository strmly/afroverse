import { create } from 'zustand';
import {
  getMyProfile,
  getUserProfile,
  updateProfile as updateProfileService,
  setAvatar as setAvatarService,
  type Profile,
  type UpdateProfileInput,
  type SetAvatarInput,
} from '../services/profileService';

/**
 * User Store (Frontend)
 * 
 * Manages user profile state.
 */

interface UserState {
  // Current user profile (self)
  myProfile: Profile | null;
  isLoadingMyProfile: boolean;
  
  // Viewed user profile (others)
  viewedProfile: Profile | null;
  isLoadingViewedProfile: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  loadMyProfile: () => Promise<void>;
  loadUserProfile: (username: string) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  setAvatar: (input: SetAvatarInput) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  myProfile: null,
  isLoadingMyProfile: false,
  viewedProfile: null,
  isLoadingViewedProfile: false,
  error: null,
  
  // Load authenticated user's profile
  loadMyProfile: async () => {
    set({ isLoadingMyProfile: true, error: null });
    
    try {
      const profile = await getMyProfile();
      set({
        myProfile: profile,
        isLoadingMyProfile: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load profile',
        isLoadingMyProfile: false,
      });
    }
  },
  
  // Load public user profile
  loadUserProfile: async (username: string) => {
    set({ isLoadingViewedProfile: true, error: null });
    
    try {
      const profile = await getUserProfile(username);
      set({
        viewedProfile: profile,
        isLoadingViewedProfile: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load profile',
        isLoadingViewedProfile: false,
      });
    }
  },
  
  // Update profile
  updateProfile: async (input: UpdateProfileInput) => {
    set({ error: null });
    
    try {
      const updatedProfile = await updateProfileService(input);
      set({
        myProfile: updatedProfile,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to update profile',
      });
      throw error;
    }
  },
  
  // Set avatar from generation
  setAvatar: async (input: SetAvatarInput) => {
    set({ error: null });
    
    try {
      await setAvatarService(input);
      
      // Reload profile to get updated avatar
      await get().loadMyProfile();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to set avatar',
      });
      throw error;
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Reset state
  reset: () => {
    set({
      myProfile: null,
      viewedProfile: null,
      error: null,
    });
  },
}));








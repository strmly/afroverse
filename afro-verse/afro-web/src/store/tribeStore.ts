import { create } from 'zustand';
import {
  getAllTribes,
  getTribe,
  joinTribe as joinTribeService,
  getTribePosts,
  getTribeMembers,
  type Tribe,
  type TribeDetail,
  type TribePost,
  type TribeMember,
} from '../services/tribeService';

/**
 * Tribe Store (Frontend)
 * 
 * Manages tribe state including:
 * - Tribe directory
 * - Current tribe details
 * - Tribe posts and members
 */

interface TribeState {
  // Tribe directory
  tribes: Tribe[];
  isLoadingTribes: boolean;
  
  // Current tribe
  currentTribe: TribeDetail | null;
  isLoadingTribe: boolean;
  
  // Tribe posts
  tribePosts: TribePost[];
  postsCursor?: string;
  hasMorePosts: boolean;
  isLoadingPosts: boolean;
  
  // Tribe members
  tribeMembers: TribeMember[];
  membersCursor?: string;
  hasMoreMembers: boolean;
  isLoadingMembers: boolean;
  
  // Error
  error: string | null;
  
  // Actions
  loadTribes: () => Promise<void>;
  loadTribe: (slug: string) => Promise<void>;
  joinTribe: (slug: string) => Promise<void>;
  loadTribePosts: (slug: string, reset?: boolean) => Promise<void>;
  loadTribeMembers: (slug: string, reset?: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useTribeStore = create<TribeState>((set, get) => ({
  // Initial state
  tribes: [],
  isLoadingTribes: false,
  currentTribe: null,
  isLoadingTribe: false,
  tribePosts: [],
  hasMorePosts: true,
  isLoadingPosts: false,
  tribeMembers: [],
  hasMoreMembers: true,
  isLoadingMembers: false,
  error: null,
  
  // Load all tribes (directory)
  loadTribes: async () => {
    set({ isLoadingTribes: true, error: null });
    
    try {
      const tribes = await getAllTribes();
      set({
        tribes,
        isLoadingTribes: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load tribes',
        isLoadingTribes: false,
      });
    }
  },
  
  // Load tribe details
  loadTribe: async (slug: string) => {
    set({ isLoadingTribe: true, error: null });
    
    try {
      const tribe = await getTribe(slug);
      set({
        currentTribe: tribe,
        isLoadingTribe: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load tribe',
        isLoadingTribe: false,
      });
    }
  },
  
  // Join tribe (onboarding)
  joinTribe: async (slug: string) => {
    set({ error: null });
    
    try {
      const result = await joinTribeService(slug);
      
      // Update user's tribe in auth store
      // const { useAuthStore } = await import('./authStore');
      // useAuthStore.getState().setUserTribe(result.tribe);
      
      // Reload current tribe to update viewer state
      await get().loadTribe(slug);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to join tribe',
      });
      throw error;
    }
  },
  
  // Load tribe posts
  loadTribePosts: async (slug: string, reset: boolean = false) => {
    const { isLoadingPosts, hasMorePosts, tribePosts, postsCursor } = get();
    
    if (reset) {
      set({
        tribePosts: [],
        postsCursor: undefined,
        hasMorePosts: true,
      });
    }
    
    if (isLoadingPosts || (!reset && !hasMorePosts)) {
      return;
    }
    
    set({ isLoadingPosts: true, error: null });
    
    try {
      const response = await getTribePosts(
        slug,
        12,
        reset ? undefined : postsCursor
      );
      
      set({
        tribePosts: reset ? response.items : [...tribePosts, ...response.items],
        postsCursor: response.nextCursor,
        hasMorePosts: !!response.nextCursor,
        isLoadingPosts: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load posts',
        isLoadingPosts: false,
      });
    }
  },
  
  // Load tribe members
  loadTribeMembers: async (slug: string, reset: boolean = false) => {
    const { isLoadingMembers, hasMoreMembers, tribeMembers, membersCursor } = get();
    
    if (reset) {
      set({
        tribeMembers: [],
        membersCursor: undefined,
        hasMoreMembers: true,
      });
    }
    
    if (isLoadingMembers || (!reset && !hasMoreMembers)) {
      return;
    }
    
    set({ isLoadingMembers: true, error: null });
    
    try {
      const response = await getTribeMembers(
        slug,
        20,
        reset ? undefined : membersCursor
      );
      
      set({
        tribeMembers: reset ? response.items : [...tribeMembers, ...response.items],
        membersCursor: response.nextCursor,
        hasMoreMembers: !!response.nextCursor,
        isLoadingMembers: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load members',
        isLoadingMembers: false,
      });
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
  
  // Reset state
  reset: () => {
    set({
      tribes: [],
      currentTribe: null,
      tribePosts: [],
      postsCursor: undefined,
      hasMorePosts: true,
      tribeMembers: [],
      membersCursor: undefined,
      hasMoreMembers: true,
      error: null,
    });
  },
}));




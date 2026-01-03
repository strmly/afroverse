import { create } from 'zustand';
import {
  getFeed,
  getHotFeed,
  type FeedItem,
  type FeedCursor,
} from '../services/feedService';
import {
  respectPost as respectPostService,
  unrespectPost as unrespectPostService,
} from '../services/postService';

/**
 * Feed Store (Frontend)
 * 
 * Manages feed state with infinite scroll and optimistic updates.
 */

interface FeedState {
  // Feed items
  items: FeedItem[];
  cursors: FeedCursor;
  hasMore: boolean;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Feed mode
  mode: 'personalized' | 'hot';
  
  // Actions
  setMode: (mode: 'personalized' | 'hot') => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  respectPost: (postId: string) => Promise<void>;
  unrespectPost: (postId: string) => Promise<void>;
  updatePost: (postId: string, updates: Partial<FeedItem>) => void;
  clearError: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  // Initial state
  items: [],
  cursors: {},
  hasMore: true,
  isLoading: false,
  isRefreshing: false,
  error: null,
  mode: 'personalized',
  
  // Set feed mode
  setMode: (mode: 'personalized' | 'hot') => {
    if (get().mode !== mode) {
      set({
        mode,
        items: [],
        cursors: {},
        hasMore: true,
      });
    }
  },
  
  // Load more feed items
  loadMore: async () => {
    const { isLoading, hasMore, items, cursors, mode } = get();
    
    if (isLoading || !hasMore) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = mode === 'personalized'
        ? await getFeed(10, cursors)
        : await getHotFeed(10, cursors.discover);
      
      set({
        items: [...items, ...response.items],
        cursors: response.nextCursor,
        hasMore: !!(response.nextCursor.tribe || response.nextCursor.discover),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to load feed',
        isLoading: false,
      });
    }
  },
  
  // Refresh feed (pull to refresh)
  refresh: async () => {
    const { mode } = get();
    
    set({ isRefreshing: true, error: null });
    
    try {
      const response = mode === 'personalized'
        ? await getFeed(10, {})
        : await getHotFeed(10);
      
      set({
        items: response.items,
        cursors: response.nextCursor,
        hasMore: !!(response.nextCursor.tribe || response.nextCursor.discover),
        isRefreshing: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to refresh feed',
        isRefreshing: false,
      });
    }
  },
  
  // Respect post (optimistic update)
  respectPost: async (postId: string) => {
    const { items } = get();
    
    // Optimistic update
    const updatedItems = items.map((item) => {
      if (item.postId === postId) {
        return {
          ...item,
          counts: {
            ...item.counts,
            respects: item.counts.respects + 1,
          },
          viewerState: {
            ...item.viewerState,
            hasRespected: true,
          },
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    
    try {
      await respectPostService(postId);
    } catch (error: any) {
      // Revert on error
      set({ items });
      set({
        error: error.response?.data?.message || 'Failed to respect post',
      });
    }
  },
  
  // Unrespect post (optimistic update)
  unrespectPost: async (postId: string) => {
    const { items } = get();
    
    // Optimistic update
    const updatedItems = items.map((item) => {
      if (item.postId === postId) {
        return {
          ...item,
          counts: {
            ...item.counts,
            respects: Math.max(0, item.counts.respects - 1),
          },
          viewerState: {
            ...item.viewerState,
            hasRespected: false,
          },
        };
      }
      return item;
    });
    
    set({ items: updatedItems });
    
    try {
      await unrespectPostService(postId);
    } catch (error: any) {
      // Revert on error
      set({ items });
      set({
        error: error.response?.data?.message || 'Failed to unrespect post',
      });
    }
  },
  
  // Update post (for external updates)
  updatePost: (postId: string, updates: Partial<FeedItem>) => {
    const { items } = get();
    const updatedItems = items.map((item) => {
      if (item.postId === postId) {
        return { ...item, ...updates };
      }
      return item;
    });
    set({ items: updatedItems });
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));








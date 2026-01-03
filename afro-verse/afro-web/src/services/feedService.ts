import { apiClient } from './apiClient';
import type { Post } from './postService';

/**
 * Feed Service (Frontend)
 * 
 * Handles feed retrieval with dual cursor pagination.
 */

export interface FeedCursor {
  tribe?: string;
  discover?: string;
}

export interface FeedItem extends Post {}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor: FeedCursor;
}

/**
 * Get personalized feed (tribe-first + discovery)
 */
export async function getFeed(
  limit: number = 10,
  cursors?: FeedCursor
): Promise<FeedResponse> {
  const params: any = { limit };
  
  if (cursors?.tribe) {
    params.tribeCursor = cursors.tribe;
  }
  if (cursors?.discover) {
    params.discoverCursor = cursors.discover;
  }
  
  const response = await apiClient.get('/feed', { params });
  return response.data;
}

/**
 * Get hot/trending feed
 */
export async function getHotFeed(
  limit: number = 10,
  cursor?: string
): Promise<FeedResponse> {
  const params: any = { limit };
  
  if (cursor) {
    params.cursor = cursor;
  }
  
  const response = await apiClient.get('/feed/hot', { params });
  return response.data;
}

/**
 * Infinite scroll helper
 * 
 * Manages feed pagination state and provides easy-to-use API for UI.
 */
export class FeedScroller {
  private items: FeedItem[] = [];
  private cursors: FeedCursor | undefined;
  private hasMore = true;
  private loading = false;
  
  constructor(private mode: 'personalized' | 'hot' = 'personalized') {}
  
  async loadMore(): Promise<FeedItem[]> {
    if (!this.hasMore || this.loading) {
      return [];
    }
    
    this.loading = true;
    
    try {
      const response = this.mode === 'personalized'
        ? await getFeed(10, this.cursors)
        : await getHotFeed(10, this.cursors?.discover);
      
      this.items.push(...response.items);
      this.cursors = response.nextCursor;
      this.hasMore = !!(response.nextCursor?.tribe || response.nextCursor?.discover);
      
      return response.items;
    } finally {
      this.loading = false;
    }
  }
  
  reset() {
    this.items = [];
    this.cursors = undefined;
    this.hasMore = true;
    this.loading = false;
  }
  
  getItems(): FeedItem[] {
    return this.items;
  }
  
  getHasMore(): boolean {
    return this.hasMore;
  }
  
  isLoading(): boolean {
    return this.loading;
  }
}








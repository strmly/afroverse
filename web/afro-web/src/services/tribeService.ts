import { apiClient } from './apiClient';

/**
 * Tribe Service (Frontend)
 * 
 * Handles tribe-related API calls.
 */

export interface Tribe {
  id: string;
  slug: string;
  name: string;
  motto: string;
  accentColor: string;
  iconUrl: string;
  stats: {
    members: number;
    posts: number;
  };
}

export interface TribeDetail extends Tribe {
  viewerState: {
    isMember: boolean;
  };
}

export interface TribeMember {
  id: string;
  username: string;
  displayName: string;
  avatarThumbUrl: string;
}

export interface TribePost {
  postId: string;
  thumbUrl: string;
  aspect: string;
}

/**
 * Get all tribes (for directory/onboarding)
 */
export async function getAllTribes(): Promise<Tribe[]> {
  const response = await apiClient.get('/tribes');
  return response.data.items;
}

/**
 * Get tribe by slug
 */
export async function getTribe(slug: string): Promise<TribeDetail> {
  const response = await apiClient.get(`/tribes/${slug}`);
  return response.data;
}

/**
 * Join tribe (onboarding only)
 */
export async function joinTribe(slug: string): Promise<{
  status: string;
  tribe: {
    id: string;
    slug: string;
    name: string;
  };
}> {
  const response = await apiClient.post(`/tribes/${slug}/join`);
  return response.data;
}

/**
 * Get tribe posts (grid)
 */
export async function getTribePosts(
  slug: string,
  limit: number = 12,
  cursor?: string
): Promise<{
  items: TribePost[];
  nextCursor?: string;
}> {
  const params: any = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  
  const response = await apiClient.get(`/tribes/${slug}/posts`, { params });
  return response.data;
}

/**
 * Get tribe members
 */
export async function getTribeMembers(
  slug: string,
  limit: number = 20,
  cursor?: string
): Promise<{
  items: TribeMember[];
  nextCursor?: string;
}> {
  const params: any = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  
  const response = await apiClient.get(`/tribes/${slug}/members`, { params });
  return response.data;
}

/**
 * Get tribe preview (for non-members)
 */
export async function getTribePreview(slug: string): Promise<{
  tribe: TribeDetail;
  posts: TribePost[];
  viewerState: {
    canPost: boolean;
  };
}> {
  const response = await apiClient.get(`/tribes/${slug}/preview`);
  return response.data;
}








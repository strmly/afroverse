import { apiClient } from './apiClient';

/**
 * Post Service
 * 
 * Handles post creation, deletion, and interactions
 */

export interface Post {
  id: string;
  imageUrl: string;
  thumbUrl: string;
  caption?: string;
  styleTag?: string;
  respectCount: number;
  createdAt: string;
}

export interface CreatePostInput {
  generationId: string;
  versionId: string;
  caption?: string;
  visibility: 'tribe' | 'public';
}

export interface CreatePostResponse {
  postId: string;
}

/**
 * Create a post from a generation
 */
export async function createPost(input: CreatePostInput): Promise<CreatePostResponse> {
  const response = await apiClient.post('/posts', {
    generationId: input.generationId,
    versionId: input.versionId,
    caption: input.caption,
    visibility: input.visibility,
  }, {
    headers: {
      'Idempotency-Key': `${input.generationId}-${input.versionId}-${Date.now()}`,
    },
  });
  
  return response.data;
}

/**
 * Respect a post
 */
export async function respectPost(postId: string): Promise<void> {
  await apiClient.post(`/posts/${postId}/respect`);
}

/**
 * Unrespect a post
 */
export async function unrespectPost(postId: string): Promise<void> {
  await apiClient.delete(`/posts/${postId}/respect`);
}

/**
 * Share a post
 */
export async function sharePost(postId: string): Promise<void> {
  // TODO: Implement share logic
  console.log('Share post:', postId);
}

/**
 * Get posts for a user's profile
 */
export async function getUserPosts(username: string, limit: number = 50): Promise<Post[]> {
  const response = await apiClient.get(`/users/${username}/posts`, {
    params: { limit },
  });
  return response.data.posts || [];
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}

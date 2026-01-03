import { apiClient } from './apiClient';

/**
 * Follow Service
 * 
 * Handles follow/unfollow operations and relationship queries
 */

export interface Relationship {
  isFollowing: boolean;
  isFollower: boolean;
  isSelf: boolean;
}

/**
 * Follow a user
 */
export async function followUser(targetUserId: string): Promise<void> {
  await apiClient.post('/follow', { targetUserId });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetUserId: string): Promise<void> {
  await apiClient.delete(`/follow/${targetUserId}`);
}

/**
 * Get relationship between current user and target user
 */
export async function getRelationship(userId: string): Promise<Relationship> {
  const response = await apiClient.get(`/users/${userId}/relationship`);
  return response.data;
}

/**
 * Get users that someone is following
 */
export async function getFollowing(userId: string, limit: number = 50): Promise<any[]> {
  const response = await apiClient.get(`/users/${userId}/following`, {
    params: { limit },
  });
  return response.data.users;
}

/**
 * Get users that follow someone
 */
export async function getFollowers(userId: string, limit: number = 50): Promise<any[]> {
  const response = await apiClient.get(`/users/${userId}/followers`, {
    params: { limit },
  });
  return response.data.users;
}




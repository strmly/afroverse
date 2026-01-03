import { apiClient } from './apiClient';

/**
 * Profile Service
 */

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  tribe: {
    id: string;
    slug: string;
    name: string;
  };
  avatar?: {
    imageUrl: string;
    thumbUrl: string;
  };
  counters: {
    posts: number;
    respectsReceived: number;
  };
}

export interface UsernameCheckResponse {
  available: boolean;
  error?: string;
  message?: string;
  suggestions?: string[];
}

export interface SetAvatarInput {
  generationId: string;
  versionId: string;
}

export interface SetAvatarResponse {
  status: string;
  avatar: {
    imageUrl: string;
    thumbUrl: string;
  };
}

/**
 * Update current user's profile
 */
export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const response = await apiClient.patch('/users/me', input);
  return response.data;
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<Profile> {
  const response = await apiClient.get('/users/me');
  return response.data;
}

/**
 * Get user profile by username
 */
export async function getUserProfile(username: string): Promise<Profile> {
  const response = await apiClient.get(`/users/${username}`);
  return response.data;
}

/**
 * Check if username is available
 */
export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
  const response = await apiClient.get('/users/check-username', {
    params: { username },
  });
  return response.data;
}

/**
 * Set user avatar from a generation version
 */
export async function setAvatar(input: SetAvatarInput): Promise<SetAvatarResponse> {
  const response = await apiClient.post('/users/me/avatar', {
    generationId: input.generationId,
    versionId: input.versionId,
  });
  return response.data;
}

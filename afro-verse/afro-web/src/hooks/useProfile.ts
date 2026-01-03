'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getMyProfile,
  getUserProfile,
  updateProfile,
  setAvatar,
  type Profile,
  type UpdateProfileInput,
  type SetAvatarInput,
} from '../services/profileService';
import { getUserPosts } from '../services/postService';

export const useProfile = (username?: string) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = username
        ? await getUserProfile(username)
        : await getMyProfile();
      setProfile(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const update = useCallback(async (input: UpdateProfileInput) => {
    setError(null);

    try {
      const updated = await updateProfile(input);
      setProfile(updated);
      return updated;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateAvatar = useCallback(async (input: SetAvatarInput) => {
    setError(null);

    try {
      const response = await setAvatar(input);
      
      // Refresh profile to get updated avatar
      const updated = await (username ? getUserProfile(username) : getMyProfile());
      setProfile(updated);
      
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update avatar';
      setError(message);
      throw new Error(message);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    update,
    updateAvatar,
    refresh: loadProfile,
  };
};

export const useProfilePosts = (username: string) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getUserPosts(username, 20, cursor);
      setPosts(prev => [...prev, ...response.posts]);
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [username, cursor, loading, hasMore]);

  const refresh = useCallback(() => {
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    posts,
    loading,
    hasMore,
    error,
    loadMore: loadPosts,
    refresh,
  };
};






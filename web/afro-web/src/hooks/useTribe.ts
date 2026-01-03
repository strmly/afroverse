'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getAllTribes,
  getTribe,
  joinTribe,
  getTribePosts,
  getTribeMembers,
  getTribePreview,
  type Tribe,
  type TribeDetail,
  type TribePost,
  type TribeMember,
} from '../services/tribeService';

export const useTribes = () => {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTribes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllTribes();
      setTribes(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load tribes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTribes();
  }, [loadTribes]);

  return {
    tribes,
    loading,
    error,
    refresh: loadTribes,
  };
};

export const useTribe = (slug: string) => {
  const [tribe, setTribe] = useState<TribeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTribe(slug);
      setTribe(data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load tribe';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const join = useCallback(async () => {
    setError(null);

    try {
      const response = await joinTribe(slug);
      // Refresh tribe data after joining
      await loadTribe();
      return response;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to join tribe';
      setError(message);
      throw new Error(message);
    }
  }, [slug, loadTribe]);

  useEffect(() => {
    loadTribe();
  }, [loadTribe]);

  return {
    tribe,
    loading,
    error,
    join,
    refresh: loadTribe,
  };
};

export const useTribePosts = (slug: string) => {
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getTribePosts(slug, 12, cursor);
      setPosts(prev => [...prev, ...response.items]);
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load posts';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, cursor, loading, hasMore]);

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

export const useTribeMembers = (slug: string) => {
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getTribeMembers(slug, 20, cursor);
      setMembers(prev => [...prev, ...response.items]);
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load members';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, cursor, loading, hasMore]);

  const refresh = useCallback(() => {
    setMembers([]);
    setCursor(undefined);
    setHasMore(true);
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    members,
    loading,
    hasMore,
    error,
    loadMore: loadMembers,
    refresh,
  };
};






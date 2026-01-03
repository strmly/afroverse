'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFeed, getHotFeed, type FeedItem, type FeedCursor } from '../services/feedService';

export const useFeed = (mode: 'personalized' | 'hot' = 'personalized') => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursors, setCursors] = useState<FeedCursor | undefined>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = mode === 'personalized'
        ? await getFeed(10, cursors)
        : await getHotFeed(10, cursors?.discover);

      setItems(prev => [...prev, ...response.items]);
      setCursors(response.nextCursor);
      setHasMore(!!(response.nextCursor?.tribe || response.nextCursor?.discover));
    } catch (err: any) {
      console.error('Failed to load feed:', err);
      setError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [mode, cursors, loading, hasMore]);

  const refresh = useCallback(async () => {
    setItems([]);
    setCursors(undefined);
    setHasMore(true);
    setInitialLoading(true);
    await loadMore();
  }, [loadMore]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    loading,
    initialLoading,
    hasMore,
    error,
    loadMore,
    refresh,
  };
};






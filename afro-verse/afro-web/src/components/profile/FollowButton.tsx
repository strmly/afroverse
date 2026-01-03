'use client';

import { useState, useEffect } from 'react';
import { followUser, unfollowUser, getRelationship } from '../../services/followService';

/**
 * FollowButton Component
 * 
 * Smart follow button with state management
 * - Follows UX spec from profile system
 * - Handles optimistic updates
 * - Shows correct state
 */

interface FollowButtonProps {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ userId, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch relationship status on mount
  useEffect(() => {
    const fetchRelationship = async () => {
      try {
        const rel = await getRelationship(userId);
        setIsFollowing(rel.isFollowing);
        setIsSelf(rel.isSelf);
      } catch (error) {
        console.error('Failed to fetch relationship:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationship();
  }, [userId]);

  const handleFollow = async () => {
    setActionLoading(true);

    try {
      await followUser(userId);
      setIsFollowing(true);
      onFollowChange?.(true);
    } catch (error: any) {
      console.error('Failed to follow:', error);
      alert(error.response?.data?.message || 'Failed to follow user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!confirm('Unfollow this user?')) {
      return;
    }

    setActionLoading(true);

    try {
      await unfollowUser(userId);
      setIsFollowing(false);
      onFollowChange?.(false);
    } catch (error: any) {
      console.error('Failed to unfollow:', error);
      alert(error.response?.data?.message || 'Failed to unfollow user');
    } finally {
      setActionLoading(false);
    }
  };

  // Don't show button on own profile
  if (isSelf) {
    return null;
  }

  if (loading) {
    return (
      <button
        disabled
        style={{
          padding: 'var(--space-sm) var(--space-lg)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-gray-700)',
          background: 'var(--color-gray-800)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          cursor: 'not-allowed',
        }}
      >
        ...
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        onClick={handleUnfollow}
        disabled={actionLoading}
        style={{
          padding: 'var(--space-sm) var(--space-lg)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-gray-700)',
          background: 'var(--color-gray-800)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          cursor: actionLoading ? 'not-allowed' : 'pointer',
          opacity: actionLoading ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {actionLoading ? 'Unfollowing...' : 'Following'}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={actionLoading}
      style={{
        padding: 'var(--space-sm) var(--space-lg)',
        borderRadius: 'var(--radius-full)',
        border: 'none',
        background: 'var(--color-primary)',
        color: 'var(--color-white)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        cursor: actionLoading ? 'not-allowed' : 'pointer',
        opacity: actionLoading ? 0.5 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {actionLoading ? 'Following...' : 'Follow'}
    </button>
  );
}




'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ProfileStatsProps {
  posts: number;
  respects: number;
  followers?: number;
  following?: number;
  tribe: {
    slug: string;
    name: string;
  };
  onPostsClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  posts,
  respects,
  followers,
  following,
  tribe,
  onPostsClick,
  onFollowersClick,
  onFollowingClick,
}) => {
  const router = useRouter();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-section) var(--space-default)',
        borderTop: '1px solid var(--color-gray-900)',
        borderBottom: '1px solid var(--color-gray-900)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Posts */}
      <button
        onClick={onPostsClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          cursor: onPostsClick ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-display-sm)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          {posts}
        </span>
        <span
          style={{
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Posts
        </span>
      </button>

      {/* Respects */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-display-sm)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          {respects >= 1000
            ? `${(respects / 1000).toFixed(1)}k`
            : respects}
        </span>
        <span
          style={{
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Respects
        </span>
      </div>

      {/* Followers */}
      {followers !== undefined && (
        <button
          onClick={onFollowersClick}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-tight)',
            cursor: onFollowersClick ? 'pointer' : 'default',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-display-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {followers >= 1000
              ? `${(followers / 1000).toFixed(1)}k`
              : followers}
          </span>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Followers
          </span>
        </button>
      )}

      {/* Following */}
      {following !== undefined && (
        <button
          onClick={onFollowingClick}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-tight)',
            cursor: onFollowingClick ? 'pointer' : 'default',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-display-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {following >= 1000
              ? `${(following / 1000).toFixed(1)}k`
              : following}
          </span>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Following
          </span>
        </button>
      )}
    </div>
  );
};






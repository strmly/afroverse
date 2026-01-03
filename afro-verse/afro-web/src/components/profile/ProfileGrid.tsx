'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface Post {
  id: string;
  imageUrl: string;
  respectCount: number;
}

interface ProfileGridProps {
  posts: Post[];
  onPostClick: (postId: string, index: number) => void;
  onCreateClick?: () => void;
  isEmpty?: boolean;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  posts,
  onPostClick,
  onCreateClick,
  isEmpty = false,
}) => {
  if (isEmpty) {
    return (
      <div
        style={{
          padding: 'var(--space-ritual) var(--space-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        {/* Empty canvas illustration (subtle) */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-gray-900)',
            border: '2px dashed var(--color-gray-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-section)',
          }}
        >
          <Icon type="sparkle" size={48} style={{ color: 'var(--color-gray-700)' }} />
        </div>

        {/* Copy */}
        <h3
          style={{
            fontSize: 'var(--text-display-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--space-small)',
            textAlign: 'center',
          }}
        >
          Your journey starts here
        </h3>
        
        <p
          style={{
            fontSize: 'var(--text-body-md)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-large)',
            textAlign: 'center',
            lineHeight: 'var(--line-relaxed)',
            maxWidth: '300px',
          }}
        >
          Create your first transformation
        </p>

        {/* CTA */}
        <button
          onClick={onCreateClick}
          style={{
            padding: 'var(--space-default) var(--space-large)',
            borderRadius: 'var(--radius-full)',
            background: '#FFFFFF',
            color: '#0A0A0A',
            border: 'none',
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
            transition: 'all var(--transition-micro)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-small)',
          }}
        >
          <Icon type="sparkle" size={18} />
          Create
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px', // Minimal gutter for ultra-modern look
        background: 'var(--color-gray-900)', // Gap color
      }}
    >
      {posts.map((post, index) => (
        <button
          key={post.id}
          onClick={() => onPostClick(post.id, index)}
          style={{
            position: 'relative',
            aspectRatio: '3/4',
            background: `url(${post.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: 'pointer',
            border: 'none',
            padding: 0,
            transition: 'opacity var(--transition-micro)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {/* Optional: Tiny respect count overlay (minimal) */}
          {post.respectCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--space-small)',
                right: 'var(--space-small)',
                padding: 'var(--space-tight) var(--space-small)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(10, 10, 10, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-tight)',
                fontSize: 'var(--text-meta)',
                color: 'var(--color-off-white)',
                fontWeight: 'var(--weight-semibold)',
              }}
            >
              <Icon type="heart" size={10} />
              {post.respectCount >= 1000
                ? `${(post.respectCount / 1000).toFixed(1)}k`
                : post.respectCount}
            </div>
          )}
        </button>
      ))}
    </div>
  );
};






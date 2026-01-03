'use client';

import React, { useRef } from 'react';

interface FeaturedPost {
  id: string;
  imageUrl: string;
  username: string;
}

interface TribeFeaturedStripProps {
  posts: FeaturedPost[];
  onPostClick: (postId: string) => void;
  tribeBadge: string;
}

export const TribeFeaturedStrip: React.FC<TribeFeaturedStripProps> = ({
  posts,
  onPostClick,
  tribeBadge,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (posts.length === 0) return null;

  return (
    <div
      style={{
        padding: 'var(--space-section) 0',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-gray-900)',
      }}
    >
      {/* Section Header */}
      <div
        style={{
          padding: '0 var(--space-default) var(--space-default)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Featured
        </h2>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 'var(--space-small)',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '0 var(--space-default)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onWheel={(e) => {
          if (scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY;
          }
        }}
      >
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => onPostClick(post.id)}
            style={{
              position: 'relative',
              width: '200px',
              height: '280px',
              flexShrink: 0,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              background: `url(${post.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              cursor: 'pointer',
              transition: 'transform var(--transition-micro)',
              border: 'none',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {/* Minimal overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'var(--space-default)',
                background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-small)',
              }}
            >
              <span style={{ fontSize: 'var(--text-body-sm)' }}>{tribeBadge}</span>
              <span
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-off-white)',
                }}
              >
                @{post.username}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Hide scrollbar */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};








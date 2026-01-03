'use client';

import React from 'react';

interface PostViewerIdentityProps {
  username: string;
  displayName: string;
  caption?: string;
  styleTags?: string[];
  isVisible: boolean;
  onUserTap?: () => void;
}

export const PostViewerIdentity: React.FC<PostViewerIdentityProps> = ({
  username,
  displayName,
  caption,
  styleTags,
  isVisible,
  onUserTap,
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onUserTap?.();
      }}
      className="safe-bottom"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 'var(--space-default)',
        background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--space-tight)',
        opacity: isVisible ? 1 : 0.6,
        transition: 'opacity var(--transition-micro)',
        cursor: 'pointer',
        border: 'none',
        textAlign: 'left',
      }}
    >
      {/* Username */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-small)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-off-white)',
          }}
        >
          @{username}
        </span>
      </div>

      {/* Caption (1 line max) */}
      {caption && (
        <p
          style={{
            fontSize: 'var(--text-body-sm)',
            color: 'var(--color-off-white)',
            lineHeight: 'var(--line-relaxed)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '70%',
          }}
        >
          {caption}
        </p>
      )}

      {/* Style Tags */}
      {styleTags && styleTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-tight)',
            flexWrap: 'wrap',
          }}
        >
          {styleTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                fontSize: 'var(--text-meta)',
                color: 'var(--color-text-tertiary)',
                padding: 'var(--space-tight) var(--space-small)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(248, 248, 248, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
};








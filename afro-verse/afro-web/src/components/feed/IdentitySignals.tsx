'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface IdentitySignalsProps {
  tribe: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  creator: {
    username: string;
    displayName: string;
  };
  caption?: string;
  styleTags: string[];
  context?: 'tribe' | 'trending' | 'discovering';
}

export const IdentitySignals: React.FC<IdentitySignalsProps> = ({
  tribe,
  creator,
  caption,
  styleTags,
  context,
}) => {
  const router = useRouter();

  return (
    <>
      {/* Tribe Badge - Top Left */}
      <button
        onClick={() => router.push(`/tribe/${tribe.slug}`)}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + var(--space-default))',
          left: 'var(--space-default)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-small)',
          padding: 'var(--space-small) var(--space-default)',
          borderRadius: 'var(--radius-full)',
          background: `${tribe.color}20`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${tribe.color}40`,
          boxShadow: `0 0 20px ${tribe.color}30`,
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
          zIndex: 'var(--z-elevated)',
        }}
      >
        <span style={{ fontSize: 'var(--text-body-md)' }}>{tribe.icon}</span>
        <span
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: tribe.color,
          }}
        >
          {tribe.name}
        </span>
      </button>

      {/* Context Label (occasional) */}
      {context && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 0px) + 64px)',
            left: 'var(--space-default)',
            padding: 'var(--space-tight) var(--space-small)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(248, 248, 248, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            fontSize: 'var(--text-meta)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-secondary)',
            textTransform: 'capitalize',
            zIndex: 'var(--z-elevated)',
          }}
        >
          {context === 'tribe' && 'From your tribe'}
          {context === 'trending' && 'Trending'}
          {context === 'discovering' && 'Discovering'}
        </div>
      )}

      {/* User Identity Stack - Bottom Left */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(var(--nav-height-mobile) + var(--space-section) + env(safe-area-inset-bottom, 0px))',
          left: 'var(--space-section)',
          maxWidth: 'calc(100% - 140px)', // Leave space for action rail
          zIndex: 'var(--z-elevated)',
        }}
      >
        {/* Username */}
        <p
          style={{
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-off-white)',
            marginBottom: 'var(--space-tight)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {creator.displayName}
        </p>

        {/* Caption (optional, 1 line max) */}
        {caption && (
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-off-white)',
              marginBottom: 'var(--space-small)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.9,
            }}
          >
            {caption}
          </p>
        )}

        {/* Style Tags */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-small)',
            flexWrap: 'wrap',
          }}
        >
          {styleTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                padding: 'var(--space-tight) var(--space-small)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(248, 248, 248, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                fontSize: 'var(--text-meta)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-off-white)',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
};


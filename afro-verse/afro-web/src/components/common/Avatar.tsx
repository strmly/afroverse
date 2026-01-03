'use client';

import React from 'react';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tribeBadge?: {
    color: string;
    icon?: string;
  };
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  tribeBadge,
  onClick,
}) => {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 120,
  };

  const badgeSizeMap = {
    sm: 12,
    md: 20,
    lg: 28,
    xl: 40,
  };

  const pixelSize = sizeMap[size];
  const badgeSize = badgeSizeMap[size];

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Avatar Image */}
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size === 'xl' ? 'var(--radius-xl)' : 'var(--radius-full)',
            objectFit: 'cover',
            border: '2px solid var(--color-border)',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: size === 'xl' ? 'var(--radius-xl)' : 'var(--radius-full)',
            background: 'var(--color-gray-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            fontSize: size === 'sm' ? 'var(--text-sm)' : 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            border: '2px solid var(--color-border)',
          }}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Tribe Badge */}
      {tribeBadge && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            borderRadius: 'var(--radius-full)',
            background: tribeBadge.color,
            border: `2px solid var(--color-surface)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px',
            boxShadow: `0 2px 8px ${tribeBadge.color}60`,
          }}
        >
          {tribeBadge.icon || '⬢'}
        </div>
      )}
    </div>
  );
};








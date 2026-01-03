'use client';

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-sm)',
  className = '',
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-gray-900) 0%, var(--color-gray-800) 50%, var(--color-gray-900) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear',
      }}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div style={{
      padding: 'var(--space-lg)',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--color-gray-900)',
    }}>
      <Skeleton height={200} borderRadius="var(--radius-md)" />
      <div style={{ marginTop: 'var(--space-md)' }}>
        <Skeleton height={20} width="60%" />
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
};








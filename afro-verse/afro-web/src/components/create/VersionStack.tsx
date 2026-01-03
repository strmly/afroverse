'use client';

import React from 'react';

interface Version {
  id: string;
  imageUrl: string;
  label: string;
}

interface VersionStackProps {
  versions: Version[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export const VersionStack: React.FC<VersionStackProps> = ({
  versions,
  activeIndex,
  onChange,
}) => {
  if (versions.length <= 1) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--space-default)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 'var(--space-small)',
        padding: 'var(--space-small) var(--space-default)',
        background: 'rgba(10, 10, 10, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-gray-800)',
      }}
    >
      {versions.map((version, index) => (
        <button
          key={version.id}
          onClick={() => onChange(index)}
          style={{
            padding: 'var(--space-tight) var(--space-small)',
            borderRadius: 'var(--radius-full)',
            background: index === activeIndex 
              ? 'var(--color-off-white)' 
              : 'transparent',
            color: index === activeIndex 
              ? 'var(--color-near-black)' 
              : 'var(--color-text-secondary)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
            transition: 'all var(--transition-micro)',
            border: 'none',
            minWidth: '32px',
          }}
        >
          V{index + 1}
        </button>
      ))}
    </div>
  );
};








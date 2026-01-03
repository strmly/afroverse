'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface FloatingPostCTAProps {
  accentColor: string;
  onClick: () => void;
  tribeName: string;
}

export const FloatingPostCTA: React.FC<FloatingPostCTAProps> = ({
  accentColor,
  onClick,
  tribeName,
}) => {
  return (
    <button
      onClick={onClick}
      className="safe-bottom"
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height-mobile) + var(--space-default))',
        right: 'var(--space-default)',
        padding: 'var(--space-default) var(--space-large)',
        borderRadius: 'var(--radius-full)',
        background: accentColor,
        color: 'var(--color-near-black)',
        fontSize: 'var(--text-body-md)',
        fontWeight: 'var(--weight-semibold)',
        cursor: 'pointer',
        transition: 'all var(--transition-micro)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-small)',
        boxShadow: `var(--shadow-lg), 0 0 24px ${accentColor}40`,
        zIndex: 'var(--z-floating)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
        e.currentTarget.style.boxShadow = `var(--shadow-xl), 0 0 32px ${accentColor}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 24px ${accentColor}40`;
      }}
    >
      <Icon type="sparkle" size={18} />
      Post to Tribe
    </button>
  );
};








'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface TribeActionBarProps {
  accentColor: string;
  onInviteClick: () => void;
  onPostClick: () => void;
  onRulesClick?: () => void;
}

export const TribeActionBar: React.FC<TribeActionBarProps> = ({
  accentColor,
  onInviteClick,
  onPostClick,
  onRulesClick,
}) => {
  return (
    <div
      style={{
        padding: 'var(--space-default)',
        display: 'flex',
        gap: 'var(--space-small)',
        borderBottom: '1px solid var(--color-gray-900)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Post to Tribe (Primary) */}
      <button
        onClick={onPostClick}
        style={{
          flex: 1,
          padding: 'var(--space-default)',
          borderRadius: 'var(--radius-full)',
          background: accentColor,
          color: 'var(--color-near-black)',
          fontSize: 'var(--text-body-md)',
          fontWeight: 'var(--weight-semibold)',
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-small)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Icon type="sparkle" size={18} />
        Post to Tribe
      </button>

      {/* Invite (Secondary) */}
      <button
        onClick={onInviteClick}
        style={{
          width: 'var(--tap-target-min)',
          height: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-gray-800)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
        }}
      >
        <Icon type="share" size={18} />
      </button>

      {/* Rules (Optional) */}
      {onRulesClick && (
        <button
          onClick={onRulesClick}
          style={{
            width: 'var(--tap-target-min)',
            height: 'var(--tap-target-min)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-gray-800)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="more" size={18} />
        </button>
      )}
    </div>
  );
};








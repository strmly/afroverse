'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface ActionPillProps {
  onPost: () => void;
  onSetAsProfile: () => void;
  onShare: () => void;
  show: boolean;
}

export const ActionPill: React.FC<ActionPillProps> = ({
  onPost,
  onSetAsProfile,
  onShare,
  show,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height-mobile) + 130px)',
        left: '0',
        right: '0',
        display: 'flex',
        gap: 'var(--space-default)',
        zIndex: 600,
        animation: 'slideUp 0.3s ease-out',
        maxWidth: 'calc(var(--max-width-content) - var(--space-section) * 2)',
        margin: '0 auto',
        padding: '0 var(--space-section)',
      }}
    >
      {/* Primary: Post */}
      <button
        onClick={onPost}
        style={{
          flex: 1,
          padding: 'var(--space-default) var(--space-section)',
          minHeight: '52px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-off-white)',
          color: 'var(--color-near-black)',
          fontSize: 'var(--text-body-md)',
          fontWeight: 'var(--weight-semibold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-small)',
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        Post
      </button>

      {/* Secondary: Set as Profile */}
      <button
        onClick={onSetAsProfile}
        style={{
          flex: 1,
          padding: 'var(--space-default) var(--space-section)',
          minHeight: '52px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(248, 248, 248, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--color-gray-700)',
          color: 'var(--color-off-white)',
          fontSize: 'var(--text-body-md)',
          fontWeight: 'var(--weight-semibold)',
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
        }}
      >
        Set as Profile
      </button>

      {/* Icon: Share */}
      <button
        onClick={onShare}
        style={{
          width: '52px',
          height: '52px',
          minWidth: '52px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(248, 248, 248, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--color-gray-700)',
          color: 'var(--color-off-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-micro)',
        }}
      >
        <Icon type="share" size={20} />
      </button>
    </div>
  );
};


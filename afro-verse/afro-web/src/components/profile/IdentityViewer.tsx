'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface IdentityViewerProps {
  isOpen: boolean;
  imageUrl: string;
  tribe: {
    name: string;
    color: string;
    icon: string;
  };
  isSelf: boolean;
  onClose: () => void;
  onSetAsProfile?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export const IdentityViewer: React.FC<IdentityViewerProps> = ({
  isOpen,
  imageUrl,
  tribe,
  isSelf,
  onClose,
  onSetAsProfile,
  onShare,
  onDownload,
}) => {
  const [touchStart, setTouchStart] = React.useState(0);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchEnd - touchStart;
    
    // Swipe down to close
    if (distance > 100) {
      onClose();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-near-black)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Sacred minimal UI */}
      
      {/* Tribe Badge - Top Left */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + var(--space-default))',
          left: 'var(--space-default)',
          padding: 'var(--space-small) var(--space-default)',
          borderRadius: 'var(--radius-full)',
          background: `${tribe.color}20`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${tribe.color}40`,
          boxShadow: `0 0 20px ${tribe.color}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-small)',
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
      </div>

      {/* Close Button - Top Right */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + var(--space-default))',
          right: 'var(--space-default)',
          width: 'var(--tap-target-min)',
          height: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-off-white)',
          cursor: 'pointer',
          zIndex: 'var(--z-elevated)',
        }}
      >
        <Icon type="close" size={20} />
      </button>

      {/* Full-Screen Identity Image */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-default)',
        }}
      >
        <img
          src={imageUrl}
          alt="Identity"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 'var(--radius-subtle)',
          }}
        />
      </div>

      {/* Actions (Self Only) */}
      {isSelf && (
        <div
          className="safe-bottom"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'var(--space-default)',
            display: 'flex',
            gap: 'var(--space-small)',
            background: 'linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 100%)',
            zIndex: 'var(--z-elevated)',
          }}
        >
          {onSetAsProfile && (
            <button
              onClick={onSetAsProfile}
              style={{
                flex: 1,
                padding: 'var(--space-default)',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-off-white)',
                color: 'var(--color-near-black)',
                fontSize: 'var(--text-body-md)',
                fontWeight: 'var(--weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Set as Profile
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              style={{
                width: 'var(--tap-target-min)',
                height: 'var(--tap-target-min)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(248, 248, 248, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'var(--color-off-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon type="share" size={20} />
            </button>
          )}

          {onDownload && (
            <button
              onClick={onDownload}
              style={{
                width: 'var(--tap-target-min)',
                height: 'var(--tap-target-min)',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(248, 248, 248, 0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'var(--color-off-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon type="sparkle" size={20} />
            </button>
          )}
        </div>
      )}

      {/* Swipe hint (subtle) */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 64px)',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'var(--text-meta)',
          color: 'var(--color-text-tertiary)',
          opacity: 0.5,
        }}
      >
        Swipe down to close
      </div>
    </div>
  );
};








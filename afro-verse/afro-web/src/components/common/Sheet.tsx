'use client';

import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: 'full' | 'half' | 'auto';
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoint = 'auto',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const heights = {
    full: '100vh',
    half: '50vh',
    auto: 'auto',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 'var(--z-modal)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: heights[snapPoint],
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--color-border)',
          borderBottom: 'none',
          animation: 'slideUp 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle */}
        <div
          style={{
            padding: 'var(--space-md) 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gray-700)',
            }}
          />
        </div>

        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 var(--space-lg) var(--space-md)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-white)',
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Icon type="close" size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-lg)',
            paddingBottom: 'calc(var(--space-lg) + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};








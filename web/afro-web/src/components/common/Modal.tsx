'use client';

import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        zIndex: 'var(--z-modal)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          animation: 'scaleIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-lg)',
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
                transition: 'all var(--transition-fast)',
              }}
            >
              <Icon type="close" size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: 'var(--space-lg)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};








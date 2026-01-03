'use client';

import React from 'react';
import { Button } from '../common/Button';

interface ActionTrayProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: () => void;
  onRefine: () => void;
  onSaveToGallery: () => void;
  onUseAsBaseStyle: () => void;
  imageUrl: string;
}

export const ActionTray: React.FC<ActionTrayProps> = ({
  isOpen,
  onClose,
  onPost,
  onRefine,
  onSaveToGallery,
  onUseAsBaseStyle,
  imageUrl,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-out',
        }}
      />

      {/* Tray */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          padding: 'var(--space-large) var(--space-section) calc(var(--space-section) + env(safe-area-inset-bottom))',
          zIndex: 9999,
          animation: 'slideUp 0.4s var(--ease-smooth)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderBottom: 'none',
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            margin: '0 auto var(--space-large)',
          }}
        />

        {/* Thumbnail Preview */}
        <div
          style={{
            width: '80px',
            height: '100px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            margin: '0 auto var(--space-large)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          <img
            src={imageUrl}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-default)',
            maxWidth: '400px',
            margin: '0 auto',
          }}
        >
          {/* Primary: Post to Heritage Feed */}
          <Button
            onClick={onPost}
            variant="primary"
            style={{
              width: '100%',
              padding: 'var(--space-default) var(--space-large)',
              background: 'var(--color-gold)',
              color: 'var(--color-black)',
              fontWeight: 'var(--weight-bold)',
            }}
          >
            <span style={{ fontSize: '20px', marginRight: '8px' }}>✨</span>
            Share your transformation
          </Button>

          {/* Secondary Actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-default)',
            }}
          >
            <Button
              onClick={onRefine}
              variant="secondary"
              style={{
                padding: 'var(--space-default)',
                fontSize: 'var(--text-body-sm)',
              }}
            >
              Refine This Look
            </Button>
            
            <Button
              onClick={onUseAsBaseStyle}
              variant="secondary"
              style={{
                padding: 'var(--space-default)',
                fontSize: 'var(--text-body-sm)',
              }}
            >
              Use as Base Style
            </Button>
          </div>

          {/* Tertiary: Save */}
          <button
            onClick={onSaveToGallery}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--text-body-sm)',
              padding: 'var(--space-default)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Save to Gallery
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};






'use client';

import React from 'react';
import { Button } from '../common/Button';

interface GenerationErrorProps {
  show: boolean;
  onRetry: () => void;
  onEditPrompt: () => void;
  onDismiss: () => void;
}

export const GenerationError: React.FC<GenerationErrorProps> = ({
  show,
  onRetry,
  onEditPrompt,
  onDismiss,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9999,
        padding: 'var(--space-section)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: 'var(--color-gray-900)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-section)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-large)',
          textAlign: 'center',
          border: '1px solid var(--color-gray-800)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '60px',
            height: '60px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255, 193, 7, 0.1)',
          }}
        >
          <span style={{ fontSize: '32px' }}>✨</span>
        </div>

        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-default)' }}>
          <h3
            style={{
              fontSize: 'var(--text-display-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-off-white)',
              margin: 0,
            }}
          >
            We didn't like how this one turned out
          </h3>
          <p
            style={{
              fontSize: 'var(--text-body-md)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-relaxed)',
              margin: 0,
            }}
          >
            Let us remake it properly. Your transformation deserves perfection.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-default)',
          }}
        >
          <Button
            onClick={onRetry}
            variant="primary"
            style={{
              width: '100%',
              padding: 'var(--space-default)',
            }}
          >
            Retry Transformation
          </Button>
          <Button
            onClick={onEditPrompt}
            variant="secondary"
            style={{
              width: '100%',
              padding: 'var(--space-default)',
            }}
          >
            Edit Prompt
          </Button>
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--text-body-sm)',
              cursor: 'pointer',
              padding: 'var(--space-small)',
            }}
          >
            Dismiss
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
      `}</style>
    </div>
  );
};






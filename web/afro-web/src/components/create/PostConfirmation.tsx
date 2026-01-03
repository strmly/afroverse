'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';

interface PostConfirmationProps {
  show: boolean;
  postId: string;
  onViewInFeed: () => void;
  onCreateAnother: () => void;
}

export const PostConfirmation: React.FC<PostConfirmationProps> = ({
  show,
  postId,
  onViewInFeed,
  onCreateAnother,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height-mobile) + var(--space-section))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10002,
        animation: 'slideUpBounce 0.5s var(--ease-smooth)',
        width: 'calc(100% - var(--space-section) * 2)',
        maxWidth: '400px',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-default) var(--space-large)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
        }}
      >
        {/* Checkmark Animation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-default)',
            marginBottom: 'var(--space-default)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'scaleIn 0.3s var(--ease-smooth)',
            }}
          >
            <span style={{ fontSize: '18px' }}>✓</span>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--text-body-md)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-off-white)',
                margin: 0,
              }}
            >
              Added to the Heritage Feed
            </p>
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-tertiary)',
                margin: '2px 0 0 0',
              }}
            >
              Your transformation is now live
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-small)',
          }}
        >
          <Button
            onClick={onViewInFeed}
            variant="secondary"
            size="sm"
            style={{
              flex: 1,
              fontSize: 'var(--text-body-sm)',
            }}
          >
            View in Feed
          </Button>
          <Button
            onClick={onCreateAnother}
            variant="primary"
            size="sm"
            style={{
              flex: 1,
              background: 'var(--color-gold)',
              color: 'var(--color-black)',
              fontSize: 'var(--text-body-sm)',
            }}
          >
            Create Another
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUpBounce {
          0% {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          60% {
            transform: translate(-50%, -5px);
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};






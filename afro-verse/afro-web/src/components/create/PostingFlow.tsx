'use client';

import React, { useState } from 'react';
import { Button } from '../common/Button';

interface PostingFlowProps {
  isOpen: boolean;
  imageUrl: string;
  generationId: string;
  versionId: string;
  onPost: (caption: string, visibility: 'tribe' | 'public') => void;
  onCancel: () => void;
}

export const PostingFlow: React.FC<PostingFlowProps> = ({
  isOpen,
  imageUrl,
  generationId,
  versionId,
  onPost,
  onCancel,
}) => {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<'tribe' | 'public'>('tribe');
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    setIsPosting(true);
    await onPost(caption, visibility);
    setIsPosting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-surface)',
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s var(--ease-smooth)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-default) var(--space-section)',
          borderBottom: '1px solid var(--color-gray-800)',
        }}
      >
        <button
          onClick={onCancel}
          disabled={isPosting}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-body-md)',
            cursor: 'pointer',
            padding: 'var(--space-small)',
          }}
        >
          Cancel
        </button>

        <h2
          style={{
            fontSize: 'var(--text-body-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Share Your Transformation
        </h2>

        <Button
          onClick={handlePost}
          disabled={isPosting}
          variant="primary"
          size="sm"
          style={{
            background: 'var(--color-gold)',
            color: 'var(--color-black)',
          }}
        >
          {isPosting ? 'Posting...' : 'Post'}
        </Button>
      </header>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-section)',
        }}
      >
        {/* Image Preview */}
        <div
          style={{
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto var(--space-large)',
            aspectRatio: '3/4',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
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

        {/* Caption Field */}
        <div
          style={{
            marginBottom: 'var(--space-large)',
          }}
        >
          <label
            htmlFor="caption"
            style={{
              display: 'block',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-small)',
            }}
          >
            Caption (optional)
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe your transformation..."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: 'var(--space-default)',
              background: 'var(--color-gray-900)',
              border: '1px solid var(--color-gray-800)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-body-md)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
          <div
            style={{
              textAlign: 'right',
              fontSize: 'var(--text-body-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--space-small)',
            }}
          >
            {caption.length}/500
          </div>
        </div>

        {/* Visibility Selector */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-default)',
            }}
          >
            Visibility
          </label>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-default)',
            }}
          >
            <button
              onClick={() => setVisibility('tribe')}
              style={{
                flex: 1,
                padding: 'var(--space-default)',
                background: visibility === 'tribe' ? 'var(--color-gray-800)' : 'transparent',
                border: `1px solid ${visibility === 'tribe' ? 'var(--color-gold)' : 'var(--color-gray-800)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--text-body-md)',
              }}
            >
              <div style={{ marginBottom: '4px', fontSize: '20px' }}>🏛️</div>
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>Tribe Only</div>
              <div
                style={{
                  fontSize: 'var(--text-body-xs)',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                Visible to your tribe
              </div>
            </button>

            <button
              onClick={() => setVisibility('public')}
              style={{
                flex: 1,
                padding: 'var(--space-default)',
                background: visibility === 'public' ? 'var(--color-gray-800)' : 'transparent',
                border: `1px solid ${visibility === 'public' ? 'var(--color-gold)' : 'var(--color-gray-800)'}`,
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                fontSize: 'var(--text-body-md)',
              }}
            >
              <div style={{ marginBottom: '4px', fontSize: '20px' }}>🌍</div>
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>Public</div>
              <div
                style={{
                  fontSize: 'var(--text-body-xs)',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                Everyone can see
              </div>
            </button>
          </div>
        </div>

        {/* Info Note */}
        <div
          style={{
            marginTop: 'var(--space-large)',
            padding: 'var(--space-default)',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.2)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 'var(--line-relaxed)',
            }}
          >
            💡 Your transformation can be remixed by others as a base style, helping build our collective visual heritage.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};






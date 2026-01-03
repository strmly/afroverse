'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove?: () => void;
  hasSelfies: boolean;
}

export const UploadSheet: React.FC<UploadSheetProps> = ({
  isOpen,
  onClose,
  onCamera,
  onLibrary,
  onRemove,
  hasSelfies,
}) => {
  if (!isOpen) return null;

  const options: Array<{
    label: string;
    icon: 'camera' | 'photo' | 'close';
    onClick: () => void;
  }> = [
    {
      label: 'Take Photo',
      icon: 'camera',
      onClick: onCamera,
    },
    {
      label: 'Choose from Library',
      icon: 'photo',
      onClick: onLibrary,
    },
  ];

  if (hasSelfies && onRemove) {
    options.push({
      label: 'Remove Photo',
      icon: 'close',
      onClick: onRemove,
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 'var(--z-modal)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--color-gray-800)',
          borderBottom: 'none',
          zIndex: 'var(--z-modal)',
          animation: 'slideUp 0.3s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div
          onClick={onClose}
          style={{
            padding: 'var(--space-default) 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
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

        {/* Options */}
        <div
          style={{
            padding: '0 var(--space-default) var(--space-default)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--text-body-lg)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-default)',
            }}
          >
            Add Selfie
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-small)',
            }}
          >
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-default)',
                  padding: 'var(--space-default)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-gray-800)',
                  border: '1px solid var(--color-gray-700)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                  textAlign: 'left',
                }}
              >
                <Icon type={option.icon} size={20} />
                {option.label}
              </button>
            ))}
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: 'var(--space-default)',
              marginTop: 'var(--space-default)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-body-md)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};




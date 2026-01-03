'use client';

import React, { useState } from 'react';
import { Icon } from '../common/Icon';

interface EditProfileSheetProps {
  isOpen: boolean;
  displayName: string;
  bio: string;
  onClose: () => void;
  onSave: (displayName: string, bio: string) => void;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  isOpen,
  displayName: initialDisplayName,
  bio: initialBio,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(displayName, bio);
    onClose();
  };

  const hasChanges = 
    displayName !== initialDisplayName || 
    bio !== initialBio;

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
          maxHeight: '80vh',
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--color-gray-800)',
          borderBottom: 'none',
          zIndex: 'var(--z-modal)',
          animation: 'slideUp 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
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

        {/* Header */}
        <div
          style={{
            padding: '0 var(--space-default) var(--space-default)',
            borderBottom: '1px solid var(--color-gray-800)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-display-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Edit Profile
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
        </div>

        {/* Form */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-default)',
          }}
        >
          {/* Display Name */}
          <div style={{ marginBottom: 'var(--space-section)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-small)',
              }}
            >
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={30}
              style={{
                width: '100%',
                padding: 'var(--space-default)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-gray-900)',
                border: '1px solid var(--color-gray-800)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-body-md)',
                outline: 'none',
              }}
            />
            <p
              style={{
                fontSize: 'var(--text-meta)',
                color: 'var(--color-text-tertiary)',
                marginTop: 'var(--space-tight)',
              }}
            >
              {displayName.length}/30
            </p>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 'var(--space-section)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-small)',
              }}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your story in one line"
              maxLength={80}
              rows={2}
              style={{
                width: '100%',
                padding: 'var(--space-default)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-gray-900)',
                border: '1px solid var(--color-gray-800)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-body-md)',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <p
              style={{
                fontSize: 'var(--text-meta)',
                color: 'var(--color-text-tertiary)',
                marginTop: 'var(--space-tight)',
              }}
            >
              {bio.length}/80
            </p>
          </div>

          {/* Note about avatar */}
          <div
            style={{
              padding: 'var(--space-default)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-gray-900)',
              border: '1px solid var(--color-gray-800)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-relaxed)',
              }}
            >
              <strong style={{ color: 'var(--color-text-primary)' }}>
                Your avatar
              </strong>{' '}
              is set through Create. Generate a new transformation and tap "Set as Profile" to update it.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div
          style={{
            padding: 'var(--space-default)',
            borderTop: '1px solid var(--color-gray-800)',
          }}
        >
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              width: '100%',
              padding: 'var(--space-default)',
              borderRadius: 'var(--radius-full)',
              background: hasChanges 
                ? 'var(--color-off-white)' 
                : 'var(--color-gray-800)',
              color: hasChanges 
                ? 'var(--color-near-black)' 
                : 'var(--color-text-tertiary)',
              fontSize: 'var(--text-body-md)',
              fontWeight: 'var(--weight-semibold)',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-micro)',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
};








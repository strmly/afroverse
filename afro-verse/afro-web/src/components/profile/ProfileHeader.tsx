'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../common/Icon';

interface ProfileHeaderProps {
  avatar: string;
  displayName: string;
  username: string;
  bio?: string;
  tribe: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  isSelf: boolean;
  isFollowing?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onCreate?: () => void;
  onFollow?: () => void;
  onLogout?: () => void;
  onAvatarTap?: () => void;
  onAvatarLongPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  avatar,
  displayName,
  username,
  bio,
  tribe,
  isSelf,
  isFollowing = false,
  onEdit,
  onShare,
  onCreate,
  onFollow,
  onLogout,
  onAvatarTap,
  onAvatarLongPress,
}) => {
  const router = useRouter();
  const longPressTimer = React.useRef<NodeJS.Timeout>();
  const [imageError, setImageError] = React.useState(false);

  const handleAvatarTouchStart = () => {
    if (!isSelf) return;
    
    longPressTimer.current = setTimeout(() => {
      onAvatarLongPress?.();
    }, 500);
  };

  const handleAvatarTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleAvatarClick = () => {
    onAvatarTap?.();
  };

  // Debug: Log avatar URL and reset error state
  React.useEffect(() => {
    console.log('ProfileHeader Avatar URL:', avatar);
    setImageError(false);
  }, [avatar]);

  return (
    <header
      style={{
        paddingTop: 'calc(var(--space-section) + env(safe-area-inset-top, 0px))',
        paddingLeft: 'var(--space-default)',
        paddingRight: 'var(--space-default)',
        paddingBottom: 'var(--space-default)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-default)',
        }}
      >
        {/* Avatar with Tribe Badge */}
        <button
          onClick={handleAvatarClick}
          onTouchStart={handleAvatarTouchStart}
          onTouchEnd={handleAvatarTouchEnd}
          style={{
            position: 'relative',
            width: '120px',
            height: '120px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            border: '3px solid var(--color-gray-800)',
            cursor: 'pointer',
            transition: 'transform var(--transition-micro)',
            background: 'var(--color-gray-800)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {avatar && !imageError ? (
            <img
              src={avatar}
              alt={displayName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => {
                console.log('Image failed to load:', avatar);
                setImageError(true);
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Tribe Badge Overlay */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tribe/${tribe.slug}`);
            }}
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              background: tribe.color,
              border: '3px solid var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-body-md)',
              boxShadow: `0 2px 12px ${tribe.color}60`,
              cursor: 'pointer',
            }}
          >
            {tribe.icon}
          </button>
        </button>

        {/* Name Block */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontSize: 'var(--text-display-sm)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-tight)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </h1>
          
          <p
            style={{
              fontSize: 'var(--text-body-md)',
              color: 'var(--color-text-secondary)',
              marginBottom: bio ? 'var(--space-small)' : 0,
            }}
          >
            @{username}
          </p>

          {/* Bio (optional, 1 line) */}
          {bio && (
            <p
              style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-relaxed)',
                maxWidth: '300px',
                margin: '0 auto',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {bio}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-small)',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {isSelf ? (
            /* Self Profile Actions */
            <>
              <button
                onClick={onCreate}
                style={{
                  flex: 1,
                  padding: 'var(--space-default)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-off-white)',
                  color: 'var(--color-near-black)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-small)',
                }}
              >
                <Icon type="sparkle" size={18} />
                Create
              </button>

              <button
                onClick={onShare}
                style={{
                  width: 'var(--tap-target-min)',
                  height: 'var(--tap-target-min)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-gray-800)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                }}
              >
                <Icon type="share" size={18} />
              </button>

              <button
                onClick={onEdit}
                style={{
                  width: 'var(--tap-target-min)',
                  height: 'var(--tap-target-min)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-gray-800)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                }}
              >
                <Icon type="more" size={18} />
              </button>

              <button
                onClick={() => {
                  console.log('Logout button clicked');
                  onLogout?.();
                }}
                style={{
                  width: 'var(--tap-target-min)',
                  height: 'var(--tap-target-min)',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                aria-label="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </>
          ) : (
            /* Other User Actions */
            <>
              <button
                onClick={onFollow}
                style={{
                  flex: 1,
                  padding: 'var(--space-default)',
                  borderRadius: 'var(--radius-full)',
                  background: isFollowing 
                    ? 'var(--color-gray-800)' 
                    : 'var(--color-off-white)',
                  color: isFollowing 
                    ? 'var(--color-text-primary)' 
                    : 'var(--color-near-black)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                  border: isFollowing ? '1px solid var(--color-gray-700)' : 'none',
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              <button
                onClick={onShare}
                style={{
                  width: 'var(--tap-target-min)',
                  height: 'var(--tap-target-min)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-gray-800)',
                  color: 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                }}
              >
                <Icon type="share" size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};


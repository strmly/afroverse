'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../common/Icon';
import { Avatar } from '../common/Avatar';

interface ActionRailProps {
  creator: {
    id: string; // User ID for routing
    username: string;
    avatar: string;
    tribe: {
      color: string;
      icon: string;
    };
  };
  respectCount: number;
  isRespected: boolean;
  onRespect: () => void;
  onShare: () => void;
  onTryStyle: () => void;
  style: string;
  currentUserId?: string; // Optional: current user's ID for self-detection
}

export const ActionRail: React.FC<ActionRailProps> = ({
  creator,
  respectCount,
  isRespected,
  onRespect,
  onShare,
  onTryStyle,
  style,
  currentUserId,
}) => {
  const router = useRouter();
  const [isPulsing, setIsPulsing] = useState(true);
  
  // Navigate to correct profile (mine vs others)
  const handleProfileClick = () => {
    if (currentUserId && creator.id === currentUserId) {
      router.push('/profile');
    } else {
      router.push(`/profile/${creator.username}`);
    }
  };

  // Stop pulsing after interaction
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsPulsing(false);
    }, 15000); // Pulse for 15 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        right: 'var(--space-section)',
        bottom: 'calc(var(--nav-height-mobile) + var(--space-section) + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-section)',
        zIndex: 'var(--z-elevated)',
      }}
    >
      {/* Profile Avatar */}
      <button
        onClick={handleProfileClick}
        style={{
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <Avatar
          src={creator.avatar}
          alt={creator.username}
          size="lg"
          tribeBadge={{
            color: creator.tribe.color,
            icon: creator.tribe.icon,
          }}
        />
      </button>

      {/* Respect */}
      <button
        onClick={onRespect}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(248, 248, 248, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isRespected ? '#EF4444' : 'var(--color-off-white)',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="heart" size={24} active={isRespected} />
        </div>
        <span
          style={{
            fontSize: 'var(--text-meta)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-off-white)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
          }}
        >
          {respectCount >= 1000
            ? `${(respectCount / 1000).toFixed(1)}k`
            : respectCount}
        </span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(248, 248, 248, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-off-white)',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="share" size={24} />
        </div>
      </button>

      {/* Try This Style - PRIMARY ACTION */}
      <button
        onClick={onTryStyle}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          cursor: 'pointer',
          marginTop: 'var(--space-small)', // Extra spacing to emphasize
        }}
      >
        <div
          style={{
            width: '52px', // Slightly larger
            height: '52px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-off-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-near-black)',
            transition: 'all var(--transition-micro)',
            boxShadow: '0 4px 16px rgba(248, 248, 248, 0.3)',
            animation: isPulsing ? 'pulse 10s ease-in-out infinite' : 'none',
          }}
        >
          <Icon type="sparkle" size={28} />
        </div>
        <span
          style={{
            fontSize: 'var(--text-meta)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-off-white)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
            maxWidth: '60px',
            lineHeight: 'var(--line-tight)',
          }}
        >
          Try Style
        </span>
      </button>
    </div>
  );
};


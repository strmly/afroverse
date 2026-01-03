'use client';

import React, { useState } from 'react';
import { Icon } from '../common/Icon';

interface PostViewerActionRailProps {
  respectCount: number;
  isRespected: boolean;
  isVisible: boolean;
  tribeColor: string;
  onRespect: () => void;
  onShare: () => void;
  onTryStyle: () => void;
}

export const PostViewerActionRail: React.FC<PostViewerActionRailProps> = ({
  respectCount,
  isRespected: initialIsRespected,
  isVisible,
  tribeColor,
  onRespect,
  onShare,
  onTryStyle,
}) => {
  const [isRespected, setIsRespected] = useState(initialIsRespected);
  const [localRespectCount, setLocalRespectCount] = useState(respectCount);
  const [showBloom, setShowBloom] = useState(false);

  const handleRespect = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsRespected(!isRespected);
    setLocalRespectCount(prev => isRespected ? prev - 1 : prev + 1);
    
    if (!isRespected) {
      setShowBloom(true);
      setTimeout(() => setShowBloom(false), 600);
    }
    
    onRespect();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare();
  };

  const handleTryStyle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTryStyle();
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div
      style={{
        position: 'absolute',
        right: 'var(--space-default)',
        bottom: 'calc(env(safe-area-inset-bottom) + 120px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-large)',
        alignItems: 'center',
        opacity: isVisible ? 1 : 0.6,
        transition: 'opacity var(--transition-micro)',
      }}
    >
      {/* Respect */}
      <button
        onClick={handleRespect}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 'var(--tap-target-min)',
            height: 'var(--tap-target-min)',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon
            type="heart"
            size={24}
            style={{
              color: isRespected ? '#EF4444' : 'var(--color-off-white)',
              fill: isRespected ? '#EF4444' : 'none',
              transition: 'all var(--transition-micro)',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 'var(--text-meta)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-off-white)',
          }}
        >
          {formatCount(localRespectCount)}
        </span>

        {/* Bloom animation */}
        {showBloom && (
          <div
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid #EF4444',
              animation: 'bloom 0.6s ease-out',
              pointerEvents: 'none',
            }}
          />
        )}
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 'var(--tap-target-min)',
            height: 'var(--tap-target-min)',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(10, 10, 10, 0.6)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="share" size={24} style={{ color: 'var(--color-off-white)' }} />
        </div>
      </button>

      {/* Try This Style (Primary) */}
      <button
        onClick={handleTryStyle}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-tight)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: tribeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 24px ${tribeColor}60`,
            animation: 'gentlePulse 3s ease-in-out infinite',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="sparkle" size={28} style={{ color: 'var(--color-near-black)' }} />
        </div>
        <span
          style={{
            fontSize: 'var(--text-meta)',
            fontWeight: 'var(--weight-semibold)',
            color: tribeColor,
            textAlign: 'center',
            maxWidth: '80px',
          }}
        >
          Try This
        </span>
      </button>

      {/* Bloom animation keyframes */}
      <style>
        {`
          @keyframes bloom {
            from {
              transform: scale(0.5);
              opacity: 1;
            }
            to {
              transform: scale(1.5);
              opacity: 0;
            }
          }

          @keyframes gentlePulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 24px ${tribeColor}60;
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 0 32px ${tribeColor}80;
            }
          }
        `}
      </style>
    </div>
  );
};








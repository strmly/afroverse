'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../common/Icon';
import { PostViewerIdentity } from './PostViewerIdentity';
import { PostViewerActionRail } from './PostViewerActionRail';
import { PostViewerContext } from './PostViewerContext';

interface Post {
  id: string;
  imageUrl: string;
  user: {
    username: string;
    displayName: string;
  };
  tribe: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  caption?: string;
  styleTags?: string[];
  respectCount: number;
  isRespected: boolean;
}

interface PostViewerProps {
  isOpen: boolean;
  post: Post | null;
  context: 'feed' | 'profile' | 'tribe';
  contextLabel?: string; // "From @username" or "From Lagos Lions"
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onRespect: (postId: string) => void;
  onShare: (postId: string) => void;
  onTryStyle: (postId: string) => void;
  onTribeTap?: (tribeSlug: string) => void;
  onUserTap?: (username: string) => void;
}

export const PostViewer: React.FC<PostViewerProps> = ({
  isOpen,
  post,
  context,
  contextLabel,
  onClose,
  onPrevious,
  onNext,
  onRespect,
  onShare,
  onTryStyle,
  onTribeTap,
  onUserTap,
}) => {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [showContextHint, setShowContextHint] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const idleTimerRef = useRef<NodeJS.Timeout>();
  const contextTimerRef = useRef<NodeJS.Timeout>();

  // Reset states when post changes
  useEffect(() => {
    if (isOpen && post) {
      setIsUIVisible(true);
      setShowContextHint(true);
      setIsLoading(true);
      setHasError(false);

      // Hide context hint after 2 seconds
      contextTimerRef.current = setTimeout(() => {
        setShowContextHint(false);
      }, 2000);

      return () => {
        if (contextTimerRef.current) {
          clearTimeout(contextTimerRef.current);
        }
      };
    }
  }, [isOpen, post?.id]);

  // Idle timer for UI fade
  useEffect(() => {
    if (!isOpen || !post) return;

    const resetIdleTimer = () => {
      setIsUIVisible(true);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        setIsUIVisible(false);
      }, 3000);
    };

    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Vertical swipe (dismiss)
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 100) {
      onClose();
    }

    // Horizontal swipe (navigate)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < -100 && onNext) {
        onNext();
      } else if (deltaX > 100 && onPrevious) {
        onPrevious();
      }
    }
  };

  const handleSingleTap = () => {
    setIsUIVisible(!isUIVisible);
  };

  const handleDoubleTap = () => {
    onRespect(post.id);
  };

  // Double-tap detection
  const lastTap = useRef(0);
  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      handleDoubleTap();
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 300) {
          handleSingleTap();
        }
      }, 300);
    }

    lastTap.current = now;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Error state
  if (hasError) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--color-near-black)',
          zIndex: 'var(--z-modal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-large)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-body-md)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Couldn't load this image.
        </p>
        <button
          onClick={onClose}
          style={{
            padding: 'var(--space-default) var(--space-large)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-off-white)',
            color: 'var(--color-near-black)',
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-near-black)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Layer 1: Canvas (Image) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading && (
          <div
            className="skeleton"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        )}
        <img
          src={post.imageUrl}
          alt={`Post by ${post.user.displayName}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity var(--transition-screen)',
          }}
        />
      </div>

      {/* Layer 2: Tribe Badge (Top-Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTribeTap?.(post.tribe.slug);
        }}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + var(--space-default))',
          left: 'var(--space-default)',
          padding: 'var(--space-small) var(--space-default)',
          borderRadius: 'var(--radius-full)',
          background: `${post.tribe.color}20`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${post.tribe.color}40`,
          boxShadow: `0 0 20px ${post.tribe.color}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-small)',
          cursor: 'pointer',
          opacity: isUIVisible ? 1 : 0.6,
          transition: 'opacity var(--transition-micro)',
        }}
      >
        <span style={{ fontSize: 'var(--text-body-md)' }}>{post.tribe.icon}</span>
        <span
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: post.tribe.color,
          }}
        >
          {post.tribe.name}
        </span>
      </button>

      {/* Layer 3: Identity Stack (Bottom-Left) */}
      <PostViewerIdentity
        username={post.user.username}
        displayName={post.user.displayName}
        caption={post.caption}
        styleTags={post.styleTags}
        isVisible={isUIVisible}
        onUserTap={() => onUserTap?.(post.user.username)}
      />

      {/* Layer 4: Action Rail (Right Side) */}
      <PostViewerActionRail
        respectCount={post.respectCount}
        isRespected={post.isRespected}
        isVisible={isUIVisible}
        tribeColor={post.tribe.color}
        onRespect={() => onRespect(post.id)}
        onShare={() => onShare(post.id)}
        onTryStyle={() => onTryStyle(post.id)}
      />

      {/* Layer 5: Context Hint */}
      {contextLabel && (
        <PostViewerContext
          label={contextLabel}
          isVisible={showContextHint}
        />
      )}

      {/* Layer 6: Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + var(--space-default))',
          right: 'var(--space-default)',
          width: 'var(--tap-target-min)',
          height: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-off-white)',
          cursor: 'pointer',
          opacity: isUIVisible ? 1 : 0.6,
          transition: 'opacity var(--transition-micro)',
        }}
      >
        <Icon type="close" size={20} />
      </button>

      {/* Swipe hint (subtle, bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + var(--space-default))',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'var(--text-meta)',
          color: 'var(--color-text-tertiary)',
          opacity: isUIVisible ? 0.5 : 0,
          transition: 'opacity var(--transition-micro)',
        }}
      >
        Swipe down to close
      </div>
    </div>
  );
};








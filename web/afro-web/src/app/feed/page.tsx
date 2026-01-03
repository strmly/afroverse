'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FeedCanvas } from '../../components/feed/FeedCanvas';
import { IdentitySignals } from '../../components/feed/IdentitySignals';
import { ActionRail } from '../../components/feed/ActionRail';
import { useFeed } from '../../hooks/useFeed';
import { respectPost, unrespectPost, sharePost as sharePostAPI } from '../../services/postService';

export default function FeedPage() {
  const router = useRouter();
  const { items: posts, loading, initialLoading, loadMore, hasMore } = useFeed('personalized');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [respectAnimation, setRespectAnimation] = useState<{ x: number; y: number } | null>(null);
  const [localPosts, setLocalPosts] = useState(posts);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNavigatingRef = useRef(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update local posts when API posts change
  useEffect(() => {
    setLocalPosts(posts);
  }, [posts]);

  // Load more when approaching end
  useEffect(() => {
    if (currentIndex >= posts.length - 2 && hasMore && !loading) {
      loadMore();
    }
  }, [currentIndex, posts.length, hasMore, loading, loadMore]);

  // Navigate to next/previous post with smooth transition
  const navigateToPost = useCallback((direction: 'next' | 'prev') => {
    if (isNavigatingRef.current) return; // Prevent rapid navigation
    
    isNavigatingRef.current = true;
    setIsTransitioning(true);
    
    setCurrentIndex((prevIndex) => {
      if (direction === 'next' && prevIndex < localPosts.length - 1) {
        return prevIndex + 1;
      } else if (direction === 'prev' && prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
    
    // Reset navigation lock and transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
      isNavigatingRef.current = false;
    }, 300);
  }, [localPosts.length]);

  // Keyboard navigation (Arrow Up/Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateToPost('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateToPost('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPost]);

  // Mouse wheel navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Don't interfere if user is scrolling within a scrollable element
      const target = e.target as HTMLElement;
      if (
        target.closest('textarea') ||
        target.closest('[role="textbox"]') ||
        target.closest('.scrollable')
      ) {
        return;
      }

      e.preventDefault();
      
      const deltaY = e.deltaY;
      const threshold = 50; // Minimum scroll delta to trigger navigation

      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          // Scrolling down - next post
          navigateToPost('next');
        } else {
          // Scrolling up - previous post
          navigateToPost('prev');
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [navigateToPost]);

  const currentPost = localPosts[currentIndex];

  // Vertical swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && currentIndex < localPosts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isSwipeDown && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Double-tap to respect (toggle like)
  const handleDoubleTap = async (e?: React.TouchEvent) => {
    if (!currentPost) return;

    // Toggle respect state
    const wasRespected = currentPost.viewerState.hasRespected;
    const newRespected = !wasRespected;

    // Show heart animation at tap point (only when liking)
    if (newRespected && e && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.changedTouches[0];
      setRespectAnimation({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });

      setTimeout(() => setRespectAnimation(null), 1000);
    }

    // Optimistic update
    setLocalPosts(localPosts.map(post =>
      post.postId === currentPost.postId
        ? {
            ...post,
            viewerState: { ...post.viewerState, hasRespected: newRespected },
            counts: { ...post.counts, respects: post.counts.respects + (newRespected ? 1 : -1) }
          }
        : post
    ));

    // Call API (backend enforces one like per user via unique index)
    try {
      if (newRespected) {
        await respectPost(currentPost.postId);
      } else {
        await unrespectPost(currentPost.postId);
      }
    } catch (error) {
      console.error('Failed to update respect:', error);
      // Rollback on error
      setLocalPosts(localPosts.map(post =>
        post.postId === currentPost.postId
          ? {
              ...post,
              viewerState: { ...post.viewerState, hasRespected: wasRespected },
              counts: { ...post.counts, respects: post.counts.respects + (wasRespected ? 1 : -1) }
            }
          : post
      ));
    }
  };

  const handleRespect = () => {
    handleDoubleTap();
  };

  const handleShare = async () => {
    if (!currentPost) return;

    try {
      await sharePostAPI(currentPost.postId);
      
      if (navigator.share) {
        navigator.share({
          title: `Check out ${currentPost.user.displayName}'s AfroMoji`,
          text: currentPost.caption || 'Check out this amazing transformation',
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleTryStyle = () => {
    if (!currentPost) return;
    // Navigate to create page with style pre-filled
    const styleTag = currentPost.styleTag || '';
    router.push(`/create?style=${encodeURIComponent(styleTag)}&seedPost=${currentPost.postId}`);
  };

  const handleLongPress = () => {
    if (!currentPost) return;
    handleTryStyle();
  };

  // Loading state
  if (initialLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-near-black)',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          border: '3px solid var(--color-gray-800)',
          borderTopColor: 'var(--color-white)',
          animation: 'spin 1s linear infinite',
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Empty feed state
  if (!currentPost || localPosts.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-xl)',
        background: 'var(--color-near-black)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: 'var(--space-md)',
        }}>
          ✨
        </div>
        <h2 style={{
          fontSize: 'var(--text-display-md)',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--color-text-primary)',
          margin: 0,
        }}>
          Your Feed is Empty
        </h2>
        <p style={{
          fontSize: 'var(--text-body-md)',
          color: 'var(--color-text-secondary)',
          maxWidth: '320px',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Be the first to share your transformation with the tribe. Start creating to fill your feed.
        </p>
        <button
          onClick={() => router.push('/create')}
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md) var(--space-xl)',
            background: '#FFFFFF',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-body-md)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          Create Your First Post
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: 'var(--color-near-black)',
        cursor: 'default',
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        // Ensure keyboard events are captured
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
        }
      }}
    >
      {/* LAYER 1 — Canvas (image) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 'var(--nav-height-mobile)',
          zIndex: 0,
          opacity: isTransitioning ? 0.7 : 1,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        <FeedCanvas
          imageUrl={currentPost.imageUrl}
          aspectRatio={currentPost.aspect as '9:16' | '1:1'}
          onDoubleTap={handleDoubleTap}
          onLongPress={handleLongPress}
        />
      </div>

      {/* Subtle gradient overlays */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 'var(--nav-height-mobile)',
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, transparent 20%, transparent 70%, rgba(10,10,10,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* LAYER 2 — Identity Signals */}
      <IdentitySignals
        tribe={{
          slug: currentPost.tribe.slug,
          name: currentPost.tribe.name,
          color: currentPost.tribe.id, // Using ID as placeholder
          icon: '◆',
        }}
        creator={{
          username: currentPost.user.username,
          displayName: currentPost.user.displayName,
        }}
        caption={currentPost.caption}
        styleTags={currentPost.styleTag ? [currentPost.styleTag] : []}
        context={undefined}
      />

      {/* LAYER 3 — Action Rail */}
      <ActionRail
        creator={{
          id: currentPost.user.id,
          username: currentPost.user.username,
          avatar: currentPost.user.avatarThumbUrl,
          tribe: {
            color: '#9333EA',
            icon: '◆',
          },
        }}
        respectCount={currentPost.counts.respects}
        isRespected={currentPost.viewerState.hasRespected}
        onRespect={handleRespect}
        onShare={handleShare}
        onTryStyle={handleTryStyle}
        style={currentPost.styleTag || ''}
      />

      {/* Double-tap respect animation */}
      {respectAnimation && (
        <div
          style={{
            position: 'absolute',
            left: respectAnimation.x,
            top: respectAnimation.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 'var(--z-overlay)',
            animation: 'heartBurst 1s ease-out forwards',
          }}
        >
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top, 0px) + 2px)',
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(248, 248, 248, 0.1)',
          zIndex: 'var(--z-elevated)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / localPosts.length) * 100}%`,
            background: 'var(--color-off-white)',
            transition: 'width 200ms ease-out',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes heartBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}

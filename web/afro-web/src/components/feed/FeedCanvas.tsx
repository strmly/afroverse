'use client';

import React from 'react';

interface FeedCanvasProps {
  imageUrl: string;
  aspectRatio?: '9:16' | '1:1';
  onDoubleTap: () => void;
  onLongPress: () => void;
}

export const FeedCanvas: React.FC<FeedCanvasProps> = ({
  imageUrl,
  aspectRatio = '9:16',
  onDoubleTap,
  onLongPress,
}) => {
  const [lastTap, setLastTap] = React.useState(0);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't prevent scrolling - let parent handle vertical swipes
    // Only handle tap interactions here
    
    // Start long-press timer
    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500); // 500ms for long-press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Cancel long-press if touch ends
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    // Detect double-tap
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      e.stopPropagation(); // Prevent scroll on double-tap
      onDoubleTap();
      setLastTap(0);
    } else {
      setLastTap(now);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancel long-press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    // Don't stop propagation - let parent handle scrolling
  };

  React.useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-near-black)',
        overflow: 'hidden',
        pointerEvents: 'auto', // Ensure touch events are captured
      }}
    >
      {aspectRatio === '1:1' ? (
        // Non-9:16: Use blurred background
        <>
          {/* Blurred background */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
              opacity: 0.6,
              transform: 'scale(1.1)',
            }}
          />
          
          {/* Foreground image */}
          <img
            src={imageUrl}
            alt="Feed post"
            style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              zIndex: 1,
            }}
          />
        </>
      ) : (
        // 9:16: Edge-to-edge
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
};


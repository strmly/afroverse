'use client';

import React, { useState, useEffect } from 'react';

interface HeroViewProps {
  imageUrl: string;
  onTap: () => void;
  onSwipeUp: () => void;
  onSwipeDown?: () => void;
  showUI: boolean;
}

export const HeroView: React.FC<HeroViewProps> = ({
  imageUrl,
  onTap,
  onSwipeUp,
  onSwipeDown,
  showUI,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;
    
    if (isSwipeUp) {
      onSwipeUp();
    } else if (isSwipeDown && onSwipeDown) {
      onSwipeDown();
    }
  };

  // Parallax effect on device orientation (mobile)
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && event.gamma !== null) {
        setTiltX(event.gamma / 10); // -9 to 9 degrees
        setTiltY(event.beta / 10);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  return (
    <div
      onClick={onTap}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Image with parallax and vignette */}
      <div
        style={{
          position: 'absolute',
          inset: '-5%', // Slight overflow for parallax
          transform: `translate(${tiltX}px, ${tiltY}px) scale(1.05)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <img
          src={imageUrl}
          alt="Your transformation"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            console.error('HeroView: Image failed to load:', imageUrl);
            console.error('Error event:', e);
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('HeroView: Image loaded successfully:', imageUrl);
          }}
        />
        
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Interaction hint (fades in after idle) */}
      {!showUI && (
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'fadeInDelayed 1s ease-out 5s forwards',
            opacity: 0,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-tertiary)',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            }}
          >
            Tap or swipe up
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInDelayed {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
};






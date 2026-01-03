'use client';

import React, { useState, useEffect } from 'react';

interface RevealMomentProps {
  imageUrl: string;
  isFirstCreation?: boolean;
  onRevealComplete: () => void;
}

export const RevealMoment: React.FC<RevealMomentProps> = ({
  imageUrl,
  isFirstCreation = false,
  onRevealComplete,
}) => {
  const [phase, setPhase] = useState<'blackout' | 'blur' | 'clear' | 'complete'>('blackout');
  const [showMicroCopy, setShowMicroCopy] = useState(isFirstCreation);

  useEffect(() => {
    // Phase 1: Blackout (300-500ms)
    const blackoutTimer = setTimeout(() => {
      setPhase('blur');
      
      // Trigger haptic if available
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 400);

    // Phase 2: Blur to clear (500ms)
    const blurTimer = setTimeout(() => {
      setPhase('clear');
    }, 900);

    // Phase 3: Hide micro-copy (after 1.2s of clear view)
    const microCopyTimer = setTimeout(() => {
      setShowMicroCopy(false);
    }, 2100);

    // Phase 4: Complete (ready for interaction)
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      onRevealComplete();
    }, 2500);

    return () => {
      clearTimeout(blackoutTimer);
      clearTimeout(blurTimer);
      clearTimeout(microCopyTimer);
      clearTimeout(completeTimer);
    };
  }, [isFirstCreation, onRevealComplete]);

  if (phase === 'blackout') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease-out',
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Image with blur to clear transition */}
      <img
        src={imageUrl}
        alt="Your transformation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: phase === 'blur' ? 'blur(20px)' : 'blur(0px)',
          opacity: phase === 'blur' ? 0.5 : 1,
          transition: 'filter 0.8s ease-out, opacity 0.8s ease-out',
        }}
        onError={(e) => {
          console.error('RevealMoment: Image failed to load:', imageUrl);
          console.error('Error event:', e);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
        onLoad={() => {
          console.log('RevealMoment: Image loaded successfully:', imageUrl);
        }}
      />

      {/* Optional micro-copy for first-time users */}
      {showMicroCopy && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            animation: 'fadeOut 0.5s ease-out 1.7s forwards',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-display-md)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-off-white)',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              letterSpacing: '0.05em',
            }}
          >
            This is you.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};






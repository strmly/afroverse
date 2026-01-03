'use client';

import React, { useState, useEffect } from 'react';

export type TransformationPhase = 'preparation' | 'forging' | 'finalizing' | 'revealing' | 'delayed';

interface TransformationLoaderProps {
  show: boolean;
  phase?: TransformationPhase;
  estimatedTimeMs?: number;
  elapsedTimeMs?: number;
  isRemix?: boolean; // For "Try This Style" flow
  onRevealComplete?: () => void;
}

const PHASE_CONFIG = {
  preparation: {
    primaryText: 'Preparing your transformation',
    subtexts: [
      'Analyzing your features',
      'Understanding your style',
      'Aligning cultural elements',
    ],
    defaultDuration: 10,
  },
  forging: {
    primaryText: 'Forging your identity',
    subtexts: [
      'Weaving cultural details',
      'Shaping your look',
      'Infusing modern elements',
    ],
    defaultDuration: 25,
  },
  finalizing: {
    primaryText: 'Adding final details',
    subtexts: [
      'Texture, lighting, depth',
    ],
    defaultDuration: 10,
  },
  delayed: {
    primaryText: 'This transformation needs a little more care',
    subtexts: [
      'High-detail styles take longer',
    ],
    defaultDuration: 30,
  },
  revealing: {
    primaryText: 'Your transformation is complete',
    subtexts: [],
    defaultDuration: 0,
  },
};

export const TransformationLoader: React.FC<TransformationLoaderProps> = ({
  show,
  phase = 'preparation',
  estimatedTimeMs,
  elapsedTimeMs = 0,
  isRemix = false,
  onRevealComplete,
}) => {
  const [subtextIndex, setSubtextIndex] = useState(0);
  const [showRevealText, setShowRevealText] = useState(false);

  const config = PHASE_CONFIG[phase];
  const subtexts = config.subtexts;

  // Rotate subtexts
  useEffect(() => {
    if (subtexts.length > 1) {
      const interval = setInterval(() => {
        setSubtextIndex((prev) => (prev + 1) % subtexts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [subtexts.length, phase]);

  // Handle reveal animation
  useEffect(() => {
    if (phase === 'revealing' && show) {
      setShowRevealText(true);
      const timer = setTimeout(() => {
        setShowRevealText(false);
        if (onRevealComplete) {
          onRevealComplete();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, show, onRevealComplete]);

  // Calculate remaining time with smart rounding
  const getRemainingTimeText = (): string => {
    if (phase === 'finalizing') {
      return 'Less than 10 seconds';
    }

    if (phase === 'delayed') {
      return 'About 20–30 seconds';
    }

    if (!estimatedTimeMs) {
      return `~${config.defaultDuration} seconds`;
    }

    const remainingMs = Math.max(0, estimatedTimeMs - elapsedTimeMs);
    const remainingSec = Math.ceil(remainingMs / 1000);

    // Smart rounding for better UX
    if (remainingSec < 5) {
      return 'Almost there';
    } else if (remainingSec < 15) {
      // Round to nearest 5 seconds
      const rounded = Math.round(remainingSec / 5) * 5;
      return rounded > 5 ? `About ${rounded} seconds` : 'Almost there';
    } else {
      // Round to nearest 10 seconds
      const rounded = Math.round(remainingSec / 10) * 10;
      return `About ${rounded} seconds remaining`;
    }
  };

  if (!show) return null;

  // Reveal state (black fade with text)
  if (phase === 'revealing') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          zIndex: 9999,
          animation: showRevealText ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.5s ease-out',
        }}
      >
        {showRevealText && (
          <p
            style={{
              fontSize: 'var(--text-display-md)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-gold)',
              textAlign: 'center',
              letterSpacing: '0.05em',
              animation: 'scaleIn 0.5s var(--ease-smooth)',
            }}
          >
            {config.primaryText}
          </p>
        )}
      </div>
    );
  }

  // Main loading states
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 'var(--z-overlay)',
        animation: 'fadeIn 0.3s ease-out',
        gap: 'var(--space-section)',
      }}
    >
      {/* African Glyph / Animated Symbol */}
      <div
        style={{
          width: '120px',
          height: '120px',
          position: 'relative',
          marginBottom: 'var(--space-default)',
        }}
      >
        {phase === 'preparation' ? (
          // Pulsing circle for preparation
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '3px solid var(--color-gold)',
              opacity: 0.6,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        ) : phase === 'finalizing' ? (
          // Sharper geometric shape for finalizing
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              animation: 'rotate 3s linear infinite',
            }}
          >
            <path
              d="M60 10 L110 40 L110 80 L60 110 L10 80 L10 40 Z"
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="2"
              opacity="0.8"
            />
          </svg>
        ) : (
          // Abstract forming silhouette for forging
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            style={{
              animation: 'floatSlow 4s ease-in-out infinite',
            }}
          >
            {/* Abstract African-inspired glyph */}
            <circle cx="60" cy="40" r="20" fill="var(--color-gold)" opacity="0.3" />
            <rect x="40" y="60" width="40" height="50" rx="5" fill="var(--color-gold)" opacity="0.5" />
            <circle cx="45" cy="75" r="3" fill="var(--color-off-white)" />
            <circle cx="75" cy="75" r="3" fill="var(--color-off-white)" />
          </svg>
        )}
      </div>

      {/* Primary Text */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-default)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-display-sm)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-off-white)',
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          {isRemix && phase === 'forging' ? 'Forging your version' : config.primaryText}
        </h2>

        {/* Rotating Subtext */}
        {subtexts.length > 0 && (
          <p
            key={subtextIndex}
            style={{
              fontSize: 'var(--text-body-md)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-relaxed)',
              margin: 0,
              animation: 'fadeIn 0.5s ease-out',
              minHeight: '24px',
            }}
          >
            {subtexts[subtextIndex]}
          </p>
        )}

        {/* Time Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-small)',
            marginTop: 'var(--space-default)',
          }}
        >
          <span style={{ fontSize: '16px' }}>⏳</span>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-tertiary)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            {getRemainingTimeText()}
          </span>
        </div>
      </div>

      {/* Subtle Progress Dots (3 dots pulsing) */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-small)',
          marginTop: 'var(--space-large)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--color-gold)',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};


'use client';

import React from 'react';

interface GenerationLoaderProps {
  show: boolean;
}

export const GenerationLoader: React.FC<GenerationLoaderProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 'var(--z-overlay)',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      {/* Ceremonial reveal - no spinners, just elegant dots */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-large)',
        }}
      >
        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-small)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-off-white)',
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>

        {/* Ceremonial text */}
        <p
          style={{
            fontSize: 'var(--text-display-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-off-white)',
            letterSpacing: '0.05em',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          Becoming…
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};








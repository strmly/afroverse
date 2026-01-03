'use client';

import React, { useEffect, useState } from 'react';

interface PostViewerContextProps {
  label: string;
  isVisible: boolean;
}

export const PostViewerContext: React.FC<PostViewerContextProps> = ({
  label,
  isVisible,
}) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow fade-out animation
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 60px)',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: 'var(--space-small) var(--space-default)',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        fontSize: 'var(--text-meta)',
        color: 'var(--color-text-secondary)',
        fontWeight: 'var(--weight-medium)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity var(--transition-screen)',
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  );
};








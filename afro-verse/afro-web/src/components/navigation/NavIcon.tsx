'use client';

import React from 'react';
import { Icon, IconType } from '../common/Icon';

interface NavIconProps {
  type: IconType;
  active: boolean;
  onClick: () => void;
  elevated?: boolean;
}

export const NavIcon: React.FC<NavIconProps> = ({ 
  type, 
  active, 
  onClick,
  elevated = false 
}) => {
  return (
    <button
      onClick={onClick}
      className="nav-icon"
      aria-label={type}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: elevated ? '56px' : '48px',
        height: elevated ? '56px' : '48px',
        borderRadius: 'var(--radius-full)',
        background: elevated 
          ? 'var(--color-white)'
          : active 
            ? 'var(--color-gray-800)' 
            : 'transparent',
        color: elevated 
          ? 'var(--color-black)'
          : active 
            ? 'var(--color-white)' 
            : 'var(--color-gray-500)',
        transform: elevated ? 'translateY(-8px)' : 'none',
        boxShadow: elevated 
          ? '0 8px 24px rgba(255, 255, 255, 0.15)'
          : 'none',
        transition: 'all var(--transition-base)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Icon 
        type={type} 
        size={elevated ? 28 : 24} 
        active={active}
      />
      
      {/* Subtle active indicator */}
      {active && !elevated && (
        <span
          style={{
            position: 'absolute',
            bottom: '-4px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'var(--color-white)',
            opacity: 0.6,
          }}
        />
      )}
      
      {/* Glow effect for Create button */}
      {elevated && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            animation: 'glow 3s infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </button>
  );
};


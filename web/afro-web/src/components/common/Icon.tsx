'use client';

import React from 'react';

export type IconType = 
  | 'feed' 
  | 'create' 
  | 'tribe' 
  | 'profile'
  | 'heart'
  | 'share'
  | 'back'
  | 'close'
  | 'more'
  | 'sparkle'
  | 'check'
  | 'chevron-right'
  | 'chevron-down'
  | 'camera'
  | 'photo';

interface IconProps {
  type: IconType;
  size?: number;
  className?: string;
  active?: boolean;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ 
  type, 
  size = 24, 
  className = '',
  active = false,
  style 
}) => {
  const iconPaths: Record<IconType, string> = {
    // Bottom Nav Icons - Minimal geometric shapes
    feed: active 
      ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z' 
      : 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
    
    create: active
      ? 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'
      : 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
    
    tribe: active
      ? 'M12 2L2 7L12 12L22 7L12 2Z M12 14L2 9V17L12 22L22 17V9L12 14Z'
      : 'M12 2L2 7L12 12L22 7L12 2Z M12 13.5L3.5 9V16.5L12 21L20.5 16.5V9L12 13.5Z',
    
    profile: active
      ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'
      : 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
    
    // Action Icons
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
    
    sparkle: 'M12 1L15 9L23 12L15 15L12 23L9 15L1 12L9 9L12 1Z',
    
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    
    check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    
    'chevron-right': 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    
    'chevron-down': 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
    
    camera: 'M12 15.2c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-5-2V5H4v2.2C2.84 7.6 2 8.69 2 10v8c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3v-8c0-1.31-.84-2.4-2-2.8V5h-3v2.2H7zM20 18c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v8z',
    
    photo: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  };

  // Determine if icon should be filled or stroked
  const filledIcons: IconType[] = ['heart', 'sparkle', 'check'];
  const isFilled = filledIcons.includes(type) || (active && ['feed', 'create', 'tribe', 'profile'].includes(type));
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth={isFilled ? '0' : '2'}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        transition: 'transform var(--transition-fast)',
      }}
    >
      <path d={iconPaths[type]} />
    </svg>
  );
};


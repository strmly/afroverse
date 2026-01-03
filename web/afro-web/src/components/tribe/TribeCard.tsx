'use client';

import React, { useState } from 'react';

interface TribeCardProps {
  id: string;
  name: string;
  motto: string;
  vibeDescriptor: string;
  sigil: string;
  accentColor: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const TribeCard: React.FC<TribeCardProps> = ({
  id,
  name,
  motto,
  vibeDescriptor,
  sigil,
  accentColor,
  isSelected,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: 'var(--space-large)',
        borderRadius: 'var(--radius-xl)',
        background: isSelected 
          ? `${accentColor}15` 
          : 'var(--color-gray-900)',
        border: isSelected 
          ? `2px solid ${accentColor}` 
          : `2px solid ${isHovered ? accentColor + '60' : 'var(--color-gray-800)'}`,
        cursor: 'pointer',
        transition: 'all var(--transition-micro)',
        textAlign: 'center',
        position: 'relative',
        transform: isSelected 
          ? 'scale(1.02)' 
          : isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isSelected 
          ? `0 0 32px ${accentColor}40, var(--shadow-lg)` 
          : isHovered 
            ? `0 0 24px ${accentColor}30, var(--shadow-md)` 
            : 'var(--shadow-sm)',
      }}
    >
      {/* Sigil */}
      <div
        style={{
          width: '80px',
          height: '80px',
          margin: '0 auto var(--space-default)',
          borderRadius: 'var(--radius-full)',
          background: isSelected ? accentColor : 'var(--color-gray-800)',
          border: `2px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-display-lg)',
          boxShadow: isSelected ? `0 0 24px ${accentColor}60` : 'none',
          transition: 'all var(--transition-micro)',
        }}
      >
        {sigil}
      </div>

      {/* Name */}
      <h3
        style={{
          fontSize: 'var(--text-display-sm)',
          fontWeight: 'var(--weight-bold)',
          color: isSelected ? accentColor : 'var(--color-text-primary)',
          marginBottom: 'var(--space-small)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </h3>

      {/* Motto */}
      <p
        style={{
          fontSize: 'var(--text-body-md)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-small)',
          lineHeight: 'var(--line-relaxed)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {motto}
      </p>

      {/* Vibe Descriptor */}
      <p
        style={{
          fontSize: 'var(--text-meta)',
          color: 'var(--color-text-tertiary)',
          letterSpacing: '0.02em',
        }}
      >
        {vibeDescriptor}
      </p>

      {/* Selection Indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-default)',
            right: 'var(--space-default)',
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-full)',
            background: accentColor,
            color: 'var(--color-near-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-bold)',
            animation: 'scaleIn 0.3s ease-out',
          }}
        >
          ✓
        </div>
      )}
    </button>
  );
};








'use client';

import React from 'react';

interface Chip {
  id: string;
  label: string;
  prompt: string;
}

interface PromptChipsProps {
  chips: Chip[];
  onSelect: (prompt: string) => void;
  show: boolean;
}

export const PromptChips: React.FC<PromptChipsProps> = ({
  chips,
  onSelect,
  show,
}) => {
  if (!show || chips.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height-mobile) + 140px)',
        left: 0,
        right: 0,
        zIndex: 600,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        className="chips-scroll"
        style={{
          display: 'flex',
          gap: 'var(--space-default)',
          overflowX: 'auto',
          padding: 'var(--space-default) var(--space-section)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => onSelect(chip.prompt)}
            style={{
              padding: 'var(--space-default) var(--space-section)',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gray-800)',
              border: '1px solid var(--color-gray-700)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--weight-medium)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all var(--transition-micro)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};


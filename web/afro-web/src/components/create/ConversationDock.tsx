'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';

interface ConversationDockProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onAttach: () => void;
  canGenerate: boolean;
  isGenerating: boolean;
  selfieCount: number;
}

export const ConversationDock: React.FC<ConversationDockProps> = ({
  placeholder,
  value,
  onChange,
  onGenerate,
  onAttach,
  canGenerate,
  isGenerating,
  selfieCount,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  return (
    <div
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-gray-800)',
        padding: 'var(--space-section) var(--space-default)',
      }}
    >
      {/* Dock container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-default)',
          background: 'var(--color-gray-900)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-default)',
          border: `1px solid ${isFocused ? 'var(--color-gray-700)' : 'var(--color-gray-800)'}`,
          transition: 'border-color var(--transition-micro)',
        }}
      >
        {/* Attachment button */}
        <button
          onClick={onAttach}
          style={{
            position: 'relative',
            width: '48px',
            height: '48px',
            minWidth: '48px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-gray-800)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all var(--transition-micro)',
          }}
        >
          <Icon type="sparkle" size={20} />
          
          {/* Selfie count badge */}
          {selfieCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-gold)',
                color: 'var(--color-near-black)',
                fontSize: 'var(--text-meta)',
                fontWeight: 'var(--weight-semibold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-gray-900)',
              }}
            >
              {selfieCount}
            </div>
          )}
        </button>

        {/* Input field */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isGenerating}
          rows={1}
          style={{
            flex: 1,
            minHeight: '48px',
            maxHeight: '120px',
            padding: 'var(--space-default) var(--space-small)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--text-body-md)',
            lineHeight: 'var(--line-normal)',
            resize: 'none',
            fontFamily: 'inherit',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canGenerate) {
              e.preventDefault();
              onGenerate();
            }
          }}
        />

        {/* Generate button */}
        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          style={{
            width: '48px',
            height: '48px',
            minWidth: '48px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: canGenerate 
              ? 'var(--color-off-white)' 
              : 'var(--color-gray-800)',
            color: canGenerate 
              ? 'var(--color-near-black)' 
              : 'var(--color-gray-600)',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            transition: 'all var(--transition-micro)',
            animation: canGenerate && !isGenerating ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        >
          <Icon type="sparkle" size={20} />
        </button>
      </div>
    </div>
  );
};


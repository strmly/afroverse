'use client';

import React, { useState, useEffect } from 'react';

interface TribeHeaderProps {
  bannerGradient: string;
  sigil: string;
  name: string;
  motto: string;
  vibeDescriptor?: string;
  memberCount: number;
  accentColor: string;
  isMember: boolean;
  isActiveNow?: boolean;
  onJoinClick?: () => void;
  isScrolled?: boolean;
}

export const TribeHeader: React.FC<TribeHeaderProps> = ({
  bannerGradient,
  sigil,
  name,
  motto,
  vibeDescriptor,
  memberCount,
  accentColor,
  isMember,
  isActiveNow = false,
  onJoinClick,
  isScrolled = false,
}) => {
  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <header
      style={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'all var(--transition-screen)',
      }}
    >
      {/* Banner (Full-width) */}
      <div
        style={{
          height: isScrolled ? '80px' : '200px',
          background: bannerGradient,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'height var(--transition-screen)',
          position: 'relative',
        }}
      >
        {/* Subtle overlay for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, transparent 0%, ${accentColor}15 100%)`,
          }}
        />
      </div>

      {/* Content Container */}
      <div
        style={{
          position: 'relative',
          marginTop: isScrolled ? '-40px' : '-60px',
          padding: '0 var(--space-default) var(--space-section)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transition: 'all var(--transition-screen)',
        }}
      >
        {/* Tribe Sigil / Icon */}
        <div
          style={{
            width: isScrolled ? '60px' : '100px',
            height: isScrolled ? '60px' : '100px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            border: `3px solid ${accentColor}`,
            boxShadow: `0 0 24px ${accentColor}60, var(--shadow-lg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isScrolled ? 'var(--text-display-md)' : 'var(--text-display-xl)',
            marginBottom: isScrolled ? 'var(--space-small)' : 'var(--space-default)',
            transition: 'all var(--transition-screen)',
          }}
        >
          {sigil}
        </div>

        {/* Tribe Name + Motto */}
        {!isScrolled && (
          <div
            style={{
              marginBottom: 'var(--space-default)',
            }}
          >
            <h1
              style={{
                fontSize: 'var(--text-display-lg)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-tight)',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </h1>

            <p
              style={{
                fontSize: 'var(--text-body-md)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-relaxed)',
                maxWidth: '320px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: vibeDescriptor ? 'var(--space-small)' : 0,
              }}
            >
              {motto}
            </p>

            {vibeDescriptor && (
              <p
                style={{
                  fontSize: 'var(--text-meta)',
                  color: 'var(--color-text-tertiary)',
                  letterSpacing: '0.02em',
                }}
              >
                {vibeDescriptor}
              </p>
            )}
          </div>
        )}

        {/* Member Count + Activity */}
        {!isScrolled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-default)',
              marginBottom: 'var(--space-default)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {formatMemberCount(memberCount)} members
            </span>

            {isActiveNow && (
              <>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-text-tertiary)',
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-tight)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: 'var(--radius-full)',
                      background: '#10B981',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'var(--text-body-sm)',
                      color: '#10B981',
                    }}
                  >
                    Active now
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Membership State Button */}
        {!isScrolled && (
          <div>
            {isMember ? (
              <div
                style={{
                  padding: 'var(--space-small) var(--space-large)',
                  borderRadius: 'var(--radius-full)',
                  background: `${accentColor}20`,
                  border: `1px solid ${accentColor}40`,
                  color: accentColor,
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-small)',
                }}
              >
                <span>✓</span>
                Joined
              </div>
            ) : (
              <button
                onClick={onJoinClick}
                style={{
                  padding: 'var(--space-default) var(--space-large)',
                  borderRadius: 'var(--radius-full)',
                  background: accentColor,
                  color: 'var(--color-near-black)',
                  fontSize: 'var(--text-body-md)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-micro)',
                  boxShadow: `0 4px 16px ${accentColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accentColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${accentColor}40`;
                }}
              >
                Join Tribe
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};








'use client';

import React from 'react';

interface TribeAboutProps {
  story: string;
  vibeRules: string[];
  styleOfTheMoment?: string;
  safetyNote: string;
  accentColor: string;
  onReportClick?: () => void;
}

export const TribeAbout: React.FC<TribeAboutProps> = ({
  story,
  vibeRules,
  styleOfTheMoment,
  safetyNote,
  accentColor,
  onReportClick,
}) => {
  return (
    <div
      style={{
        padding: 'var(--space-section) var(--space-default)',
        maxWidth: '520px',
        margin: '0 auto',
      }}
    >
      {/* Tribe Story */}
      <section style={{ marginBottom: 'var(--space-large)' }}>
        <h3
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-default)',
          }}
        >
          Tribe Story
        </h3>
        <p
          style={{
            fontSize: 'var(--text-body-md)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-relaxed)',
          }}
        >
          {story}
        </p>
      </section>

      {/* Vibe Rules */}
      <section style={{ marginBottom: 'var(--space-large)' }}>
        <h3
          style={{
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-default)',
          }}
        >
          Vibe Rules
        </h3>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {vibeRules.map((rule, index) => (
            <li
              key={index}
              style={{
                fontSize: 'var(--text-body-md)',
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-relaxed)',
                marginBottom: 'var(--space-small)',
                paddingLeft: 'var(--space-default)',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: accentColor,
                  fontWeight: 'var(--weight-bold)',
                }}
              >
                •
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </section>

      {/* Style of the Moment */}
      {styleOfTheMoment && (
        <section style={{ marginBottom: 'var(--space-large)' }}>
          <h3
            style={{
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-default)',
            }}
          >
            Style of the Moment
          </h3>
          <div
            style={{
              padding: 'var(--space-default)',
              borderRadius: 'var(--radius-lg)',
              background: `${accentColor}10`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-body-md)',
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-relaxed)',
              }}
            >
              <strong style={{ color: accentColor }}>Try:</strong> "{styleOfTheMoment}"
            </p>
          </div>
        </section>
      )}

      {/* Safety / Respect Note */}
      <section style={{ marginBottom: 'var(--space-large)' }}>
        <div
          style={{
            padding: 'var(--space-default)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-gray-900)',
            border: '1px solid var(--color-gray-800)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-relaxed)',
            }}
          >
            {safetyNote}
          </p>
        </div>
      </section>

      {/* Report Tribe */}
      {onReportClick && (
        <section>
          <button
            onClick={onReportClick}
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-tertiary)',
              textDecoration: 'underline',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            Report tribe
          </button>
        </section>
      )}
    </div>
  );
};








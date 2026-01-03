'use client';

import React from 'react';
import { Icon } from '../common/Icon';

interface Message {
  id: string;
  type: 'user' | 'system' | 'result';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ThreadDrawerProps {
  messages: Message[];
  isOpen: boolean;
  onToggle: () => void;
}

export const ThreadDrawer: React.FC<ThreadDrawerProps> = ({
  messages,
  isOpen,
  onToggle,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 'var(--z-modal)',
            animation: 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: isOpen ? '70vh' : '0',
          background: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--color-gray-800)',
          borderBottom: 'none',
          zIndex: 'var(--z-modal)',
          transition: 'max-height var(--transition-base)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Handle */}
        <div
          onClick={onToggle}
          style={{
            padding: 'var(--space-default) 0',
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-gray-700)',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '0 var(--space-default) var(--space-default)',
            borderBottom: '1px solid var(--color-gray-800)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-body-lg)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Thread
            </h3>
            <button
              onClick={onToggle}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Icon type="close" size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--space-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-default)',
          }}
        >
          {messages.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--text-body-sm)',
                padding: 'var(--space-large)',
              }}
            >
              Your creation journey starts here
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {message.type === 'user' && (
                  <div
                    style={{
                      padding: 'var(--space-small) var(--space-default)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-off-white)',
                      color: 'var(--color-near-black)',
                      fontSize: 'var(--text-body-sm)',
                      lineHeight: 'var(--line-normal)',
                    }}
                  >
                    {message.content}
                  </div>
                )}

                {message.type === 'system' && (
                  <div
                    style={{
                      padding: 'var(--space-small) var(--space-default)',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-gray-800)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--text-body-sm)',
                      lineHeight: 'var(--line-normal)',
                      fontStyle: 'italic',
                    }}
                  >
                    {message.content}
                  </div>
                )}

                {message.type === 'result' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-small)',
                    }}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated result"
                        style={{
                          width: '100%',
                          borderRadius: 'var(--radius-md)',
                          aspectRatio: '3/4',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <p
                      style={{
                        fontSize: 'var(--text-body-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {message.content}
                    </p>
                  </div>
                )}

                <p
                  style={{
                    fontSize: 'var(--text-meta)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--space-tight)',
                    textAlign: message.type === 'user' ? 'right' : 'left',
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};








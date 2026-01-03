'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeColors = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-accent)',
  };

  const typeIcons = {
    success: 'check' as const,
    error: 'close' as const,
    info: 'sparkle' as const,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height-mobile) + var(--space-lg))',
        left: 'var(--space-lg)',
        right: 'var(--space-lg)',
        padding: 'var(--space-md) var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface-elevated)',
        border: `1px solid ${typeColors[type]}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        zIndex: 'var(--z-toast)',
        animation: isVisible ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-full)',
          background: typeColors[type],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-white)',
          flexShrink: 0,
        }}
      >
        <Icon type={typeIcons[type]} size={16} />
      </div>
      
      <p
        style={{
          flex: 1,
          fontSize: 'var(--text-base)',
          color: 'var(--color-white)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        {message}
      </p>
      
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <Icon type="close" size={16} />
      </button>
    </div>
  );
};

// Toast Manager Hook
let toastId = 0;

export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastConfig & { id: number }>>([]);

  const showToast = (config: ToastConfig) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { ...config, id }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
};








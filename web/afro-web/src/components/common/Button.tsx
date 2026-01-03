'use client';

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  disabled = false,
  style,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 'var(--weight-semibold)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-fast)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-sm)',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-white)',
      color: 'var(--color-black)',
    },
    secondary: {
      background: 'var(--color-gray-800)',
      color: 'var(--color-white)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-white)',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: 'var(--space-sm) var(--space-md)',
      fontSize: 'var(--text-sm)',
    },
    md: {
      padding: 'var(--space-md) var(--space-lg)',
      fontSize: 'var(--text-base)',
    },
    lg: {
      padding: 'var(--space-lg) var(--space-xl)',
      fontSize: 'var(--text-lg)',
    },
  };

  return (
    <button
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};








'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, hasIdentity } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → onboarding
    if (!user) {
      router.push('/onboarding');
      return;
    }

    // Authenticated but no identity → create
    if (!hasIdentity) {
      router.push('/create');
      return;
    }

    // Authenticated with identity → feed
    router.push('/feed');
  }, [user, loading, hasIdentity, router]);

  // Loading state
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface)',
      gap: 'var(--space-lg)',
    }}>
      {/* Logo/Brand */}
      <div style={{
        fontSize: 'var(--text-4xl)',
        fontWeight: 'var(--weight-bold)',
        color: 'var(--color-white)',
        textAlign: 'center',
        letterSpacing: '-0.02em',
      }}>
        AfroMoji
      </div>
      
      {/* Tagline */}
      <p style={{
        fontSize: 'var(--text-lg)',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        fontWeight: 'var(--weight-medium)',
        letterSpacing: '0.05em',
      }}>
        BECOME • BELONG • WITNESS
      </p>

      {/* Loading Indicator */}
      <div style={{
        marginTop: 'var(--space-xl)',
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-full)',
        border: '3px solid var(--color-gray-800)',
        borderTopColor: 'var(--color-white)',
        animation: 'spin 1s linear infinite',
      }} />

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}


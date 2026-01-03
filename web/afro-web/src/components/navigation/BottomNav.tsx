'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavIcon } from './NavIcon';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Determine active route
  const isActive = (path: string) => pathname?.startsWith(path);

  // Auto-hide on scroll (for immersive moments)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Hide when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Don't show nav on onboarding or post viewer
  if (pathname === '/onboarding' || pathname?.includes('/post/')) {
    return null;
  }

  return (
    <nav
      className="bottom-nav safe-bottom"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-height-mobile)',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 var(--space-lg)',
        zIndex: 'var(--z-nav)',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform var(--transition-base)',
      }}
    >
      <NavIcon
        type="feed"
        active={isActive('/feed')}
        onClick={() => router.push('/feed')}
      />
      
      <NavIcon
        type="create"
        active={isActive('/create')}
        onClick={() => router.push('/create')}
        elevated={true}
      />
      
      <NavIcon
        type="profile"
        active={isActive('/profile')}
        onClick={() => router.push('/profile')}
      />
    </nav>
  );
};


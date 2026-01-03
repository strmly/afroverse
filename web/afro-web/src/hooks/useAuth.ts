'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  getMe, 
  isAuthenticated as checkIsAuthenticated,
  clearTokens,
  type User as AuthUser
} from '../services/authService';

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  tribeId?: string; // For backward compatibility
  tribe?: {
    id: string;
    slug: string;
    name: string;
  };
  avatar?: {
    imagePath?: string;
    thumbPath?: string;
    imageUrl?: string;
    thumbUrl?: string;
  };
  counters: {
    posts: number;
    respectsReceived: number;
  };
  createdAt: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!checkIsAuthenticated()) {
          setLoading(false);
          return;
        }

        // Fetch current user from API
        const userData = await getMe();
        console.log('User data loaded:', userData);
        setUser(userData as any);
        setLoading(false);
      } catch (error: any) {
        console.error('Auth check failed:', error);
        console.error('Error response:', error.response?.status, error.response?.data);
        
        // Only clear tokens on 401 Unauthorized (invalid/expired token)
        // Don't clear on 500 or network errors
        if (error.response?.status === 401) {
          console.log('Clearing tokens due to 401');
          clearTokens();
        }
        
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Identity gating logic
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/onboarding'];
    const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

    if (isPublicPath) return;

    // No user AND no auth token → redirect to onboarding
    if (!user && !checkIsAuthenticated()) {
      router.push('/onboarding');
      return;
    }

    // If we have a token but no user yet, wait for user to load
    if (!user && checkIsAuthenticated()) {
      return; // Wait for user data to load
    }

    // User exists but no tribe → redirect to onboarding (incomplete profile)
    const hasTribe = !!(user?.tribeId || user?.tribe?.id);
    if (user && !hasTribe) {
      console.log('Redirecting to onboarding: no tribe', { user });
      router.push('/onboarding');
      return;
    }

    // User has tribe but no avatar → allow create page
    const hasAvatar = !!(user?.avatar?.imageUrl || user?.avatar?.imagePath);
    const hasIdentity = hasAvatar;
    const protectedPaths = ['/feed', '/tribe'];
    const isProtectedPath = protectedPaths.some(path => pathname?.startsWith(path));

    if (!hasIdentity && isProtectedPath) {
      console.log('Redirecting to create: no identity');
      router.push('/create');
    }
  }, [user, loading, pathname, router]);

  const refreshUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData as any);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/onboarding');
  };

  const hasTribe = !!(user?.tribeId || user?.tribe?.id);
  const hasAvatar = !!(user?.avatar?.imageUrl || user?.avatar?.imagePath);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasIdentity: hasAvatar && hasTribe,
    hasTribe,
    refreshUser,
    logout,
  };
};

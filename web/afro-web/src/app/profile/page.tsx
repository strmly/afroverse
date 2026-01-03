'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileStats } from '../../components/profile/ProfileStats';
import { ProfileGrid } from '../../components/profile/ProfileGrid';
import { IdentityViewer } from '../../components/profile/IdentityViewer';
import { EditProfileSheet } from '../../components/profile/EditProfileSheet';

interface Post {
  id: string;
  imageUrl: string;
  respectCount: number;
}

export default function ProfilePage() {
  const { user, refreshUser, loading, logout } = useAuth();
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  // Stats come from user.counters
  const stats = {
    posts: user?.counters?.posts || 0,
    respects: user?.counters?.respectsReceived || 0,
    followers: (user?.counters as any)?.followers || 0,
    following: (user?.counters as any)?.following || 0,
  };
  const [isIdentityViewerOpen, setIsIdentityViewerOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  // Set up user - now handled by useAuth hook
  useEffect(() => {
    if (!loading && !user) {
      // Redirect to onboarding if no user
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  // Fetch real posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.username) return;
      
      try {
        console.log('📸 Fetching posts for user:', user.username);
        const response = await fetch(`http://localhost:3001/api/users/${user.username}/posts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('afromoji_access_token') || sessionStorage.getItem('afromoji_access_token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Raw posts data from API:', data);
          
          // Transform backend format to frontend format
          const transformedPosts = (data.posts || []).map((post: any) => ({
            id: post.postId,
            imageUrl: post.thumbUrl,
            respectCount: post.counts?.respects || 0,
          }));
          
          console.log('✅ Transformed posts:', transformedPosts);
          setPosts(transformedPosts);
        } else {
          console.error('❌ Failed to fetch posts:', response.status);
          setPosts([]);
        }
      } catch (error) {
        console.error('❌ Error fetching posts:', error);
        setPosts([]);
      }
    };
    
    fetchPosts();
  }, [user?.username]);

  if (!user) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  const handlePostClick = (postId: string, index: number) => {
    // Store post IDs and current index in sessionStorage for navigation
    const postIds = posts.map(p => p.id);
    sessionStorage.setItem('profile_posts', JSON.stringify(postIds));
    sessionStorage.setItem('profile_post_index', index.toString());
    router.push(`/post/${postId}?from=profile`);
  };

  const handleCreateClick = () => {
    router.push('/create');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.displayName} on AfroMoji`,
        text: `Check out my AfroMoji profile`,
        url: window.location.href,
      });
    }
  };

  const handleSaveProfile = async (displayName: string, bio: string) => {
    // TODO: Call API to update profile
    // await updateProfile({ displayName, bio });
    await refreshUser();
  };

  const handleLogout = () => {
    console.log('handleLogout called in profile page');
    if (logout) {
      logout();
    } else {
      console.error('logout function not available');
    }
  };

  const hasPosts = posts.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-surface)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(var(--nav-height-mobile) + var(--space-default) + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Identity Header */}
      <ProfileHeader
        avatar={user.avatar?.thumbUrl || user.avatar?.imageUrl || ''}
        displayName={user.displayName}
        username={user.username}
        bio={user.bio}
        tribe={{
          slug: user.tribe?.slug || user.tribeId || '',
          name: user.tribe?.name || 'Tribe',
          color: '#9333EA',
          icon: '⬢',
        }}
        isSelf={true}
        onEdit={() => setIsEditSheetOpen(true)}
        onShare={handleShare}
        onCreate={handleCreateClick}
        onLogout={handleLogout}
        onAvatarTap={() => setIsIdentityViewerOpen(true)}
        onAvatarLongPress={() => {
          // Show quick menu (future enhancement)
          console.log('Long press: Change avatar');
        }}
      />

      {/* Micro-Stats */}
      <ProfileStats
        posts={stats.posts}
        respects={stats.respects}
        tribe={{
          slug: user.tribeId || '',
          name: 'Tribe Name',
        }}
        onPostsClick={() => {
          // Scroll to grid (optional)
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Content Grid */}
      <ProfileGrid
        posts={posts}
        onPostClick={handlePostClick}
        onCreateClick={handleCreateClick}
        isEmpty={!hasPosts}
      />

      {/* Identity Viewer Modal */}
      <IdentityViewer
        isOpen={isIdentityViewerOpen}
        imageUrl={user.avatar?.imageUrl || user.avatar?.thumbUrl || ''}
        tribe={{
          name: user.tribe?.name || 'Tribe',
          color: '#9333EA',
          icon: '⬢',
        }}
        isSelf={true}
        onClose={() => setIsIdentityViewerOpen(false)}
        onSetAsProfile={() => {
          // Already set, but could select from past versions (future)
          setIsIdentityViewerOpen(false);
        }}
        onShare={handleShare}
        onDownload={() => {
          // Download image (future)
          console.log('Download identity');
        }}
      />

      {/* Edit Profile Sheet */}
      <EditProfileSheet
        isOpen={isEditSheetOpen}
        displayName={user.displayName}
        bio={user.bio || ''}
        onClose={() => setIsEditSheetOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

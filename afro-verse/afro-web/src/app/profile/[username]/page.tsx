'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { ProfileStats } from '../../../components/profile/ProfileStats';
import { ProfileGrid } from '../../../components/profile/ProfileGrid';
import { IdentityViewer } from '../../../components/profile/IdentityViewer';
import { Icon } from '../../../components/common/Icon';

interface UserProfile {
  username: string;
  displayName: string;
  avatar: string;
  transformedAvatar: string;
  tribe: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  bio?: string;
  stats: {
    posts: number;
    respects: number;
  };
}

interface Post {
  id: string;
  imageUrl: string;
  respectCount: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const username = params?.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isIdentityViewerOpen, setIsIdentityViewerOpen] = useState(false);
  
  // Check if viewing own profile
  const isSelf = currentUser?.username === username;

  // Fetch real profile and posts from API
  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      
      try {
        // Fetch profile
        const profileResponse = await fetch(`http://localhost:3001/api/users/${username}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('afromoji_access_token') || sessionStorage.getItem('afromoji_access_token')}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile({
            username: profileData.username,
            displayName: profileData.displayName,
            avatar: profileData.avatar?.thumbUrl || '',
            transformedAvatar: profileData.avatar?.imageUrl || '',
            tribe: {
              slug: profileData.tribe?.slug || '',
              name: profileData.tribe?.name || '',
              color: '#9333EA',
              icon: '⬢',
            },
            bio: profileData.bio,
            stats: {
              posts: profileData.counters?.posts || 0,
              respects: profileData.counters?.respectsReceived || 0,
            },
          });
        }
        
        // Fetch posts
        console.log('📸 Fetching posts for user:', username);
        const postsResponse = await fetch(`http://localhost:3001/api/users/${username}/posts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('afromoji_access_token') || sessionStorage.getItem('afromoji_access_token')}`,
          },
        });
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          console.log('📥 Raw posts data from API:', postsData);
          
          // Transform backend format to frontend format
          const transformedPosts = (postsData.posts || []).map((post: any) => ({
            id: post.postId,
            imageUrl: post.thumbUrl,
            respectCount: post.counts?.respects || 0,
          }));
          
          console.log('✅ Transformed posts:', transformedPosts);
          setPosts(transformedPosts);
        } else {
          console.error('❌ Failed to fetch posts:', postsResponse.status);
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [username]);

  if (!profile) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
        }}
      >
        <div className="skeleton" style={{ width: '90%', height: '80%', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const handlePostClick = (postId: string, index: number) => {
    router.push(`/post/${postId}`);
  };

  const handleFollow = async () => {
    if (isSelf) {
      // Can't follow yourself
      return;
    }
    
    try {
      // TODO: Call follow/unfollow API
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName} on AfroMoji`,
        text: `Check out ${profile.displayName}'s AfroMoji profile`,
        url: window.location.href,
      });
    }
  };

  const hasPosts = posts.length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface)',
        paddingBottom: 'calc(var(--nav-height-mobile) + var(--space-default))',
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top) + var(--space-default))',
          left: 'var(--space-default)',
          width: 'var(--tap-target-min)',
          height: 'var(--tap-target-min)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-off-white)',
          cursor: 'pointer',
          zIndex: 'var(--z-elevated)',
        }}
      >
        <Icon type="back" size={20} />
      </button>

      {/* Identity Header */}
      <ProfileHeader
        avatar={profile.transformedAvatar}
        displayName={profile.displayName}
        username={profile.username}
        bio={profile.bio}
        tribe={profile.tribe}
        isSelf={isSelf}
        isFollowing={!isSelf && isFollowing}
        onFollow={!isSelf ? handleFollow : undefined}
        onShare={handleShare}
        onAvatarTap={() => setIsIdentityViewerOpen(true)}
      />

      {/* Micro-Stats */}
      <ProfileStats
        posts={profile.stats.posts}
        respects={profile.stats.respects}
        tribe={{
          slug: profile.tribe.slug,
          name: profile.tribe.name,
        }}
      />

      {/* Content Grid */}
      <ProfileGrid
        posts={posts}
        onPostClick={handlePostClick}
        isEmpty={!hasPosts}
      />

      {/* Identity Viewer Modal */}
      <IdentityViewer
        isOpen={isIdentityViewerOpen}
        imageUrl={profile.transformedAvatar}
        tribe={profile.tribe}
        isSelf={isSelf}
        onClose={() => setIsIdentityViewerOpen(false)}
      />
    </div>
  );
}

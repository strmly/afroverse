'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PostViewer } from '../../../components/post/PostViewer';

interface Post {
  id: string;
  imageUrl: string;
  user: {
    username: string;
    displayName: string;
  };
  tribe: {
    slug: string;
    name: string;
    color: string;
    icon: string;
  };
  caption?: string;
  styleTags?: string[];
  respectCount: number;
  isRespected: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [postIds, setPostIds] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Load post IDs from sessionStorage
  useEffect(() => {
    const storedPosts = sessionStorage.getItem('profile_posts');
    const storedIndex = sessionStorage.getItem('profile_post_index');
    
    if (storedPosts) {
      const ids = JSON.parse(storedPosts);
      setPostIds(ids);
      
      if (storedIndex) {
        setCurrentIndex(parseInt(storedIndex));
      } else {
        // Find current post index
        const idx = ids.findIndex((id: string) => id === postId);
        setCurrentIndex(idx >= 0 ? idx : 0);
      }
    }
  }, [postId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (postIds.length === 0) return;

      if (e.key === 'ArrowDown' && currentIndex < postIds.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextPostId = postIds[nextIndex];
        setCurrentIndex(nextIndex);
        sessionStorage.setItem('profile_post_index', nextIndex.toString());
        router.push(`/post/${nextPostId}?from=profile`);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const prevPostId = postIds[prevIndex];
        setCurrentIndex(prevIndex);
        sessionStorage.setItem('profile_post_index', prevIndex.toString());
        router.push(`/post/${prevPostId}?from=profile`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, postIds, router]);

  useEffect(() => {
    // Mock post data - replace with real API call
    const mockPost: Post = {
      id: postId,
      imageUrl: `https://picsum.photos/1080/1920?random=${postId}`,
      user: {
        username: 'kwame_king',
        displayName: 'Kwame King',
      },
      tribe: {
        slug: 'wakandan-lineage',
        name: 'Wakandan Lineage',
        color: '#9333EA',
        icon: '⬢',
      },
      caption: 'Wakandan warrior in the golden hour, celebrating ancestral wisdom',
      styleTags: ['Afrofuturism', 'GoldenHour', 'Warrior'],
      respectCount: 234,
      isRespected: false,
    };

    setPost(mockPost);
  }, [postId]);

  const handleRespect = (id: string) => {
    if (!post) return;
    
    setPost({
      ...post,
      isRespected: !post.isRespected,
      respectCount: post.isRespected ? post.respectCount - 1 : post.respectCount + 1,
    });
  };

  const handleShare = (id: string) => {
    if (!post) return;
    
    if (navigator.share) {
      navigator.share({
        title: `${post.user.displayName}'s transformation`,
        text: post.caption || 'Check out this transformation on AfroMoji',
        url: window.location.href,
      });
    }
  };

  const handleTryStyle = (id: string) => {
    if (!post) return;
    
    // Navigate to Create with context
    router.push(`/create?from=post&postId=${id}`);
  };

  const handleClose = () => {
    router.back();
  };

  const handleTribeTap = (tribeSlug: string) => {
    router.push(`/tribe/${tribeSlug}`);
  };

  const handleUserTap = (username: string) => {
    router.push(`/profile/${username}`);
  };

  // Handle swipe/scroll navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || postIds.length === 0) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && currentIndex < postIds.length - 1) {
      // Next post
      const nextIndex = currentIndex + 1;
      const nextPostId = postIds[nextIndex];
      setCurrentIndex(nextIndex);
      sessionStorage.setItem('profile_post_index', nextIndex.toString());
      router.push(`/post/${nextPostId}?from=profile`);
    } else if (isSwipeDown && currentIndex > 0) {
      // Previous post
      const prevIndex = currentIndex - 1;
      const prevPostId = postIds[prevIndex];
      setCurrentIndex(prevIndex);
      sessionStorage.setItem('profile_post_index', prevIndex.toString());
      router.push(`/post/${prevPostId}?from=profile`);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!post) {
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
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading post...</p>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <PostViewer
        isOpen={true}
        post={post}
        context="feed"
        contextLabel="Discovering"
        onClose={handleClose}
        onRespect={handleRespect}
        onShare={handleShare}
        onTryStyle={handleTryStyle}
        onTribeTap={handleTribeTap}
        onUserTap={handleUserTap}
      />

      {/* Position Indicator - Show if viewing from profile */}
      {postIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(env(safe-area-inset-top, 0px) + var(--space-small))',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 'var(--space-tight)',
            zIndex: 'var(--z-overlay)',
            pointerEvents: 'none',
          }}
        >
          {postIds.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentIndex ? '24px' : '6px',
                height: '2px',
                borderRadius: 'var(--radius-full)',
                background: index === currentIndex 
                  ? 'var(--color-off-white)' 
                  : 'rgba(248, 248, 248, 0.3)',
                transition: 'all var(--transition-micro)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

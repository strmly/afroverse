'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TribeHeader } from '../../../components/tribe/TribeHeader';
import { TribeActionBar } from '../../../components/tribe/TribeActionBar';
import { TribeTabs } from '../../../components/tribe/TribeTabs';
import { TribeFeaturedStrip } from '../../../components/tribe/TribeFeaturedStrip';
import { TribePostGrid } from '../../../components/tribe/TribePostGrid';
import { TribeMemberList } from '../../../components/tribe/TribeMemberList';
import { TribeAbout } from '../../../components/tribe/TribeAbout';
import { FloatingPostCTA } from '../../../components/tribe/FloatingPostCTA';

type TabId = 'posts' | 'members' | 'about';

interface Tribe {
  slug: string;
  name: string;
  motto: string;
  vibeDescriptor: string;
  sigil: string;
  accentColor: string;
  bannerGradient: string;
  memberCount: number;
  story: string;
  vibeRules: string[];
  styleOfTheMoment: string;
  safetyNote: string;
  isMember: boolean;
  isActiveNow: boolean;
}

interface FeaturedPost {
  id: string;
  imageUrl: string;
  username: string;
}

interface Post {
  id: string;
  imageUrl: string;
  respectCount: number;
}

interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isLeader?: boolean;
  isFollowing?: boolean;
}

export default function TribePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('posts');
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [leaders, setLeaders] = useState<Member[]>([]);
  const [newMembers, setNewMembers] = useState<Member[]>([]);

  // Handle scroll for header collapse
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load tribe data
  useEffect(() => {
    // Mock tribe data - replace with real API call
    const mockTribe: Tribe = {
      slug: slug,
      name: 'Wakandan Lineage',
      motto: 'Innovation meets tradition',
      vibeDescriptor: 'Warrior energy • Bold creations',
      sigil: '⬢',
      accentColor: '#9333EA',
      bannerGradient: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 50%, #6B21A8 100%)',
      memberCount: 12400,
      story: 'A home for bold creators rooted in ancestral innovation and Afrofuturistic vision.',
      vibeRules: [
        'Respect the culture',
        'No hate, no harassment',
        'Post your best transformations',
        'Support fellow creators',
        'Celebrate innovation and tradition',
      ],
      styleOfTheMoment: 'Royal streetwear with gold accents and purple majesty',
      safetyNote: 'This is a space for cultural celebration and creative expression. All content must respect our community guidelines and celebrate identity with pride.',
      isMember: true,
      isActiveNow: true,
    };

    const mockFeaturedPosts: FeaturedPost[] = Array.from({ length: 8 }, (_, i) => ({
      id: `featured-${i}`,
      imageUrl: `https://picsum.photos/400/560?random=${i + 100}`,
      username: `creator${i}`,
    }));

    const mockPosts: Post[] = Array.from({ length: 24 }, (_, i) => ({
      id: `post-${i}`,
      imageUrl: `https://picsum.photos/400/600?random=${i + 200}`,
      respectCount: Math.floor(Math.random() * 500),
    }));

    const mockLeaders: Member[] = [
      {
        id: '1',
        username: 'kwame_king',
        displayName: 'Kwame King',
        avatar: 'https://i.pravatar.cc/150?img=1',
        isLeader: true,
        isFollowing: true,
      },
      {
        id: '2',
        username: 'amara_soul',
        displayName: 'Amara Queen',
        avatar: 'https://i.pravatar.cc/150?img=2',
        isLeader: true,
        isFollowing: false,
      },
    ];

    const mockNewMembers: Member[] = Array.from({ length: 12 }, (_, i) => ({
      id: `${i + 3}`,
      username: `member${i + 3}`,
      displayName: `Member ${i + 3}`,
      avatar: `https://i.pravatar.cc/150?img=${i + 3}`,
      isFollowing: Math.random() > 0.5,
    }));

    setTribe(mockTribe);
    setFeaturedPosts(mockFeaturedPosts);
    setPosts(mockPosts);
    setLeaders(mockLeaders);
    setNewMembers(mockNewMembers);
  }, [slug]);

  if (!tribe) {
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
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading tribe...</p>
      </div>
    );
  }

  const handlePostClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleCreateClick = () => {
    // Pre-fill create context
    router.push(`/create?tribe=${tribe.slug}`);
  };

  const handleInviteClick = () => {
    if (navigator.share) {
      navigator.share({
        title: tribe.name,
        text: `Join ${tribe.name} on AfroMoji`,
        url: window.location.href,
      });
    }
  };

  const handleJoinClick = () => {
    // Join tribe logic
    console.log('Join tribe');
  };

  const handleFollowClick = (memberId: string) => {
    console.log('Follow member:', memberId);
  };

  const handleMemberClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  const handleRulesClick = () => {
    setActiveTab('about');
  };

  const hasPosts = posts.length > 0;

  return (
    <div
      data-tribe={tribe.slug}
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface)',
        paddingBottom: 'calc(var(--nav-height-mobile) + 80px)',
      }}
    >
      {/* Tribe Identity Header */}
      <TribeHeader
        bannerGradient={tribe.bannerGradient}
        sigil={tribe.sigil}
        name={tribe.name}
        motto={tribe.motto}
        vibeDescriptor={tribe.vibeDescriptor}
        memberCount={tribe.memberCount}
        accentColor={tribe.accentColor}
        isMember={tribe.isMember}
        isActiveNow={tribe.isActiveNow}
        onJoinClick={handleJoinClick}
        isScrolled={isScrolled}
      />

      {/* Action Bar */}
      <TribeActionBar
        accentColor={tribe.accentColor}
        onInviteClick={handleInviteClick}
        onPostClick={handleCreateClick}
        onRulesClick={handleRulesClick}
      />

      {/* Tabs */}
      <TribeTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accentColor={tribe.accentColor}
        isSticky={true}
      />

      {/* Tab Content */}
      <div>
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <>
            {/* Featured Strip */}
            <TribeFeaturedStrip
              posts={featuredPosts}
              onPostClick={handlePostClick}
              tribeBadge={tribe.sigil}
            />

            {/* Main Grid */}
            <TribePostGrid
              posts={posts}
              onPostClick={handlePostClick}
              isEmpty={!hasPosts}
              onCreateClick={handleCreateClick}
              tribeName={tribe.name}
            />
          </>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <TribeMemberList
            leaders={leaders}
            newMembers={newMembers}
            onFollowClick={handleFollowClick}
            onMemberClick={handleMemberClick}
          />
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <TribeAbout
            story={tribe.story}
            vibeRules={tribe.vibeRules}
            styleOfTheMoment={tribe.styleOfTheMoment}
            safetyNote={tribe.safetyNote}
            accentColor={tribe.accentColor}
            onReportClick={() => {
              console.log('Report tribe');
            }}
          />
        )}
      </div>

      {/* Floating CTA */}
      {tribe.isMember && (
        <FloatingPostCTA
          accentColor={tribe.accentColor}
          onClick={handleCreateClick}
          tribeName={tribe.name}
        />
      )}
    </div>
  );
}

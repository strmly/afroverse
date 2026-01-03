'use client';

import React, { useState } from 'react';

type TabId = 'posts' | 'members' | 'about';

interface Tab {
  id: TabId;
  label: string;
}

interface TribeTabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  accentColor: string;
  isSticky?: boolean;
}

export const TribeTabs: React.FC<TribeTabsProps> = ({
  activeTab,
  onTabChange,
  accentColor,
  isSticky = false,
}) => {
  const [touchStart, setTouchStart] = useState(0);

  const tabs: Tab[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'members', label: 'Members' },
    { id: 'about', label: 'About' },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchEnd - touchStart;

    // Swipe left (next tab)
    if (distance < -50) {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1].id);
      }
    }

    // Swipe right (previous tab)
    if (distance > 50) {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1].id);
      }
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? 'calc(env(safe-area-inset-top) + var(--nav-height-mobile))' : 0,
        zIndex: 'var(--z-sticky)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-gray-900)',
        display: 'flex',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              padding: 'var(--space-default)',
              fontSize: 'var(--text-body-md)',
              fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-regular)',
              color: isActive ? accentColor : 'var(--color-text-secondary)',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all var(--transition-micro)',
              position: 'relative',
              borderBottom: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};








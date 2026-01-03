'use client';

import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';

interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isLeader?: boolean;
  isFollowing?: boolean;
}

interface TribeMemberListProps {
  leaders: Member[];
  newMembers: Member[];
  onFollowClick: (memberId: string) => void;
  onMemberClick: (username: string) => void;
}

export const TribeMemberList: React.FC<TribeMemberListProps> = ({
  leaders,
  newMembers,
  onFollowClick,
  onMemberClick,
}) => {
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  const handleFollowToggle = (memberId: string) => {
    setFollowingState(prev => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
    onFollowClick(memberId);
  };

  const MemberRow: React.FC<{ member: Member }> = ({ member }) => {
    const isFollowing = followingState[member.id] ?? member.isFollowing;

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-default)',
          padding: 'var(--space-default)',
          borderBottom: '1px solid var(--color-gray-900)',
        }}
      >
        {/* Avatar */}
        <button
          onClick={() => onMemberClick(member.username)}
          style={{
            cursor: 'pointer',
            border: 'none',
            padding: 0,
            background: 'transparent',
          }}
        >
          <Avatar
            src={member.avatar}
            alt={member.displayName}
            size="md"
          />
        </button>

        {/* Info */}
        <button
          onClick={() => onMemberClick(member.username)}
          style={{
            flex: 1,
            textAlign: 'left',
            cursor: 'pointer',
            border: 'none',
            padding: 0,
            background: 'transparent',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-small)',
              marginBottom: 'var(--space-tight)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-body-md)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {member.displayName}
            </span>
            {member.isLeader && (
              <span
                style={{
                  fontSize: 'var(--text-meta)',
                  color: 'var(--color-gold)',
                  fontWeight: 'var(--weight-semibold)',
                }}
              >
                ★
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: 'var(--text-body-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            @{member.username}
          </span>
        </button>

        {/* Follow Button */}
        <button
          onClick={() => handleFollowToggle(member.id)}
          style={{
            padding: 'var(--space-small) var(--space-default)',
            borderRadius: 'var(--radius-full)',
            background: isFollowing 
              ? 'var(--color-gray-800)' 
              : 'var(--color-off-white)',
            color: isFollowing 
              ? 'var(--color-text-primary)' 
              : 'var(--color-near-black)',
            fontSize: 'var(--text-body-sm)',
            fontWeight: 'var(--weight-semibold)',
            cursor: 'pointer',
            border: isFollowing ? '1px solid var(--color-gray-700)' : 'none',
            transition: 'all var(--transition-micro)',
            minWidth: '80px',
          }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: 'var(--space-default) 0',
      }}
    >
      {/* Leaders Section */}
      {leaders.length > 0 && (
        <div style={{ marginBottom: 'var(--space-section)' }}>
          <div
            style={{
              padding: '0 var(--space-default) var(--space-default)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Leaders
            </h3>
          </div>
          {leaders.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* New Members Section */}
      {newMembers.length > 0 && (
        <div>
          <div
            style={{
              padding: '0 var(--space-default) var(--space-default)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              New Members
            </h3>
          </div>
          {newMembers.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {leaders.length === 0 && newMembers.length === 0 && (
        <div
          style={{
            padding: 'var(--space-ritual)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body-md)',
              color: 'var(--color-text-secondary)',
            }}
          >
            More members soon
          </p>
        </div>
      )}
    </div>
  );
};




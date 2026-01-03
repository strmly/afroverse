'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '../../components/common/Icon';
import { useTribes } from '../../hooks/useTribe';
import { sendOTP, verifyOTP, setTokens } from '../../services/authService';
import { joinTribe } from '../../services/tribeService';
import { updateProfile, checkUsername } from '../../services/profileService';

type Step = 'auth' | 'verify' | 'tribe' | 'profile';

export default function OnboardingPage() {
  const router = useRouter();
  const { tribes, loading: tribesLoading } = useTribes();
  
  const [step, setStep] = useState<Step>('auth');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true for convenience
  const [selectedTribeSlug, setSelectedTribeSlug] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTribe, setSelectedTribe] = useState<any>(null);

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendOTP(phoneNumber);
      
      if (!response.otpSessionId) {
        setError('Failed to receive session ID. Please try again.');
        return;
      }
      
      setOtpSessionId(response.otpSessionId);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);

    // Validate inputs before making request
    if (!otpSessionId) {
      setError('Session expired. Please request a new code.');
      setLoading(false);
      setStep('auth');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      setLoading(false);
      return;
    }

    try {
      const response = await verifyOTP(otpSessionId, otpCode);
      
      // Debug logging
      console.log('OTP Verification Response:', {
        user: response.user,
        tribeId: response.user?.tribeId,
        username: response.user?.username,
        displayName: response.user?.displayName,
      });
      
      setTokens(response.accessToken, response.refreshToken, rememberMe);
      
      // Determine next step based on user state
      const hasCompletedProfile = response.user.username && 
                                   !response.user.username.startsWith('user_') &&
                                   response.user.displayName !== 'New User';
      
      console.log('Routing decision:', {
        hasTribeId: !!response.user.tribeId,
        hasCompletedProfile,
        nextStep: !response.user.tribeId ? 'tribe' : !hasCompletedProfile ? 'profile' : 'create',
      });
      
      if (!response.user.tribeId) {
        // No tribe → go to tribe selection
        console.log('-> Going to tribe selection');
        setStep('tribe');
      } else if (!hasCompletedProfile) {
        // Has tribe but incomplete profile → go to profile setup
        console.log('-> Going to profile setup');
        setStep('profile');
      } else {
        // Has tribe and complete profile → redirect to create
        // Wait briefly to ensure tokens are persisted before redirect
        console.log('-> Redirecting to create screen');
        console.log('🔐 Tokens in storage before redirect:', {
          localStorage: {
            accessToken: localStorage.getItem('afromoji_access_token')?.substring(0, 20) + '...',
            refreshToken: localStorage.getItem('afromoji_refresh_token')?.substring(0, 20) + '...',
            rememberMe: localStorage.getItem('afromoji_remember_me'),
          },
          sessionStorage: {
            accessToken: sessionStorage.getItem('afromoji_access_token')?.substring(0, 20) + '...',
            refreshToken: sessionStorage.getItem('afromoji_refresh_token')?.substring(0, 20) + '...',
          }
        });
        
        setTimeout(() => {
          console.log('🚀 Executing redirect to /create');
          window.location.href = '/create';
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid OTP code';
      setError(errorMessage);
      
      // If session is invalid, reset to auth step
      if (err.response?.data?.error === 'invalid_session' || 
          err.response?.data?.error === 'expired') {
        setOtpSessionId('');
        setOtpCode('');
        setStep('auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTribe = async () => {
    if (!selectedTribeSlug) return;

    setLoading(true);
    setError(null);

    try {
      await joinTribe(selectedTribeSlug);
      
      // Store selected tribe info for profile preview
      const tribe = tribes.find(t => t.slug === selectedTribeSlug);
      setSelectedTribe(tribe);
      
      // After joining tribe, go to profile setup
      setStep('profile');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join tribe');
    } finally {
      setLoading(false);
    }
  };

  // Check username availability with debounce
  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);

    const trimmed = value.trim();
    if (trimmed.length < 3) {
      return;
    }

    setCheckingUsername(true);
    
    // Debounce
    setTimeout(async () => {
      try {
        const result = await checkUsername(trimmed);
        setUsernameAvailable(result.available);
        if (!result.available && result.suggestions) {
          setUsernameSuggestions(result.suggestions);
        }
      } catch (err) {
        console.error('Failed to check username:', err);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
  };

  const handleCompleteProfile = async () => {
    setLoading(true);
    setError(null);

    // Validate inputs
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      setLoading(false);
      return;
    }

    if (usernameAvailable === false) {
      setError('Username is already taken');
      setLoading(false);
      return;
    }

    if (displayName && displayName.length > 30) {
      setError('Display name must be 30 characters or less');
      setLoading(false);
      return;
    }

    if (bio.length > 120) {
      setError('Bio must be 120 characters or less');
      setLoading(false);
      return;
    }

    try {
      await updateProfile({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      
      // Show welcome message briefly
      setError(null);
      setLoading(false);
      
      // Brief transition message
      setTimeout(() => {
        router.push('/create');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: 'var(--color-surface)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {step === 'auth' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2xl)',
          textAlign: 'center',
        }}>
          {/* Logo */}
          <div style={{
            fontSize: 'var(--text-4xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-white)',
            marginBottom: 'var(--space-xl)',
            letterSpacing: '-0.02em',
          }}>
            AfroMoji
          </div>

          {/* Hero Message */}
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-white)',
            marginBottom: 'var(--space-md)',
            lineHeight: 'var(--line-tight)',
          }}>
            See Yourself.<br />
            Transform Yourself.
          </h1>

          <p style={{
            fontSize: 'var(--text-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-relaxed)',
            marginBottom: 'var(--space-3xl)',
            maxWidth: '400px',
          }}>
            AI-powered transformations rooted in African identity, culture, and belonging.
          </p>

          {/* Principles */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-3xl)',
          }}>
            {['BECOME', 'BELONG', 'WITNESS'].map((word) => (
              <div key={word} style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.1em',
              }}>
                {word}
              </div>
            ))}
          </div>

          {/* Phone Input */}
          <div style={{
            width: '100%',
            maxWidth: '400px',
            marginBottom: 'var(--space-lg)',
          }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0821234567 or +27821234567"
              style={{
                width: '100%',
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-gray-900)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-white)',
                fontSize: 'var(--text-lg)',
                textAlign: 'center',
              }}
            />
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-sm)',
              textAlign: 'center',
            }}>
              Enter your South African mobile number
            </p>
          </div>

          {/* Remember Me Checkbox */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
            cursor: 'pointer',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: 'var(--color-white)',
              }}
            />
            <span style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}>
              Keep me signed in for 30 days
            </span>
          </label>

          {error && (
            <p style={{
              color: '#EF4444',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-md)',
            }}>
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleSendOTP}
            disabled={loading || !phoneNumber}
            style={{
              padding: 'var(--space-lg) var(--space-3xl)',
              borderRadius: 'var(--radius-full)',
              background: phoneNumber ? 'var(--color-white)' : 'var(--color-gray-700)',
              color: phoneNumber ? 'var(--color-black)' : 'var(--color-gray-500)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: phoneNumber ? 'pointer' : 'not-allowed',
              transition: 'transform var(--transition-fast)',
              boxShadow: '0 8px 32px rgba(255, 255, 255, 0.1)',
              border: 'none',
              outline: 'none',
            }}
          >
            {loading ? 'Sending...' : 'Begin Your Journey'}
          </button>        </div>
      )}

      {step === 'verify' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-2xl)',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-white)',
            marginBottom: 'var(--space-md)',
          }}>
            Enter Verification Code
          </h1>

          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-3xl)',
          }}>
            We sent a code to {phoneNumber}
          </p>

          <div style={{
            width: '100%',
            maxWidth: '300px',
            marginBottom: 'var(--space-lg)',
          }}>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              style={{
                width: '100%',
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-gray-900)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-white)',
                fontSize: 'var(--text-2xl)',
                textAlign: 'center',
                letterSpacing: '0.2em',
              }}
            />
          </div>

          {error && (
            <p style={{
              color: '#EF4444',
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-md)',
            }}>
              {error}
            </p>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={loading || otpCode.length !== 6}
            style={{
              padding: 'var(--space-lg) var(--space-3xl)',
              borderRadius: 'var(--radius-full)',
              background: otpCode.length === 6 ? 'var(--color-white)' : 'var(--color-gray-700)',
              color: otpCode.length === 6 ? 'var(--color-black)' : 'var(--color-gray-500)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: otpCode.length === 6 ? 'pointer' : 'not-allowed',
              border: 'none',
              outline: 'none',
            }}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>

          <button
            onClick={() => setStep('auth')}
            style={{
              marginTop: 'var(--space-lg)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              textDecoration: 'underline',
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
              background: 'transparent',
            }}
          >
            Back
          </button>
        </div>
      )}

      {step === 'tribe' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-2xl)',
        }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'var(--space-3xl)',
          }}>
            <h1 style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-white)',
              marginBottom: 'var(--space-md)',
            }}>
              Choose Your Tribe
            </h1>
            <p style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              lineHeight: 'var(--line-relaxed)',
            }}>
              Your cultural home. Your creative family.
            </p>
          </div>

          {/* Tribe Cards */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-2xl)',
            overflowY: 'auto',
          }}>
            {tribesLoading ? (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Loading tribes...
              </div>
            ) : (
              tribes.map((tribe) => (
              <button
                key={tribe.slug}
                onClick={() => setSelectedTribeSlug(tribe.slug)}
                style={{
                  position: 'relative',
                  padding: 'var(--space-lg)',
                  borderRadius: 'var(--radius-lg)',
                  background: selectedTribeSlug === tribe.slug 
                    ? `${tribe.accentColor}20` 
                    : 'var(--color-gray-900)',
                  border: `2px solid ${
                    selectedTribeSlug === tribe.slug 
                      ? tribe.accentColor 
                      : 'var(--color-border)'
                  }`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                  outline: 'none',
                }}
              >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-md)',
                      background: `${tribe.accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-2xl)',
                      flexShrink: 0,
                      backgroundImage: `url(${tribe.iconUrl})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: 'var(--text-lg)',
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--color-white)',
                        marginBottom: 'var(--space-xs)',
                      }}>
                        {tribe.name}
                      </h3>
                      <p style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic',
                      }}>
                        {tribe.motto}
                      </p>
                    </div>

                    {/* Checkmark */}
                    {selectedTribeSlug === tribe.slug && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        background: tribe.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-white)',
                      }}>
                        <Icon type="check" size={16} />
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {error && (
            <p style={{
              color: '#EF4444',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
              marginBottom: 'var(--space-md)',
            }}>
              {error}
            </p>
          )}

          {/* Continue Button */}
          <button
            onClick={handleJoinTribe}
            disabled={!selectedTribeSlug || loading}
            style={{
              width: '100%',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-full)',
              background: selectedTribeSlug 
                ? 'var(--color-white)' 
                : 'var(--color-gray-700)',
              color: selectedTribeSlug 
                ? 'var(--color-black)' 
                : 'var(--color-gray-500)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)',
              cursor: selectedTribeSlug ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-fast)',
              border: 'none',
              outline: 'none',
            }}
          >
            {loading ? 'Joining...' : 'Continue'}
          </button>
        </div>
      )}

      {/* STEP 4: Profile Setup */}
      {step === 'profile' && (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-2xl)',
          gap: 'var(--space-2xl)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}>
            <h1 style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
            }}>
              Complete Your Profile
            </h1>
            <p style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
            }}>
              Tell us a bit about yourself
            </p>
          </div>

          {/* Form Fields */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xl)',
          }}>
            {/* Username */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}>
              <label style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-text-primary)',
              }}>
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_username"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-gray-800)',
                  border: `1px solid ${
                    usernameAvailable === true
                      ? '#10B981'
                      : usernameAvailable === false
                      ? '#EF4444'
                      : 'var(--color-gray-700)'
                  }`,
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-base)',
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                }}>
                  {username.length}/20 characters
                </p>
                {checkingUsername && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    Checking...
                  </p>
                )}
                {usernameAvailable === true && !checkingUsername && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: '#10B981',
                  }}>
                    ✓ Available
                  </p>
                )}
                {usernameAvailable === false && !checkingUsername && (
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: '#EF4444',
                  }}>
                    Already taken
                  </p>
                )}
              </div>
              {usernameSuggestions.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-xs)',
                }}>
                  <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                  }}>
                    Suggestions:
                  </p>
                  <div style={{
                    display: 'flex',
                    gap: 'var(--space-xs)',
                    flexWrap: 'wrap',
                  }}>
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleUsernameChange(suggestion)}
                        style={{
                          padding: 'var(--space-xs) var(--space-sm)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-gray-700)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--text-xs)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display Name */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}>
              <label style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-text-primary)',
              }}>
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                maxLength={30}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-gray-800)',
                  border: '1px solid var(--color-gray-700)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-base)',
                }}
              />
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
              }}>
                {displayName.length}/30 characters
              </p>
            </div>

            {/* Bio */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}>
              <label style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-text-primary)',
              }}>
                Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your story..."
                maxLength={80}
                rows={3}
                style={{
                  width: '100%',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-gray-800)',
                  border: '1px solid var(--color-gray-700)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-base)',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
              }}>
                {bio.length}/80 characters
              </p>
            </div>
          </div>

          {error && (
            <p style={{
              color: '#EF4444',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          {/* Complete Button */}
          <button
            onClick={handleCompleteProfile}
            disabled={!username.trim() || !displayName.trim() || usernameAvailable === false || loading}
            style={{
              width: '100%',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-full)',
              background: username.trim() && displayName.trim() && usernameAvailable !== false && !loading
                ? 'var(--color-white)'
                : 'var(--color-gray-700)',
              color: username.trim() && displayName.trim() && usernameAvailable !== false && !loading
                ? 'var(--color-black)'
                : 'var(--color-gray-500)',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)',
              border: 'none',
              cursor: username.trim() && displayName.trim() && usernameAvailable !== false && !loading ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-fast)',
            }}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      )}
    </div>
  );
}

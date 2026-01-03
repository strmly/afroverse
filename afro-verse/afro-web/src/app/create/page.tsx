'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '../../components/common/Icon';
import { ConversationDock } from '../../components/create/ConversationDock';
import { PromptChips } from '../../components/create/PromptChips';
import { ActionPill } from '../../components/create/ActionPill';
import { VersionStack } from '../../components/create/VersionStack';
import { ThreadDrawer } from '../../components/create/ThreadDrawer';
import { UploadSheet } from '../../components/create/UploadSheet';
import { TransformationLoader, TransformationPhase } from '../../components/create/TransformationLoader';
import { UploadProgress } from '../../components/create/UploadProgress';
import { GenerationError } from '../../components/create/GenerationError';
import { RevealMoment } from '../../components/create/RevealMoment';
import { HeroView } from '../../components/create/HeroView';
import { ActionTray } from '../../components/create/ActionTray';
import { PostingFlow } from '../../components/create/PostingFlow';
import { PostConfirmation } from '../../components/create/PostConfirmation';
import { uploadSelfie } from '../../services/uploadService';

interface Version {
  id: string;
  imageUrl: string;
  label: string;
}

interface Message {
  id: string;
  type: 'user' | 'system' | 'result';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

function CreatePageContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const styleParam = searchParams?.get('style');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // State
  const [prompt, setPrompt] = useState('');
  const [selfies, setSelfies] = useState<string[]>([]); // Stores selfie IDs
  const [selfiePreviewUrls, setSelfiePreviewUrls] = useState<Record<string, string>>({}); // Maps selfie ID to preview URL
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); // Upload progress per file
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'uploaded' | 'error'>>({}); // Status per file
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false); // Bridge state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<TransformationPhase>('preparation');
  const [generationStartTime, setGenerationStartTime] = useState<number>(0);
  const [estimatedTotalTime, setEstimatedTotalTime] = useState<number>(45000); // 45s default
  const [showError, setShowError] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  
  // Post-creation state
  const [showReveal, setShowReveal] = useState(false);
  const [showHeroView, setShowHeroView] = useState(false);
  const [showHeroUI, setShowHeroUI] = useState(false);
  const [showActionTray, setShowActionTray] = useState(false);
  const [showPostingFlow, setShowPostingFlow] = useState(false);
  const [showPostConfirmation, setShowPostConfirmation] = useState(false);
  const [currentGenerationId, setCurrentGenerationId] = useState<string>('');
  const [newPostId, setNewPostId] = useState<string>('');

  // Preset chips based on user's tribe or style param
  const presetChips = styleParam
    ? [
        { id: '1', label: styleParam, prompt: `${styleParam} style transformation` },
      ]
    : [
        { id: '1', label: 'Zulu Warrior', prompt: 'Zulu warrior with traditional beadwork and shield' },
        { id: '2', label: 'Xhosa Elder', prompt: 'Xhosa elder with ochre face paint and traditional blanket' },
        { id: '3', label: 'Ndebele Queen', prompt: 'Ndebele queen with colorful geometric beadwork' },
        { id: '4', label: 'Sotho Royal', prompt: 'Sotho royal in traditional Basotho blanket and mokorotlo hat' },
        { id: '5', label: 'Swazi Maiden', prompt: 'Swazi maiden in reed dance attire with colorful beads' },
        { id: '6', label: 'Venda Mystic', prompt: 'Venda mystic with sacred python symbols and traditional dress' },
        { id: '7', label: 'Tsonga Dancer', prompt: 'Tsonga dancer in vibrant xibelani skirt' },
        { id: '8', label: 'Pedi Chief', prompt: 'Pedi chief with leopard skin and ceremonial staff' },
        { id: '9', label: 'Tswana Noble', prompt: 'Tswana noble in traditional leather and beadwork' },
        { id: '10', label: 'Cape Malay', prompt: 'Cape Malay in colorful traditional dress with koesister patterns' },
        { id: '11', label: 'San Bushman', prompt: 'San Bushman hunter with traditional bow and ancestral markings' },
        { id: '12', label: 'Khoi Herder', prompt: 'Khoi herder with traditional kaross and copper jewelry' },
        { id: '13', label: 'Kwaito Star', prompt: 'Kwaito music star with bold South African street style' },
        { id: '14', label: 'Joburg Fashion', prompt: 'Johannesburg fashion icon with contemporary African fusion' },
        { id: '15', label: 'Durban Style', prompt: 'Durban style with coastal South African vibes' },
      ];

  // Show chips when input is empty or very short
  const showChips = prompt.length < 5 && versions.length === 0;

  // Can generate if has selfie and (prompt OR coming from Feed with style)
  const canGenerate = selfies.length > 0 && (prompt.length > 0 || !!styleParam);

  // Handle "Try This Style" entry from Feed
  useEffect(() => {
    if (styleParam) {
      setPrompt(`${styleParam} style transformation`);
    }
  }, [styleParam]);

  // Track elapsed time and update phases based on backend status
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - generationStartTime;
      
      // Phase transitions based on elapsed time
      // These are fallbacks if backend status hasn't updated yet
      if (elapsed < 5000) {
        setGenerationPhase('preparation');
      } else if (elapsed < estimatedTotalTime * 0.8) {
        setGenerationPhase('forging');
      } else if (elapsed < estimatedTotalTime) {
        setGenerationPhase('finalizing');
      } else if (elapsed >= estimatedTotalTime + 10000) {
        // If we're 10s over estimate, show delayed message
        setGenerationPhase('delayed');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, generationStartTime, estimatedTotalTime]);

  // Map backend status to frontend phase
  const mapStatusToPhase = (status: string, elapsedMs: number): TransformationPhase => {
    if (status === 'queued') {
      return 'preparation';
    } else if (status === 'running') {
      // If running for more than 80% of estimated time, show finalizing
      if (elapsedMs > estimatedTotalTime * 0.8) {
        return 'finalizing';
      }
      return 'forging';
    }
    return 'forging';
  };

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) return;

    console.log('🎨 Starting generation flow...');
    
    // Start with preparing state (bridge between upload and generation)
    setIsPreparing(true);
    setGenerationStartTime(Date.now());
    console.log('⏳ STATE 2: Preparing transformation...');
    
    // Show preparing for 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    console.log('🔥 STATE 3: Forging identity...');
    setIsPreparing(false);
    setIsGenerating(true);
    setGenerationPhase('preparation');
    setEstimatedTotalTime(45000); // 45 seconds default
    
    // Add user message to thread
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add system message
    const systemMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      content: 'Creating your transformation…',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, systemMessage]);

    try {
      // Use real API (with mock fallback for development)
      const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
      
      if (useMocks) {
        // Mock implementation with realistic timing
        // Preparation phase (5s)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Forging phase (25s)
        setGenerationPhase('forging');
        await new Promise(resolve => setTimeout(resolve, 25000));
        
        // Finalizing phase (8s)
        setGenerationPhase('finalizing');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Revealing phase
        setGenerationPhase('revealing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newVersion: Version = {
          id: Date.now().toString(),
          imageUrl: `https://picsum.photos/800/1200?random=${Date.now()}`,
          label: `V${versions.length + 1}`,
        };

        setVersions((prev) => [...prev, newVersion]);
        setActiveVersionIndex(versions.length);

        // Add result message
        const resultMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'result',
          content: 'Ready.',
          imageUrl: newVersion.imageUrl,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, resultMessage]);
      } else {
        // Real API implementation
        const { createGeneration, pollGeneration } = await import('../../services/createService');
        
        const result = await createGeneration({
          selfieIds: selfies,
          mode: styleParam ? 'try_style' : 'prompt',
          prompt,
          aspect: '9:16',
          quality: 'standard',
        });
        
        // Store generation ID for posting later
        setCurrentGenerationId(result.generationId);
        
        // Update estimated time from backend
        if (result.estimatedTimeMs) {
          setEstimatedTotalTime(result.estimatedTimeMs);
        }
        
        // Poll for completion with phase updates
        const generation = await pollGeneration(
          result.generationId,
          (gen) => {
            // Update phase based on backend status and timing
            const elapsed = gen.timing?.elapsedMs || (Date.now() - generationStartTime);
            const phase = mapStatusToPhase(gen.status, elapsed);
            setGenerationPhase(phase);
            
            // Update estimated time if backend provides it
            if (gen.timing?.estimatedTotalMs) {
              setEstimatedTotalTime(gen.timing.estimatedTotalMs);
            }
          },
          60, // maxAttempts
          2000 // 2s interval
        );
        
        // Check if generation succeeded
        if (generation.status !== 'succeeded') {
          throw new Error(generation.error?.message || 'Generation failed');
        }
        
        // Finalizing phase (brief transition)
        setGenerationPhase('finalizing');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Revealing phase
        setGenerationPhase('revealing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Add versions from generation
        console.log('Generation completed, versions:', generation.versions);
        const newVersions: Version[] = generation.versions.map((version, idx) => {
          const newVersion: Version = {
            id: version.versionId,
            imageUrl: version.imageUrl,
            label: `V${versions.length + idx + 1}`,
          };
          console.log('Adding version:', newVersion);
          return newVersion;
        });
        
        setVersions((prev) => {
          const updated = [...prev, ...newVersions];
          console.log('Updated versions:', updated);
          return updated;
        });
        
        // Set active index to the first new version
        setActiveVersionIndex(versions.length);
        
        // Add result message
        const resultMessage: Message = {
          id: Date.now().toString(),
          type: 'result',
          content: 'Ready.',
          imageUrl: generation.versions[0]?.imageUrl,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, resultMessage]);
      }

      setIsGenerating(false);

      // Show reveal moment
      setShowReveal(true);

      // Clear prompt for refinement
      setPrompt('');
    } catch (error) {
      console.error('Generation failed:', error);
      
      setLastFailedPrompt(prompt);
      setShowError(true);
      setIsGenerating(false);
    }
  };

  // Post-creation handlers
  const handleRevealComplete = () => {
    setShowReveal(false);
    setShowHeroView(true);
    
    // First-time success micro-reward
    if (isFirstGeneration) {
      setIsFirstGeneration(false);
    }
  };

  const handleHeroTap = () => {
    setShowHeroUI(true);
    setShowActionTray(true);
  };

  const handleHeroSwipeUp = () => {
    setShowActionTray(true);
  };

  const handleHeroSwipeDown = () => {
    // Dismiss back to create screen
    setShowHeroView(false);
    setShowHeroUI(false);
    setShowActionTray(false);
  };

  const handlePost = () => {
    setShowPostingFlow(true);
  };

  const handlePostFromTray = () => {
    setShowActionTray(false);
    setShowPostingFlow(true);
  };

  const handleRefine = () => {
    // Return to conversational creation with context
    setShowHeroView(false);
    setShowActionTray(false);
    setShowHeroUI(false);
  };

  const handleSaveToGallery = async () => {
    // TODO: Implement save to local gallery
    setShowActionTray(false);
    setShowHeroView(false);
    setShowHeroUI(false);
  };

  const handleUseAsBaseStyle = () => {
    // TODO: Implement base style creation
    setShowActionTray(false);
    setShowHeroView(false);
    setShowHeroUI(false);
  };

  const handleCreatePost = async (caption: string, visibility: 'tribe' | 'public') => {
    try {
      const { createPost } = await import('../../services/postService');
      
      const currentVersion = versions[activeVersionIndex];
      
      const result = await createPost({
        generationId: currentGenerationId,
        versionId: currentVersion.id,
        caption: caption || undefined,
        visibility,
      });

      setNewPostId(result.postId);
      setShowPostingFlow(false);
      setShowHeroView(false);
      setShowPostConfirmation(true);
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to post. Please try again.');
    }
  };

  const handleViewInFeed = () => {
    router.push('/feed');
  };

  const handleCreateAnother = () => {
    setShowPostConfirmation(false);
    setShowHeroView(false);
    setShowHeroUI(false);
    setShowActionTray(false);
    setVersions([]);
    setActiveVersionIndex(0);
    setPrompt('');
    setSelfies([]);
  };

  const handleRetryGeneration = () => {
    setShowError(false);
    handleGenerate();
  };

  const handleEditPromptAfterError = () => {
    setShowError(false);
    setPrompt(lastFailedPrompt);
  };

  const handleDismissError = () => {
    setShowError(false);
  };

  const handleSetAsProfile = async () => {
    if (versions.length === 0) return;
    
    try {
      const { setAvatar } = await import('../../services/profileService');
      
      const currentVersion = versions[activeVersionIndex];
      
      await setAvatar({
        generationId: currentGenerationId,
        versionId: currentVersion.id,
      });
      
      // Refresh user data to get new avatar
      await refreshUser();
      
      // Redirect to profile
      router.push('/profile');
    } catch (error) {
      console.error('Failed to set avatar:', error);
      alert('Failed to set profile picture. Please try again.');
    }
  };

  const handleChipSelect = (chipPrompt: string) => {
    setPrompt(chipPrompt);
  };

  const handleAttach = () => {
    setIsUploadOpen(true);
  };

  const handleCamera = () => {
    // Trigger camera input - the capture attribute on the input will open the camera
    console.log('📷 Opening camera...');
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleLibrary = () => {
    // Trigger file input for library selection - no capture attribute will open file picker
    console.log('📁 Opening library...');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is authenticated
    if (!user) {
      alert('Please log in to upload selfies');
      router.push('/onboarding');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      return;
    }

    console.log('🔄 Starting upload flow...');
    setIsUploading(true);
    setIsUploadOpen(false);

    // Create a temporary ID for tracking
    const tempId = `temp_${Date.now()}`;
    console.log('📤 Upload temp ID:', tempId);

    try {
      // Create a preview URL immediately for display
      const previewUrl = URL.createObjectURL(file);
      
      // Set initial upload status
      setUploadStatus(prev => ({ ...prev, [tempId]: 'uploading' }));
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));
      setSelfiePreviewUrls(prev => ({ ...prev, [tempId]: previewUrl }));
      
      // Upload the selfie with progress tracking
      const selfie = await uploadSelfie(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [tempId]: progress }));
      });

      // Update status to uploaded
      setUploadStatus(prev => ({ ...prev, [tempId]: 'uploaded' }));
      
      // Store the selfie ID for API calls
      setSelfies([selfie.id]);
      
      // Update preview URL mapping with real ID
      setSelfiePreviewUrls(prev => {
        const newUrls = { ...prev };
        newUrls[selfie.id] = previewUrl;
        delete newUrls[tempId];
        return newUrls;
      });
      
      // Clean up temp tracking
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[tempId];
        return newStatus;
      });
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[tempId];
        return newProgress;
      });
    } catch (error: any) {
      console.error('Failed to upload selfie:', error);
      
      // Mark as error
      setUploadStatus(prev => ({ ...prev, [tempId]: 'error' }));
      
      const errorMessage = error.message || 'Failed to upload selfie. Please try again.';
      alert(errorMessage);
      
      // If authentication error, redirect to onboarding
      if (error.response?.status === 401 || error.message?.includes('Authentication')) {
        router.push('/onboarding');
      }
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleRemoveSelfie = () => {
    // Clean up preview URLs
    Object.values(selfiePreviewUrls).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setSelfies([]);
    setSelfiePreviewUrls({});
  };

  const currentVersion = versions[activeVersionIndex];
  const hasResult = versions.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar - minimal, translucent */}
      <header
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-gray-800)',
          zIndex: 'var(--z-elevated)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-default)',
            width: '100%',
            maxWidth: 'var(--max-width-content)',
          }}
        >
        <button
          onClick={() => router.back()}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <Icon type="back" size={20} />
        </button>

        <h1
          style={{
            fontSize: 'var(--text-body-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Create
        </h1>

        <button
          onClick={() => setIsThreadOpen(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <Icon type="more" size={20} />
        </button>
        </div>
      </header>

      {/* Canvas Layer - dominant, flexible height */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-section) var(--space-section)',
          paddingTop: hasResult ? 'var(--space-section)' : 'var(--space-ritual)',
          paddingBottom: hasResult ? 'calc(var(--nav-height-mobile) + 220px)' : 'calc(var(--nav-height-mobile) + 280px)',
          background: hasResult && currentVersion
            ? 'var(--color-near-black)'
            : 'var(--color-surface)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {!hasResult ? (
          /* Empty State */
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-section)',
            }}
          >
            {styleParam ? (
              <>
                <p
                  style={{
                    fontSize: 'var(--text-body-md)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Recreate this look
                </p>
                <h2
                  style={{
                    fontSize: 'var(--text-display-md)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {styleParam}
                </h2>
              </>
            ) : (
              <>
                <h2
                  style={{
                    fontSize: 'var(--text-display-md)',
                    fontWeight: 'var(--weight-bold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Create your AfroMoji
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-body-md)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 'var(--line-relaxed)',
                  }}
                >
                  Describe what you want to become.
                </p>
              </>
            )}
          </div>
        ) : (
          /* Result State */
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                maxWidth: '450px',
                maxHeight: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '100%',
                  aspectRatio: '3/4',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xl)',
                  objectFit: 'contain',
                }}
              >
                <img
                  src={currentVersion.imageUrl}
                  alt="Generated transformation"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    animation: 'scaleIn 0.5s var(--ease-smooth)',
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', currentVersion.imageUrl);
                    console.error('Error event:', e);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', currentVersion.imageUrl);
                  }}
                />

                {/* Version Stack indicator */}
                <VersionStack
                  versions={versions}
                  activeIndex={activeVersionIndex}
                  onChange={setActiveVersionIndex}
                />
              </div>
            </div>
          </>
        )}

        {/* STATE 1: Upload Progress overlay - shows over both empty and result states */}
        <UploadProgress
          show={isUploading}
          isRemix={!!styleParam}
          files={Object.keys(selfiePreviewUrls).map(id => ({
            id,
            previewUrl: selfiePreviewUrls[id],
            status: uploadStatus[id] || 'uploading',
            progress: uploadProgress[id] || 0,
          }))}
          onRetry={(fileId) => {
            console.log('Retry upload:', fileId);
          }}
          onRemove={(fileId) => {
            const newUrls = { ...selfiePreviewUrls };
            delete newUrls[fileId];
            setSelfiePreviewUrls(newUrls);
            
            const newStatus = { ...uploadStatus };
            delete newStatus[fileId];
            setUploadStatus(newStatus);
          }}
        />

        {/* STATE 2-4: Transformation Loader overlay - shows over both empty and result states */}
        <TransformationLoader
          show={isPreparing || isGenerating}
          phase={isPreparing ? 'preparation' : generationPhase}
          estimatedTimeMs={estimatedTotalTime}
          elapsedTimeMs={Date.now() - generationStartTime}
          isRemix={!!styleParam}
          onRevealComplete={() => {
            setIsGenerating(false);
            setIsPreparing(false);
            setShowReveal(true);
          }}
        />

        {/* Selfie previews (if uploaded, above dock) */}
        {selfies.length > 0 && !hasResult && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: 'var(--space-default)',
              display: 'flex',
              gap: 'var(--space-small)',
              zIndex: 'var(--z-base)',
            }}
          >
            {selfies.map((selfieId, index) => (
              <div
                key={index}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  border: '2px solid var(--color-gray-700)',
                }}
              >
                <img
                  src={selfiePreviewUrls[selfieId]}
                  alt="Selfie preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Chips - contextual */}
      <PromptChips
        chips={presetChips}
        onSelect={handleChipSelect}
        show={showChips}
      />

      {/* Action Pill - conditional */}
      <ActionPill
        onPost={handlePost}
        onSetAsProfile={handleSetAsProfile}
        onShare={() => {/* Share logic */}}
        show={hasResult && !isGenerating}
      />

      {/* Conversation Dock - sits above bottom nav */}
      <div style={{ 
        position: 'fixed',
        bottom: 'var(--nav-height-mobile)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 600,
      }}>
        <div style={{ 
          width: '100%',
          maxWidth: 'var(--max-width-content)',
        }}>
          <ConversationDock
            placeholder={hasResult ? "Refine it…" : "Describe your style…"}
            value={prompt}
            onChange={setPrompt}
            onGenerate={handleGenerate}
            onAttach={handleAttach}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            selfieCount={selfies.length}
          />
        </div>
      </div>

      {/* Thread Drawer */}
      <ThreadDrawer
        messages={messages}
        isOpen={isThreadOpen}
        onToggle={() => setIsThreadOpen(!isThreadOpen)}
      />

      {/* Hidden file inputs */}
      {/* Library input - opens file picker for existing photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      {/* Camera input - opens device camera with capture attribute */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="user"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Sheet */}
      <UploadSheet
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onCamera={handleCamera}
        onLibrary={handleLibrary}
        onRemove={selfies.length > 0 ? handleRemoveSelfie : undefined}
        hasSelfies={selfies.length > 0}
      />

      {/* Generation Error Modal */}
      <GenerationError
        show={showError}
        onRetry={handleRetryGeneration}
        onEditPrompt={handleEditPromptAfterError}
        onDismiss={handleDismissError}
      />

      {/* Reveal Moment */}
      {showReveal && versions.length > 0 && (
        <RevealMoment
          imageUrl={versions[activeVersionIndex]?.imageUrl || ''}
          isFirstCreation={isFirstGeneration}
          onRevealComplete={handleRevealComplete}
        />
      )}

      {/* Hero View */}
      {showHeroView && versions.length > 0 && (
        <HeroView
          imageUrl={versions[activeVersionIndex]?.imageUrl || ''}
          onTap={handleHeroTap}
          onSwipeUp={handleHeroSwipeUp}
          onSwipeDown={handleHeroSwipeDown}
          showUI={showHeroUI}
        />
      )}

      {/* Action Tray */}
      {versions.length > 0 && (
        <ActionTray
          isOpen={showActionTray}
          onClose={() => setShowActionTray(false)}
          onPost={handlePostFromTray}
          onRefine={handleRefine}
          onSaveToGallery={handleSaveToGallery}
          onUseAsBaseStyle={handleUseAsBaseStyle}
          imageUrl={versions[activeVersionIndex]?.imageUrl || ''}
        />
      )}

      {/* Posting Flow */}
      {versions.length > 0 && (
        <PostingFlow
          isOpen={showPostingFlow}
          imageUrl={versions[activeVersionIndex]?.imageUrl || ''}
          generationId={currentGenerationId}
          versionId={versions[activeVersionIndex]?.id || ''}
          onPost={handleCreatePost}
          onCancel={() => setShowPostingFlow(false)}
        />
      )}

      {/* Post Confirmation */}
      <PostConfirmation
        show={showPostConfirmation}
        postId={newPostId}
        onViewInFeed={handleViewInFeed}
        onCreateAnother={handleCreateAnother}
      />

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
      }}>
        <div style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--color-text-secondary)',
        }}>
          Loading...
        </div>
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}

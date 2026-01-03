/**
 * AfroMoji Copy System
 * 
 * Voice: Calm, Confident, Culturally Respectful
 * Principle: Fewer words always win
 * Rule: Never explain the obvious
 * 
 * This file contains all approved copy for the application.
 * Do not add copy outside this system without review.
 */

// ============================================================================
// ONBOARDING
// ============================================================================

export const ONBOARDING = {
  // Upload Selfie
  uploadPrimary: 'This becomes your identity',
  uploadSecondary: 'Good light helps',
  
  // Auto-Transform
  transforming: 'Becoming…',
  
  // Tribe Selection
  tribeHeader: 'Choose your tribe',
  tribeConfirmation: "You're in",
} as const;

// ============================================================================
// CREATE
// ============================================================================

export const CREATE = {
  // Empty State
  header: 'Create your AfroMoji',
  subtext: 'Describe what you want to become',
  
  // Input Placeholders
  placeholderFirst: 'Describe your style…',
  placeholderRefine: 'Refine it…',
  
  // Context Hints
  recreatingContext: 'Recreating this look',
  postingToTribe: 'Posting to {tribe}',
  
  // States
  generating: 'Becoming…',
  ready: 'Ready',
  
  // Actions
  post: 'Post',
  share: 'Share',
  setProfile: 'Set as profile',
  tryAgain: 'Try again',
} as const;

// ============================================================================
// FEED
// ============================================================================

export const FEED = {
  // Soft Labels
  fromYourTribe: 'From your tribe',
  trending: 'Trending',
  discovering: 'Discovering',
  
  // Empty State
  emptyHeader: 'Your tribe awaits',
  emptyCTA: 'Create',
} as const;

// ============================================================================
// PROFILE
// ============================================================================

export const PROFILE = {
  // Empty State
  emptyHeader: 'Your journey starts here',
  emptySubtext: 'Create your first transformation',
  emptyCTA: 'Create',
  
  // Stats Labels
  posts: 'Posts',
  respects: 'Respects',
  tribe: 'Tribe',
  
  // Actions
  create: 'Create',
  share: 'Share',
  edit: 'Edit',
  follow: 'Follow',
  following: 'Following',
} as const;

// ============================================================================
// TRIBES
// ============================================================================

export const TRIBES = {
  // Empty State
  emptyHeader: 'Be the first to define the vibe',
  emptySubtext: '{tribeName} is waiting for its first post',
  emptyCTA: 'Post to Tribe',
  
  // Actions
  postToTribe: 'Post to Tribe',
  invite: 'Invite',
  joined: 'Joined',
  joinTribe: 'Join Tribe',
  
  // Section Headers
  featured: 'Featured',
  fromYourTribe: 'From Your Tribe',
  leaders: 'Leaders',
  newMembers: 'New Members',
  
  // About Tab Headers
  tribeStory: 'Tribe Story',
  vibeRules: 'Vibe Rules',
  styleOfMoment: 'Style of the Moment',
  
  // About Tab Content
  stylePrompt: 'Try: "{style}"',
  safetyNote: 'This is a space for cultural celebration and creative expression. All content must respect our community guidelines and celebrate identity with pride.',
  reportTribe: 'Report tribe',
} as const;

// ============================================================================
// POST VIEWER
// ============================================================================

export const POST_VIEWER = {
  // Context Hints
  discovering: 'Discovering',
  fromProfile: 'From @{username}',
  fromTribe: 'From {tribeName}',
  
  // Actions
  tryThisStyle: 'Try This',
  
  // Hints
  swipeToClose: 'Swipe down to close',
} as const;

// ============================================================================
// ERRORS
// ============================================================================

export const ERRORS = {
  // Generation
  generationFailed: "Couldn't create this time",
  generationFailedAction: 'Try again',
  
  // Network
  connectionLost: 'Connection lost',
  connectionLostAction: 'Retry when you're back online',
  
  // Content
  postUnavailable: 'This post is no longer available',
  imageLoadFailed: "Couldn't load this image",
  
  // Generic
  somethingWrong: 'Something went wrong',
  tryAgain: 'Try again',
  back: 'Back',
} as const;

// ============================================================================
// ACTIONS (CTAs)
// ============================================================================

export const ACTIONS = {
  // Primary
  create: 'Create',
  continue: 'Continue',
  post: 'Post',
  share: 'Share',
  
  // Secondary
  tryThisStyle: 'Try this style',
  setProfile: 'Set as profile',
  joinTribe: 'Join tribe',
  
  // Tertiary
  cancel: 'Cancel',
  close: 'Close',
  back: 'Back',
  done: 'Done',
  save: 'Save',
  
  // Edit
  edit: 'Edit',
  delete: 'Delete',
  
  // Social
  follow: 'Follow',
  following: 'Following',
  respect: 'Respect',
} as const;

// ============================================================================
// AFFIRMATIONS (Use Sparingly)
// ============================================================================

export const AFFIRMATIONS = {
  welcome: 'Welcome',
  youreIn: "You're in",
  ready: 'Ready',
  thisIsYou: 'This is you',
} as const;

// ============================================================================
// LOADING STATES
// ============================================================================

export const LOADING = {
  // Primary
  becoming: 'Becoming…',
  
  // Fallbacks (use only when necessary)
  loading: 'Loading…',
} as const;

// ============================================================================
// APPROVED VOCABULARY
// ============================================================================

/**
 * Core lexicon - use these consistently
 */
export const VOCABULARY = {
  // Identity & Creation
  become: 'Become',
  becoming: 'Becoming',
  create: 'Create',
  refine: 'Refine',
  style: 'Style',
  look: 'Look',
  identity: 'Identity',
  journey: 'Journey',
  
  // Social & Belonging
  tribe: 'Tribe',
  yourPeople: 'Your people',
  fromYourTribe: 'From your tribe',
  belong: 'Belong',
  home: 'Home',
  
  // Action & Momentum
  continue: 'Continue',
  tryThisStyle: 'Try this style',
  post: 'Post',
  share: 'Share',
  ready: 'Ready',
  
  // Affirmation
  welcome: 'Welcome',
  youreIn: "You're in",
  thisIsYou: 'This is you',
} as const;

// ============================================================================
// FORBIDDEN PHRASES
// ============================================================================

/**
 * These phrases must NEVER appear in UI copy
 * 
 * @forbidden
 */
export const FORBIDDEN = [
  'AI-powered',
  'Upload your image',
  'Click here',
  'Complete your profile',
  'Discover content',
  'Join the community',
  'Enhance your experience',
  'Personalize your account',
  'Get started',
  'Learn more',
  'See more',
  'Explore',
  'Upgrade now',
  // Technical terms
  'AI',
  'Model',
  'Processing',
  'Prompt',
  'Generating image from input',
] as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Replace template variables in copy strings
 * 
 * @example
 * replaceCopyVars('From {tribeName}', { tribeName: 'Lagos Lions' })
 * // Returns: 'From Lagos Lions'
 */
export function replaceCopyVars(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template
  );
}

/**
 * Format count with k suffix for thousands
 * 
 * @example
 * formatCount(1500) // Returns: '1.5k'
 * formatCount(999)  // Returns: '999'
 */
export function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * Validate copy against forbidden phrases
 * Development helper - logs warning if forbidden phrase found
 */
export function validateCopy(copy: string): boolean {
  const lower = copy.toLowerCase();
  const found = FORBIDDEN.find(forbidden => 
    lower.includes(forbidden.toLowerCase())
  );
  
  if (found) {
    console.warn(`❌ Forbidden phrase detected: "${found}" in "${copy}"`);
    return false;
  }
  
  return true;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CopyKey = keyof typeof VOCABULARY;
export type ActionKey = keyof typeof ACTIONS;
export type ErrorKey = keyof typeof ERRORS;








export const APP_NAME = 'Top10Game';

export const COLORS = {
  primary: '#4F46E5',
  secondary: '#8B5CF6',
  background: '#0A0A0A',
  surface: '#1C1C1E',
  card: '#1C1C1E',
  text: '#FFFFFF',
  white: '#FFFFFF',
  muted: '#8E8E93',
  accent: '#FF6B6B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  border: '#374151',
  successGlow: 'rgba(16, 185, 129, 0.3)',
  errorGlow: 'rgba(239, 68, 68, 0.3)',
  progressBg: '#1F2937',
  progressFill: '#8B5CF6'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'System',
    secondary: 'System',
    display: 'System'
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8
  }
};

// Accessibility constants
export const ACCESSIBILITY = {
  minTouchTarget: 44, // Minimum touch target size in pixels
  contrastRatio: {
    normal: 4.5, // WCAG AA standard
    large: 3.0   // WCAG AA for large text
  },
  colors: {
    // High contrast colors for better accessibility
    primary: '#4F46E5',
    primaryDark: '#3730A3',
    primaryLight: '#6366F1',
    text: '#FFFFFF',
    textSecondary: '#E5E7EB',
    textMuted: '#9CA3AF',
    background: '#0A0A0A',
    backgroundSecondary: '#1C1C1E',
    border: '#374151',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  }
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  easing: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)'
  }
};

// Fixed coin reward for completing a game (single player). Shown on game-end overlay; does not vary.
export const GAME_COMPLETION_COIN_REWARD = 50;

// ============================================
// TIMING CONSTANTS
// ============================================
export const TIMING = {
  // Milliseconds
  TIMEOUT_30_SECONDS: 30000,
  TIMEOUT_60_SECONDS: 60000,
  TURN_TIME_LIMIT: 60000,
  SESSION_DURATION_24_HOURS: 86400000,
  SESSION_DURATION_1_HOUR: 3600000,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
  LOADING_DELAY: 500,
  RECONNECT_DELAY: 5000,
  
  // Seconds
  TURN_TIME_LIMIT_SECONDS: 60,
  SESSION_TIMEOUT_SECONDS: 86400,
  RATE_LIMIT_WINDOW_SECONDS: 3600,
};

// ============================================
// RATE LIMITING CONSTANTS
// ============================================
export const RATE_LIMITS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 900000, // 15 minutes
  MAX_ROOM_JOINS_PER_HOUR: 10,
  MAX_ANSWERS_PER_MINUTE: 20,
  MAX_CUSTOM_QUESTIONS_PER_USER: 50,
};

// ============================================
// GAME CONSTANTS
// ============================================
export const GAME = {
  MAX_ANSWERS: 10,
  MIN_ANSWERS: 1,
  ROOM_CODE_LENGTH: 6,
  MAX_PLAYERS_PER_ROOM: 10,
  MIN_PLAYERS_TO_START: 2,
  MAX_QUESTION_LENGTH: 200,
  MAX_ANSWER_LENGTH: 100,
  DEFAULT_DIFFICULTY: 'medium' as const,
};

// ============================================
// VALIDATION CONSTANTS
// ============================================
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_DISPLAY_NAME_LENGTH: 1,
  MAX_DISPLAY_NAME_LENGTH: 30,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

// ============================================
// STORAGE KEYS
// ============================================
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_PROFILE: 'userProfile',
  CUSTOM_QUESTIONS: 'customQuestions',
  SELECTED_AVATAR: 'selectedAvatar',
  DISPLAY_NAME: 'displayName',
  PRIVACY_ACCEPTED: 'privacyAccepted',
  LAST_SEEN: 'lastSeen',
};

// ============================================
// FIRESTORE COLLECTION NAMES
// ============================================
export const COLLECTIONS = {
  USER_PROFILES: 'userProfiles',
  MULTIPLAYER_GAMES: 'multiplayerGames',
  SECURITY_EVENTS: 'securityEvents',
  RATE_LIMITS: 'rateLimits',
  TIME_SYNC_DOCS: 'timeSyncDocs',
  CUSTOM_QUESTIONS: 'customQuestions',
};

// ============================================
// ERROR MESSAGES
// ============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_ROOM_CODE: 'Invalid room code. Please check and try again.',
  ROOM_FULL: 'This room is full. Cannot join.',
  GAME_ALREADY_STARTED: 'This game has already started.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
};


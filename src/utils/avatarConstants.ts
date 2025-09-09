import { Avatar } from '../types';

// Avatar configuration constants
export const AVATAR_CONFIG = {
  // Avatar dimensions
  SIZE: {
    SMALL: 32,
    MEDIUM: 48,
    LARGE: 64,
    XLARGE: 80,
  },
  
  // Default avatar settings
  DEFAULT: {
    NO_AVATAR: 'no-avatar',
    FALLBACK_SIZE: 48,
  },
  
  // Asset paths
  ASSET_PATHS: {
    BASE: 'assets/avatars/',
    EXTENSION: '.png',
  },
} as const;

// Initial set of 5 avatars with visual descriptions
export const AVAILABLE_AVATARS: Avatar[] = [
  {
    id: 'human-1',
    name: 'Alex',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: 'A friendly young person with a warm smile',
  },
  {
    id: 'human-2', 
    name: 'Sam',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: 'A cheerful person with bright eyes',
  },
  {
    id: 'animal-1',
    name: 'Whiskers',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: 'A cute orange tabby cat with green eyes',
  },
  {
    id: 'animal-2',
    name: 'Buddy',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: 'A happy golden retriever with a wagging tail',
  },
  {
    id: 'animal-3',
    name: 'Wise Owl',
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    description: 'A majestic brown owl with wise golden eyes',
  },
];

// No Avatar option
export const NO_AVATAR_OPTION: Avatar = {
  id: AVATAR_CONFIG.DEFAULT.NO_AVATAR,
  name: 'No Avatar',
  url: '', // Empty URL for no avatar
  description: 'Use your initial letter instead of an avatar',
};

// All avatars including no avatar option
export const ALL_AVATAR_OPTIONS: Avatar[] = [
  NO_AVATAR_OPTION,
  ...AVAILABLE_AVATARS,
];

// Avatar selection grid configuration
export const AVATAR_GRID_CONFIG = {
  COLUMNS: 3,
  SPACING: 16,
  ITEM_SIZE: 80,
} as const;

// Get avatar size configuration
export const getAvatarSize = (size: 'small' | 'medium' | 'large' | 'xlarge'): number => {
  return AVATAR_CONFIG.SIZE[size.toUpperCase() as keyof typeof AVATAR_CONFIG.SIZE];
};

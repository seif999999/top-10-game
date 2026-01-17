import { Avatar } from '../../shared/types';
import { CHARACTER_AVATARS, CharacterAvatar } from '../assets/avatars/characters';

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

// Convert character avatars to the Avatar type format
export const AVAILABLE_AVATARS: Avatar[] = CHARACTER_AVATARS.map((char: CharacterAvatar) => ({
  id: char.id,
  name: char.name,
  url: '', // We'll use the character data instead of URLs
  description: char.description,
}));

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

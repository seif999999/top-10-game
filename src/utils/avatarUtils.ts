import { Avatar, User } from '../types';
import { AVAILABLE_AVATARS, NO_AVATAR_OPTION, AVATAR_CONFIG } from './avatarConstants';

/**
 * Get avatar by ID
 */
export const getAvatarById = (avatarId: string): Avatar | null => {
  if (avatarId === AVATAR_CONFIG.DEFAULT.NO_AVATAR) {
    return NO_AVATAR_OPTION;
  }
  
  return AVAILABLE_AVATARS.find(avatar => avatar.id === avatarId) || null;
};

/**
 * Get user's current avatar
 */
export const getUserAvatar = (user: User | null): Avatar | null => {
  if (!user?.selectedAvatar) {
    return NO_AVATAR_OPTION;
  }
  
  return getAvatarById(user.selectedAvatar);
};

/**
 * Check if user has an avatar selected
 */
export const hasUserAvatar = (user: User | null): boolean => {
  return !!(user?.selectedAvatar && user.selectedAvatar !== AVATAR_CONFIG.DEFAULT.NO_AVATAR);
};

/**
 * Get avatar display name
 */
export const getAvatarDisplayName = (avatar: Avatar | null): string => {
  return avatar?.name || 'Unknown';
};

/**
 * Get avatar URL for display
 */
export const getAvatarUrl = (avatar: Avatar | null): string | null => {
  if (!avatar || avatar.id === AVATAR_CONFIG.DEFAULT.NO_AVATAR) {
    return null;
  }
  
  return avatar.url;
};

/**
 * Generate fallback text for when avatar is not available
 */
export const getAvatarFallbackText = (user: User | null): string => {
  if (!user) return 'U';
  
  return (user.displayName || user.email || 'U').charAt(0).toUpperCase();
};

/**
 * Validate avatar ID
 */
export const isValidAvatarId = (avatarId: string): boolean => {
  if (avatarId === AVATAR_CONFIG.DEFAULT.NO_AVATAR) {
    return true;
  }
  
  return AVAILABLE_AVATARS.some(avatar => avatar.id === avatarId);
};

/**
 * Get avatar description
 */
export const getAvatarDescription = (avatar: Avatar | null): string => {
  return avatar?.description || 'No description available';
};

/**
 * Get all available avatar IDs
 */
export const getAllAvatarIds = (): string[] => {
  return [AVATAR_CONFIG.DEFAULT.NO_AVATAR, ...AVAILABLE_AVATARS.map(avatar => avatar.id)];
};

/**
 * Check if avatar is the "no avatar" option
 */
export const isNoAvatar = (avatar: Avatar | null): boolean => {
  return avatar?.id === AVATAR_CONFIG.DEFAULT.NO_AVATAR;
};

/**
 * Get avatar size configuration
 */
export const getAvatarSize = (size: 'small' | 'medium' | 'large' | 'xlarge'): number => {
  return AVATAR_CONFIG.SIZE[size.toUpperCase() as keyof typeof AVATAR_CONFIG.SIZE];
};

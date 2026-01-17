import React from 'react';
import { User } from '../../shared/types';
import AvatarDisplay from './AvatarDisplay';
import { COLORS } from '../design-system';

interface UserAvatarProps {
  user: User | null;
  size?: 'small' | 'medium' | 'large' | number;
  showBorder?: boolean;
  borderColor?: string;
  onPress?: () => void;
  style?: any;
  showLoading?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'medium',
  showBorder = true,
  borderColor = COLORS.primary,
  onPress,
  style,
  showLoading = false,
}) => {
  // Use the new DiceBear avatar system
  return (
    <AvatarDisplay
      avatarId={user?.selectedAvatar}
      size={size}
      showBorder={showBorder}
      onPress={onPress}
      style={style}
      fallbackText={user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
    />
  );
};

// Styles are now handled by AvatarDisplay component

export default UserAvatar;

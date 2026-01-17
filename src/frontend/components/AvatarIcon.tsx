import React from 'react';
import { User } from '../../shared/types';
import AvatarDisplay from './AvatarDisplay';
import { COLORS } from '../design-system';

interface AvatarIconProps {
  user: User | null;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
  onPress?: () => void;
  style?: any;
  backgroundColor?: string;
  textColor?: string;
}

const AvatarIcon: React.FC<AvatarIconProps> = ({
  user,
  size = 32,
  showBorder = false,
  borderColor = COLORS.primary,
  onPress,
  style,
  backgroundColor = COLORS.surface,
  textColor = COLORS.text,
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

export default AvatarIcon;

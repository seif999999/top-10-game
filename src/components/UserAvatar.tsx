import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';
import { User, Avatar } from '../types';
import { 
  getUserAvatar, 
  getAvatarUrl, 
  getAvatarFallbackText, 
  isNoAvatar,
  hasUserAvatar 
} from '../utils/avatarUtils';
import { getAvatarSize } from '../utils/avatarConstants';

interface UserAvatarProps {
  user: User | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const avatarSize = typeof size === 'number' ? size : getAvatarSize(size as 'small' | 'medium' | 'large' | 'xlarge');
  const avatar = getUserAvatar(user);
  const avatarUrl = getAvatarUrl(avatar);
  const fallbackText = getAvatarFallbackText(user);
  const hasAvatar = hasUserAvatar(user);


  const handleImageLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoadEnd = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const getAvatarColor = (avatarId: string) => {
    const colors = {
      'human-1': '#4078A6',
      'human-2': '#E74C3C', 
      'animal-1': '#F39C12',
      'animal-2': '#27AE60',
      'animal-3': '#8E44AD'
    };
    return colors[avatarId as keyof typeof colors] || COLORS.primary;
  };

  const renderAvatarContent = () => {
    // Show loading spinner only if explicitly requested
    if (showLoading) {
      return (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.loadingIndicator}
        />
      );
    }

    // Show colored circle avatar if available and not errored
    if (hasAvatar && !isNoAvatar(avatar) && avatar?.id) {
      const avatarColor = getAvatarColor(avatar.id);
      return (
        <View style={[
          styles.coloredAvatar,
          { 
            width: avatarSize, 
            height: avatarSize,
            backgroundColor: avatarColor
          }
        ]}>
          <Text style={[
            styles.avatarEmoji,
            { fontSize: avatarSize * 0.5 }
          ]}>
            {avatar.id.includes('human') ? '👤' : '🐾'}
          </Text>
        </View>
      );
    }

    // Show fallback text (first letter of name) - this is the default
    return (
      <View style={[
        styles.fallbackContainer,
        { width: avatarSize, height: avatarSize }
      ]}>
        <Text style={[
          styles.fallbackText,
          { fontSize: avatarSize * 0.4 }
        ]}>
          {fallbackText}
        </Text>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    showBorder && {
      borderWidth: 2,
      borderColor: borderColor,
    },
    style,
  ];

  const content = (
    <View style={containerStyle}>
      {renderAvatarContent()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    borderRadius: 0, // Will be handled by container
  },
  fallbackContainer: {
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
    textAlign: 'center',
  },
  coloredAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50, // Makes it circular
  },
  avatarEmoji: {
    textAlign: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
  },
});

export default UserAvatar;

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
import { getCharacterById } from '../assets/avatars/characters';
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

    // Show character avatar if available and not errored
    if (hasAvatar && !isNoAvatar(avatar) && avatar?.id) {
      const character = getCharacterById(avatar.id);
      if (character) {
        return (
          <View style={[
            styles.characterAvatar,
            { 
              width: avatarSize, 
              height: avatarSize,
              backgroundColor: character.backgroundColor,
              borderColor: character.color,
            }
          ]}>
            <Text style={[
              styles.characterEmoji,
              { 
                fontSize: avatarSize * 0.5,
                color: character.color
              }
            ]}>
              {character.emoji}
            </Text>
          </View>
        );
      }
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
  characterAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50, // Makes it circular
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterEmoji: {
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

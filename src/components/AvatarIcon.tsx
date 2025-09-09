import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
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
  const avatar = getUserAvatar(user);
  const avatarUrl = getAvatarUrl(avatar);
  const fallbackText = getAvatarFallbackText(user);
  const hasAvatar = hasUserAvatar(user);

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

  const renderContent = () => {
    // Show colored circle avatar if available
    if (hasAvatar && !isNoAvatar(avatar) && avatar?.id) {
      const avatarColor = getAvatarColor(avatar.id);
      return (
        <View style={[
          styles.coloredAvatar,
          { 
            width: size, 
            height: size,
            backgroundColor: avatarColor
          }
        ]}>
          <Text style={[
            styles.avatarEmoji,
            { fontSize: size * 0.5 }
          ]}>
            {avatar.id.includes('human') ? '👤' : '🐾'}
          </Text>
        </View>
      );
    }

    // Show fallback text (first letter of name)
    return (
      <View style={[
        styles.fallbackContainer,
        { 
          width: size, 
          height: size,
          backgroundColor,
        }
      ]}>
        <Text style={[
          styles.fallbackText,
          { 
            fontSize: size * 0.5,
            color: textColor,
          }
        ]}>
          {fallbackText}
        </Text>
      </View>
    );
  };

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    showBorder && {
      borderWidth: 1,
      borderColor: borderColor,
    },
    style,
  ];

  const content = (
    <View style={containerStyle}>
      {renderContent()}
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    borderRadius: 0, // Will be handled by container
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
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
});

export default AvatarIcon;

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../design-system';
import { logger } from '../../backend/utils/logger';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: 'small' | 'medium' | 'large' | number;
  showBorder?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  fallbackText?: string;
}

const AVATAR_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
};

// DiceBear avatar system with mobile-optimized PNG URLs
const getAvatarUrl = (avatarId: string): string => {
  const avatarMap: { [key: string]: string } = {
    'avatar-1': 'https://api.dicebear.com/7.x/bottts/png?seed=robot1&backgroundColor=2E86AB&size=128',
    'avatar-2': 'https://api.dicebear.com/7.x/avataaars/png?seed=person1&backgroundColor=8B5CF6&size=128',
    'avatar-3': 'https://api.dicebear.com/7.x/pixel-art/png?seed=pixel1&backgroundColor=10B981&size=128',
    'avatar-4': 'https://api.dicebear.com/7.x/pixel-art/png?seed=pixel2&backgroundColor=F97316&size=128',
    'avatar-5': 'https://api.dicebear.com/7.x/bottts/png?seed=robot2&backgroundColor=EF4444&size=128',
    'avatar-6': 'https://api.dicebear.com/7.x/avataaars/png?seed=person2&backgroundColor=8B5CF6&size=128',
    'avatar-7': 'https://api.dicebear.com/7.x/bottts/png?seed=robot3&backgroundColor=06B6D4&size=128',
    'avatar-8': 'https://api.dicebear.com/7.x/avataaars/png?seed=person3&backgroundColor=F97316&size=128',
  };
  
  return avatarMap[avatarId] || 'https://api.dicebear.com/7.x/avataaars/png?seed=default&backgroundColor=6B7280&size=128';
};

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = 'medium',
  showBorder = true,
  onPress,
  style,
  fallbackText = '👤',
}) => {
  const avatarSize = typeof size === 'number' ? size : AVATAR_SIZES[size];
  const avatarUrl = avatarId ? getAvatarUrl(avatarId) : null;

  const renderAvatar = () => {
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatarImage,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            }
          ]}
          resizeMode="contain"
          onLoad={() => {}}
          onError={(error) => {
            logger.log('DiceBear avatar error:', error.nativeEvent.error, 'URL:', avatarUrl);
          }}
        />
      );
    }

    // Fallback avatar with user initial
    return (
      <View style={[
        styles.fallbackAvatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        }
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
      borderColor: COLORS.border,
    },
    style,
  ];

  const content = (
    <View style={containerStyle}>
      {renderAvatar()}
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
    backgroundColor: COLORS.surface,
  },
  avatarImage: {
    // Styles applied inline for dynamic sizing
  },
  fallbackAvatar: {
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default AvatarDisplay;

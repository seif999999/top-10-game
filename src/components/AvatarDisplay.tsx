import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING } from '../design-system';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: 'small' | 'medium' | 'large' | number;
  showBorder?: boolean;
  onPress?: () => void;
  style?: any;
}

const AVATAR_SIZES = {
  small: 32,
  medium: 48,
  large: 64,
};

const getAvatarUrl = (avatarId: string): string => {
  // Map avatar IDs to DiceBear URLs
  const avatarMap: { [key: string]: string } = {
    'avatar-1': 'https://api.dicebear.com/7.x/bottts/svg?seed=robot1&backgroundColor=2E86AB',
    'avatar-2': 'https://api.dicebear.com/7.x/avataaars/svg?seed=person1&backgroundColor=8B5CF6',
    'avatar-3': 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel1&backgroundColor=10B981',
    'avatar-4': 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel2&backgroundColor=F97316',
    'avatar-5': 'https://api.dicebear.com/7.x/bottts/svg?seed=robot2&backgroundColor=EF4444',
    'avatar-6': 'https://api.dicebear.com/7.x/avataaars/svg?seed=person2&backgroundColor=8B5CF6',
    'avatar-7': 'https://api.dicebear.com/7.x/bottts/svg?seed=robot3&backgroundColor=06B6D4',
    'avatar-8': 'https://api.dicebear.com/7.x/avataaars/svg?seed=person3&backgroundColor=F97316',
  };
  
  return avatarMap[avatarId] || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=6B7280';
};

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = 'medium',
  showBorder = true,
  onPress,
  style,
}) => {
  const avatarSize = typeof size === 'number' ? size : AVATAR_SIZES[size];
  const avatarUrl = avatarId ? getAvatarUrl(avatarId) : null;
  
  // Debug logging
  console.log('AvatarDisplay - avatarId:', avatarId);
  console.log('AvatarDisplay - avatarUrl:', avatarUrl);

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
          onError={(error) => {
            console.log('Avatar image error:', error.nativeEvent.error);
          }}
        />
      );
    }

    // Fallback avatar
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
          👤
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

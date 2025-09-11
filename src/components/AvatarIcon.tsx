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
import { getCharacterById } from '../assets/avatars/characters';

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

  const renderContent = () => {
    // Show character avatar if available
    if (hasAvatar && !isNoAvatar(avatar) && avatar?.id) {
      const character = getCharacterById(avatar.id);
      if (character) {
        return (
          <View style={[
            styles.characterAvatar,
            { 
              width: size, 
              height: size,
              backgroundColor: character.backgroundColor,
              borderColor: character.color,
            }
          ]}>
            <Text style={[
              styles.characterEmoji,
              { 
                fontSize: size * 0.5,
                color: character.color
              }
            ]}>
              {character.emoji}
            </Text>
          </View>
        );
      }
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
});

export default AvatarIcon;

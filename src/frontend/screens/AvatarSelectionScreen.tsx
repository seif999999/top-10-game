import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../../backend/utils/logger';
import ThemedAlert from '../utils/themedAlert';

interface AvatarOption {
  id: string;
  name: string;
  url: string;
  style: string;
}

// DiceBear avatar system with mobile-optimized PNG URLs
const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'avatar-1',
    name: 'Cyber Guardian',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=robot1&backgroundColor=2E86AB&size=128',
    style: 'bottts'
  },
  {
    id: 'avatar-2',
    name: 'Mystic Sage',
    url: 'https://api.dicebear.com/7.x/avataaars/png?seed=person1&backgroundColor=8B5CF6&size=128',
    style: 'avataaars'
  },
  {
    id: 'avatar-3',
    name: 'Pixel Warrior',
    url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=pixel1&backgroundColor=10B981&size=128',
    style: 'pixel-art'
  },
  {
    id: 'avatar-4',
    name: 'Flame Master',
    url: 'https://api.dicebear.com/7.x/pixel-art/png?seed=pixel2&backgroundColor=F97316&size=128',
    style: 'pixel-art'
  },
  {
    id: 'avatar-5',
    name: 'Shield Guardian',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=robot2&backgroundColor=EF4444&size=128',
    style: 'bottts'
  },
  {
    id: 'avatar-6',
    name: 'Masked Hero',
    url: 'https://api.dicebear.com/7.x/avataaars/png?seed=person2&backgroundColor=8B5CF6&size=128',
    style: 'avataaars'
  },
  {
    id: 'avatar-7',
    name: 'Lightning Bolt',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=robot3&backgroundColor=06B6D4&size=128',
    style: 'bottts'
  },
  {
    id: 'avatar-8',
    name: 'Star Shine',
    url: 'https://api.dicebear.com/7.x/avataaars/png?seed=person3&backgroundColor=F97316&size=128',
    style: 'avataaars'
  }
];

const AvatarSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, updateUserAvatar } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.selectedAvatar || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      ThemedAlert.warning('No Selection', 'Please select an avatar before saving.');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserAvatar(selectedAvatar);
      // Automatically go back after successful save
      navigation.goBack();
    } catch (error) {
      ThemedAlert.error('Error', 'Failed to update avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderAvatarOption = (avatar: AvatarOption) => {
    const isSelected = selectedAvatar === avatar.id;
    
    return (
      <TouchableOpacity
        key={avatar.id}
        style={[
          styles.avatarOption,
          isSelected && styles.selectedAvatarOption
        ]}
        onPress={() => handleAvatarSelect(avatar.id)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.avatarContainer,
          isSelected && styles.selectedAvatarContainer
        ]}>
          <Image
            source={{ uri: avatar.url }}
            style={styles.avatarImage}
            resizeMode="contain"
            onLoad={() => {
              logger.log('Avatar selection loaded:', avatar.name, avatar.url);
            }}
            onError={(error) => {
              logger.log('Avatar selection image error:', error.nativeEvent.error, 'URL:', avatar.url);
            }}
          />
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.avatarName,
          isSelected && styles.selectedAvatarName
        ]}>
          {avatar.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Avatar</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Your Avatar</Text>
          <Text style={styles.subtitle}>
            Choose an avatar that represents you in the game
          </Text>
        </View>

        {/* Avatar Grid */}
        <View style={styles.avatarGrid}>
          {AVATAR_OPTIONS.map(renderAvatarOption)}
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedAvatar || isLoading) && styles.disabledButton
            ]}
            onPress={handleSaveAvatar}
            disabled={!selectedAvatar || isLoading}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.saveButtonText,
              (!selectedAvatar || isLoading) && styles.disabledButtonText
            ]}>
              {isLoading ? 'Saving...' : 'Save Avatar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
  },
  avatarOption: {
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.xl,
    padding: SPACING.sm,
  },
  selectedAvatarOption: {
    // Additional styling for selected option
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  selectedAvatarContainer: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  avatarName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedAvatarName: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveSection: {
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: COLORS.gray[600],
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButtonText: {
    color: COLORS.textSecondary,
  },
});

export default AvatarSelectionScreen;

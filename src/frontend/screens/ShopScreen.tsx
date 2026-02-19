import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../shared/types/navigation';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import { useAudio } from '../contexts/AudioContext';
import useAppTranslation from '../../hooks/useTranslation';
import CoinDisplay from '../components/CoinDisplay';
import { CHARACTER_AVATARS } from '../assets/avatars/characters';

type ShopScreenProps = NativeStackScreenProps<RootStackParamList, 'Shop'>;

// Placeholder items for Sound Effects, Stickers, Background Sound (expand as needed)
const SOUND_EFFECT_OPTIONS = [
  { id: 'sfx-1', emoji: '🔔', name: 'Classic', price: 50 },
  { id: 'sfx-2', emoji: '💫', name: 'Sparkle', price: 80 },
  { id: 'sfx-3', emoji: '🎯', name: 'Hit', price: 100 },
  { id: 'sfx-4', emoji: '🏆', name: 'Victory', price: 120 },
];

const STICKER_OPTIONS = [
  { id: 'sticker-1', emoji: '⭐', name: 'Star', price: 30 },
  { id: 'sticker-2', emoji: '❤️', name: 'Heart', price: 50 },
  { id: 'sticker-3', emoji: '🔥', name: 'Fire', price: 75 },
  { id: 'sticker-4', emoji: '👑', name: 'Crown', price: 100 },
];

const BACKGROUND_SOUND_OPTIONS = [
  { id: 'bg-1', emoji: '🎹', name: 'Chill', price: 150 },
  { id: 'bg-2', emoji: '🎸', name: 'Epic', price: 200 },
  { id: 'bg-3', emoji: '🌙', name: 'Lofi', price: 180 },
  { id: 'bg-4', emoji: '⚡', name: 'Upbeat', price: 170 },
];

interface ShopOptionProps {
  emoji: string;
  name: string;
  price: number;
  onPress: () => void;
}

const ShopOptionCard: React.FC<ShopOptionProps> = ({ emoji, name, price, onPress }) => (
  <TouchableOpacity style={styles.optionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.optionIcon}>
      <Text style={styles.optionEmoji}>{emoji}</Text>
    </View>
    <Text style={styles.optionName} numberOfLines={1}>{name}</Text>
    <Text style={styles.optionPrice}>🪙 {price}</Text>
  </TouchableOpacity>
);

const ShopScreen: React.FC<ShopScreenProps> = ({ navigation }) => {
  const { playButtonClick } = useAudio();
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const tShop = (key: string, opts?: Record<string, unknown>) =>
    (tScreens as (k: string, o?: Record<string, unknown>) => string)(key as never, opts);

  const handleOptionPress = () => {
    playButtonClick();
    // TODO: implement purchase logic
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0F0A1F', '#1A0F2E', '#0D0D1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            playButtonClick();
            navigation.goBack();
          }}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tShop('shop.title', { defaultValue: 'Shop' })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={styles.balanceSection}>
          <LinearGradient
            colors={['#1E1B4B', '#2D2640', '#312E81']}
            style={styles.balanceCard}
          >
            <CoinDisplay size="large" showShopButton={false} />
          </LinearGradient>
        </View>

        {/* Avatars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tShop('shop.sectionAvatars', { defaultValue: 'Avatars' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {CHARACTER_AVATARS.map((char) => (
              <ShopOptionCard
                key={char.id}
                emoji={char.emoji}
                name={char.name}
                price={100}
                onPress={handleOptionPress}
              />
            ))}
          </ScrollView>
        </View>

        {/* Sound Effects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tShop('shop.sectionSoundEffects', { defaultValue: 'Sound Effects' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {SOUND_EFFECT_OPTIONS.map((item) => (
              <ShopOptionCard key={item.id} emoji={item.emoji} name={item.name} price={item.price} onPress={handleOptionPress} />
            ))}
          </ScrollView>
        </View>

        {/* Stickers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tShop('shop.sectionStickers', { defaultValue: 'Stickers' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {STICKER_OPTIONS.map((item) => (
              <ShopOptionCard key={item.id} emoji={item.emoji} name={item.name} price={item.price} onPress={handleOptionPress} />
            ))}
          </ScrollView>
        </View>

        {/* Background Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{tShop('shop.sectionBackgroundSound', { defaultValue: 'Background Sound' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {BACKGROUND_SOUND_OPTIONS.map((item) => (
              <ShopOptionCard key={item.id} emoji={item.emoji} name={item.name} price={item.price} onPress={handleOptionPress} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
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
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['2xl'],
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  balanceCard: {
    borderRadius: 24,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING['2xl'],
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    overflow: 'hidden',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  },
  optionCard: {
    width: 88,
    backgroundColor: 'rgba(30, 27, 75, 0.6)',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionName: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: 4,
    textAlign: 'center',
  },
  optionPrice: {
    color: COLORS.primaryLight,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default ShopScreen;

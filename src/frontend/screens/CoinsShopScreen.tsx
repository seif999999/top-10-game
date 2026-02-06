import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import ThemedAlert from '../utils/themedAlert';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../shared/types/navigation';

type CoinsShopScreenProps = NativeStackScreenProps<RootStackParamList, 'CoinsShop'>;

// Safely load coin image with fallback
let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch (e) {
  // Image not found, will use emoji fallback
  coinImageSource = null;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  popular?: boolean;
  bonus?: number;
}

interface AdReward {
  id: string;
  coins: number;
  icon: string;
  description: string;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: 'small', coins: 100, price: '$0.99' },
  { id: 'medium', coins: 500, price: '$3.99', bonus: 50 },
  { id: 'large', coins: 1200, price: '$7.99', popular: true, bonus: 200 },
  { id: 'mega', coins: 3000, price: '$14.99', bonus: 700 },
];

const AD_REWARDS: AdReward[] = [
  { id: 'video', coins: 10, icon: '📺', description: 'Watch a short video' },
  { id: 'rewarded', coins: 25, icon: '🎬', description: 'Watch a rewarded ad' },
];

const CoinsShopScreen: React.FC<CoinsShopScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { playButtonClick } = useAudio();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    playButtonClick();
    navigation.goBack();
  };

  const handlePurchase = (packageItem: CoinPackage) => {
    playButtonClick();
    // TODO: Integrate with actual payment system
    ThemedAlert.info(
      'Coming Soon',
      `Purchase ${packageItem.coins} coins for ${packageItem.price}. Payment integration coming soon!`
    );
  };

  const handleWatchAd = (reward: AdReward) => {
    playButtonClick();
    // TODO: Integrate with ad network
    ThemedAlert.info(
      'Coming Soon',
      `Watch an ad to earn ${reward.coins} coins. Ad integration coming soon!`
    );
  };

  const handleRemoveAds = () => {
    playButtonClick();
    // TODO: Integrate with payment system for ad removal
    ThemedAlert.info(
      'Coming Soon',
      'Remove all ads with a one-time purchase. Payment integration coming soon!'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Coins Shop</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Current Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <View style={styles.balanceRow}>
          {coinImageSource ? (
            <Image
              source={coinImageSource}
              style={styles.coinImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.coinIcon}>🪙</Text>
          )}
          <Text style={styles.balanceAmount}>{(user?.coins ?? 0).toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Remove Ads Premium Option */}
        <TouchableOpacity
          onPress={handleRemoveAds}
          style={styles.premiumCard}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
            <View style={styles.premiumContent}>
              <View style={styles.premiumLeft}>
                <Text style={styles.premiumIcon}>🚫</Text>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Remove All Ads</Text>
                  <Text style={styles.premiumSubtitle}>Enjoy uninterrupted gameplay forever</Text>
                </View>
              </View>
              <View style={styles.premiumRight}>
                <Text style={styles.premiumPrice}>$4.99</Text>
                <View style={styles.premiumButton}>
                  <Text style={styles.premiumButtonText}>Buy Now</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Earn Free Coins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earn Free Coins</Text>
          <Text style={styles.sectionSubtitle}>Watch ads to get free coins</Text>

          {AD_REWARDS.map((reward) => (
            <TouchableOpacity
              key={reward.id}
              onPress={() => handleWatchAd(reward)}
              style={styles.adCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#2D2D3E', '#252535']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.adCardGradient}
              >
                <View style={styles.adIconContainer}>
                  <Text style={styles.adIcon}>{reward.icon}</Text>
                </View>
                <View style={styles.adInfo}>
                  <Text style={styles.adDescription}>{reward.description}</Text>
                  <View style={styles.adReward}>
                    {coinImageSource ? (
                      <Image
                        source={coinImageSource}
                        style={styles.adCoinImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.adCoinIcon}>🪙</Text>
                    )}
                    <Text style={styles.adCoins}>+{reward.coins}</Text>
                  </View>
                </View>
                <View style={styles.watchButton}>
                  <Text style={styles.watchButtonText}>Watch</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Purchase Coins Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buy Coins</Text>
          <Text style={styles.sectionSubtitle}>Get more coins to unlock features</Text>

          <View style={styles.packagesGrid}>
            {COIN_PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => handlePurchase(pkg)}
                style={styles.packageCard}
                activeOpacity={0.8}
              >
                <View style={styles.packageCardInner}>
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>POPULAR</Text>
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={['#374151', '#4B5563']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.packageGradient}
                  >
                    {coinImageSource ? (
                      <Image
                        source={coinImageSource}
                        style={styles.packageCoinImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.packageCoinIcon}>🪙</Text>
                    )}
                    <Text style={styles.packageCoins}>{pkg.coins.toLocaleString()}</Text>
                    {pkg.bonus && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>+{pkg.bonus} BONUS</Text>
                      </View>
                    )}
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                  </LinearGradient>
                  
                  <TouchableOpacity 
                    onPress={() => handlePurchase(pkg)}
                    style={styles.buyButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buyButtonText}>Buy Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Coins can be used to unlock special features, hints, and cosmetics in the game.
          </Text>
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
    paddingBottom: SPACING.sm,
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coinIcon: {
    fontSize: 32,
  },
  coinImage: {
    width: 40,
    height: 40,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  premiumCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumGradient: {
    padding: SPACING.lg,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  premiumIcon: {
    fontSize: 36,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  premiumSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  premiumRight: {
    alignItems: 'flex-end',
  },
  premiumPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  premiumButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: SPACING.lg,
  },
  adCard: {
    marginBottom: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  adCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  adIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adIcon: {
    fontSize: 24,
  },
  adInfo: {
    flex: 1,
  },
  adDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  adReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adCoinIcon: {
    fontSize: 14,
  },
  adCoinImage: {
    width: 16,
    height: 16,
  },
  adCoins: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  watchButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  packageCard: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  packageCardInner: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#2D2D3E',
  },
  packageGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 160,
  },
  popularBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: '#FCD34D',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  popularBadgeText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '800',
  },
  packageCoinIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  packageCoinImage: {
    width: 50,
    height: 50,
    marginBottom: SPACING.sm,
  },
  packageCoins: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  bonusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  bonusText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  packagePrice: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  buyButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    color: '#93C5FD',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default CoinsShopScreen;

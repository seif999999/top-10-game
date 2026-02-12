import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../shared/types/navigation';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { useAd } from '../contexts/AdContext';
import useAppTranslation from '../../hooks/useTranslation';
import CoinDisplay from '../components/CoinDisplay';
import { CoinService } from '../../backend/services/CoinService';
import CoinShopOnboarding, { hasSeenCoinShopOnboarding } from '../components/CoinShopOnboarding';
import ToastNotification from '../components/ToastNotification';

type CoinShopScreenProps = NativeStackScreenProps<RootStackParamList, 'CoinsShop'>;

/** Premium coin packages with EGP pricing */
const PURCHASE_PACKAGES: { id: string; coins: number; egp: number }[] = [
  { id: 'buy_50', coins: 50, egp: 15 },
  { id: 'buy_100', coins: 100, egp: 25 },
  { id: 'buy_150', coins: 150, egp: 35 },
  { id: 'buy_200', coins: 200, egp: 45 },
];

let coinImageSource: ReturnType<typeof require> | null = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch {
  coinImageSource = null;
}

function formatMmSs(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CoinShopScreen: React.FC<CoinShopScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { playButtonClick } = useAudio();
  const { user } = useAuth();
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const tCoin = (key: string, opts?: Record<string, unknown>) =>
    (tScreens as (k: string, o?: Record<string, unknown>) => string)(key as never, opts);
  const {
    getCoinAdCooldownRemaining,
    recordCoinAdClaim,
    loadRewardedAd,
    showRewardedAd,
    rewardedLoadState,
    adError,
    clearAdError,
    isAdReady,
    isPremium,
  } = useAd();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [cooldown25, setCooldown25] = useState(0);
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; type: 'info' | 'success'; title: string; message?: string }>({
    visible: false,
    type: 'info',
    title: '',
  });

  useEffect(() => {
    hasSeenCoinShopOnboarding().then((seen) => {
      if (!seen) setShowOnboarding(true);
    });
  }, []);

  const refreshCooldown25 = useCallback(async () => {
    const remaining = await getCoinAdCooldownRemaining('25');
    setCooldown25(remaining);
  }, [getCoinAdCooldownRemaining]);

  useEffect(() => {
    refreshCooldown25();
  }, [refreshCooldown25]);

  useEffect(() => {
    if (!isPremium && isAdReady) loadRewardedAd();
  }, [isPremium, isAdReady, loadRewardedAd]);

  useEffect(() => {
    if (cooldown25 <= 0) return;
    const interval = setInterval(refreshCooldown25, 1000);
    return () => clearInterval(interval);
  }, [cooldown25 > 0, refreshCooldown25]);

  const handleRewardEarned = useCallback(
    async () => {
      if (!user?.id) return;
      try {
        await CoinService.getInstance().addCoins(
          user.id,
          25,
          tCoin('coinShop.transactionReason', { amount: '25' })
        );
        await recordCoinAdClaim('25');
        setSuccessAmount(25);
        refreshCooldown25();
        setTimeout(() => setSuccessAmount(null), 2000);
      } catch (e) {
        console.error('CoinShopScreen: addCoins failed', e);
      }
    },
    [user?.id, recordCoinAdClaim, tCoin, refreshCooldown25]
  );

  const handleWatchVideoPress = useCallback(() => {
    if (cooldown25 > 0 || isPremium) return;
    const isLoading =
      !isAdReady ||
      rewardedLoadState === 'idle' ||
      rewardedLoadState === 'loading' ||
      isShowingAd;
    const isLoaded = rewardedLoadState === 'loaded' && !isShowingAd;
    const hasError = !!adError || rewardedLoadState === 'failed';
    if (isLoading || !isLoaded || hasError) return;
    playButtonClick();
    clearAdError();
    setIsShowingAd(true);
    const fallbackTimer = setTimeout(() => setIsShowingAd(false), 90000);
    showRewardedAd(() => {
      clearTimeout(fallbackTimer);
      setIsShowingAd(false);
      handleRewardEarned();
    });
  }, [
    cooldown25,
    isPremium,
    isAdReady,
    rewardedLoadState,
    isShowingAd,
    adError,
    clearAdError,
    showRewardedAd,
    handleRewardEarned,
    playButtonClick,
  ]);

  const adLoading =
    !isAdReady ||
    rewardedLoadState === 'idle' ||
    rewardedLoadState === 'loading' ||
    isShowingAd;
  const adReady = rewardedLoadState === 'loaded' && !isShowingAd;
  const adErrorState = !!adError || rewardedLoadState === 'failed';
  const adDisabled = cooldown25 > 0 || isPremium || adLoading || !adReady || adErrorState;

  const bottomPadding = Math.max(SPACING['2xl'], insets.bottom);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0F0A1F', '#1A0F2E', '#0D0D1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative orbs */}
      <View style={[styles.decorativeOrb, styles.orbTop]} />
      <View style={[styles.decorativeOrb, styles.orbBottom]} />

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
          {tCoin('coinShop.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance */}
        <View style={styles.balanceSection}>
          <LinearGradient
            colors={[
              COLORS.primaryAlpha(0.35),
              COLORS.primaryAlpha(0.2),
              COLORS.primaryAlpha(0.25),
            ]}
            style={styles.balanceCard}
          >
            <CoinDisplay size="large" showShopButton={false} />
          </LinearGradient>
        </View>

        {/* Intro */}
        <Text style={styles.introTitle}>{tCoin('coinShop.buyCoinsTitle', { defaultValue: 'Buy Coins' })}</Text>
        <Text style={styles.introSubtitle}>
          {tCoin('coinShop.buyCoinsSubtitle', { defaultValue: 'Get more coins to unlock avatars and power-ups' })}
        </Text>

        {/* Purchase cards - 2x2 grid (reference design) */}
        <View style={styles.offers}>
          {PURCHASE_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.purchaseCard, pkg.coins >= 200 && styles.purchaseCardFeatured]}
              activeOpacity={0.85}
              onPress={() => {
                playButtonClick();
                setToast({
                  visible: true,
                  type: 'info',
                  title: tCoin('coinShop.premiumPurchases'),
                });
              }}
            >
              <LinearGradient
                colors={[
                  COLORS.primaryAlpha(0.35),
                  COLORS.primaryAlpha(0.2),
                  COLORS.primaryAlpha(0.25),
                ]}
                style={styles.purchaseCardGradient}
              >
                <Text style={styles.purchaseCoinsAmount}>{pkg.coins} COINS</Text>
                <View style={styles.purchaseCoinRow}>
                  {coinImageSource ? (
                    <Image source={coinImageSource} style={styles.purchaseCoinIcon} resizeMode="contain" />
                  ) : (
                    <Text style={styles.purchaseCoinEmoji}>🪙</Text>
                  )}
                </View>
                <View style={styles.purchaseButtonWrap}>
                  <LinearGradient
                    colors={[COLORS.warning, COLORS.warningDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.purchaseButton}
                  >
                    <Text style={styles.purchaseButtonText}>{pkg.egp} EGP</Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Watch video for 25 coins - clean card design */}
        <View style={styles.watchVideoSection}>
          <View style={styles.watchVideoCard}>
            <LinearGradient
              colors={[
                COLORS.successAlpha(0.2),
                COLORS.successAlpha(0.08),
                COLORS.successAlpha(0.15),
              ]}
              style={styles.watchVideoCardGradient}
            >
              <Text style={styles.watchVideoLabel}>+25 COINS</Text>
              <View style={styles.watchVideoCoinRow}>
                {coinImageSource ? (
                  <Image source={coinImageSource} style={styles.watchVideoCoinIcon} resizeMode="contain" />
                ) : (
                  <Text style={styles.purchaseCoinEmoji}>🪙</Text>
                )}
              </View>
              <Text style={styles.watchVideoSubtext}>
                {tCoin('coinShop.watchVideoToEarn', { defaultValue: 'Watch a short video' })}
              </Text>
              <TouchableOpacity
                style={[
                  styles.watchVideoButton,
                  adDisabled && styles.watchVideoButtonDisabled,
                ]}
                onPress={adErrorState ? () => { clearAdError(); loadRewardedAd(); } : handleWatchVideoPress}
                disabled={adDisabled && !adErrorState}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    adErrorState
                      ? [COLORS.warning, COLORS.warningDark]
                      : adDisabled
                        ? [COLORS.gray[600], COLORS.gray[700]]
                        : [COLORS.success, COLORS.successDark]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.watchVideoButtonGradient}
                >
                  {adLoading ? (
                    <View style={styles.watchVideoButtonContent}>
                      <Text style={styles.watchVideoButtonText}>
                        {tCoin('coinShop.watchVideoPreparing', { defaultValue: 'Preparing...' })}
                      </Text>
                      <ActivityIndicator color={COLORS.white} size="small" />
                    </View>
                  ) : adErrorState ? (
                    <Text style={styles.watchVideoButtonText}>
                      {tCoin('coinShop.watchVideoRetry', { defaultValue: 'Tap to retry' })}
                    </Text>
                  ) : cooldown25 > 0 ? (
                    <Text style={styles.watchVideoButtonText}>
                      {tCoin('coinShop.watchVideoAvailableIn', {
                        time: formatMmSs(cooldown25),
                        defaultValue: `Available in ${formatMmSs(cooldown25)}`,
                      })}
                    </Text>
                  ) : isPremium ? (
                    <Text style={styles.watchVideoButtonText}>
                      {tCoin('coinShop.watchVideoUnavailable', { defaultValue: 'Unavailable' })}
                    </Text>
                  ) : (
                    <View style={styles.watchVideoButtonContent}>
                      <Text style={styles.watchVideoPlayIcon}>▶</Text>
                      <Text style={styles.watchVideoButtonText}>
                        {tCoin('coinShop.watchVideoFree', { defaultValue: 'Watch Video • Free' })}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {successAmount != null && (
          <View style={styles.successBadge}>
            <Text style={styles.successText}>
              {tCoin('coinShop.coinsEarned', { count: successAmount })}
            </Text>
          </View>
        )}
      </ScrollView>

      <CoinShopOnboarding visible={showOnboarding} onDismiss={() => setShowOnboarding(false)} />
      <ToastNotification
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1F',
  },
  decorativeOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  orbTop: {
    top: -100,
    right: -100,
    backgroundColor: '#8B5CF6',
  },
  orbBottom: {
    bottom: -150,
    left: -100,
    backgroundColor: '#F59E0B',
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
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
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
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  introTitle: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  introSubtitle: {
    color: '#9CA3AF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  offers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  purchaseCard: {
    width: '47%',
    minWidth: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  purchaseCardFeatured: {
    borderColor: COLORS.primaryLight,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
    }),
  },
  purchaseCardGradient: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  purchaseCoinsAmount: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
    zIndex: 1,
  },
  purchaseCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    zIndex: 1,
  },
  purchaseCoinIcon: {
    width: 56,
    height: 56,
  },
  purchaseCoinEmoji: {
    fontSize: 48,
  },
  purchaseButtonWrap: {
    width: '100%',
    zIndex: 1,
  },
  purchaseButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  watchVideoSection: {
    marginTop: SPACING['2xl'],
  },
  watchVideoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  watchVideoCardGradient: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  watchVideoLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  watchVideoCoinRow: {
    marginBottom: SPACING.sm,
  },
  watchVideoCoinIcon: {
    width: 48,
    height: 48,
  },
  watchVideoSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  watchVideoButton: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  watchVideoButtonDisabled: {
    opacity: 0.9,
  },
  watchVideoButtonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchVideoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  watchVideoButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  watchVideoPlayIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  successBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 16,
    marginTop: SPACING.xl,
  },
  successText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});

export default CoinShopScreen;

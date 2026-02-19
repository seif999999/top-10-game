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
import CoinShopOnboarding, { hasSeenCoinShopOnboarding } from '../components/CoinShopOnboarding';
import ToastNotification from '../components/ToastNotification';
import ThemedAlert from '../utils/themedAlert';
import IAPService, { type PremiumSubscriptionType } from '../../backend/services/IAPService';

type CoinShopScreenProps = NativeStackScreenProps<RootStackParamList, 'CoinsShop'>;

/** Premium coin packages with EGP pricing (70/30 economy) - .9 charm pricing */
const PURCHASE_PACKAGES: {
  id: string;
  coins: number;
  price: number;
  popular: boolean;
  savings: string;
  description: string;
}[] = [
  { id: 'starter', coins: 600, price: 29.9, popular: false, savings: '0%', description: 'Perfect for unlocking your first slots' },
  { id: 'value', coins: 1800, price: 79.9, popular: true, savings: '11%', description: 'Most popular choice' },
  { id: 'premium', coins: 3500, price: 149.9, popular: false, savings: '17%', description: 'Unlock most of your slots' },
  { id: 'ultimate', coins: 6000, price: 249.9, popular: false, savings: '20%', description: 'Unlock everything + bonus coins' },
];

let coinImageSource: ReturnType<typeof require> | null = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch {
  coinImageSource = null;
}

/** Format EGP price with .9 charm pricing (e.g. 59.9, 149.9) */
function formatEgpPrice(price: number): string {
  return price.toFixed(1);
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0';
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds >= 60) {
    const m = Math.floor(totalSeconds / 60);
    return `${m} minute${m !== 1 ? 's' : ''}`;
  }
  return `${totalSeconds} second${totalSeconds !== 1 ? 's' : ''}`;
}

/** Option 1: Subscription model - .9 charm pricing on EGP */
const REMOVE_ADS_PACKAGES: {
  id: PremiumSubscriptionType;
  price: number;
  discount?: string;
  subtitleKey: string;
  popular: boolean;
}[] = [
  { id: 'monthly', price: 59.9, subtitleKey: 'playUninterrupted', popular: false },
  { id: 'quarterly', price: 149.9, discount: '17%', subtitleKey: 'popularChoice', popular: false },
  { id: 'yearly', price: 499.9, discount: '33%', subtitleKey: 'smartestDeal', popular: true },
];

const CoinShopScreen: React.FC<CoinShopScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { playButtonClick } = useAudio();
  const { user, getUserProfileWithAvatar } = useAuth();
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const { t: tCommon } = useAppTranslation('common');
  const tCoin = (key: string, opts?: Record<string, unknown>) =>
    (tScreens as (k: string, o?: Record<string, unknown>) => string)(key as never, opts);
  const {
    loadRewardedAd,
    showProgressiveRewardedAd,
    getProgressiveAdInfo,
    getTimeUntilReset,
    rewardedLoadState,
    adError,
    clearAdError,
    isAdReady,
    isPremium,
    setPremium,
  } = useAd();

  const [purchasingAdFree, setPurchasingAdFree] = useState<PremiumSubscriptionType | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [progressiveInfo, setProgressiveInfo] = useState<{
    adsWatchedThisHour: number;
    nextAdCoins: number;
    maxReached: boolean;
    timeUntilResetMs: number;
  }>({ adsWatchedThisHour: 0, nextAdCoins: 10, maxReached: false, timeUntilResetMs: 0 });
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

  const refreshProgressiveInfo = useCallback(async () => {
    const info = await getProgressiveAdInfo();
    setProgressiveInfo(info);
  }, [getProgressiveAdInfo]);

  useEffect(() => {
    refreshProgressiveInfo();
  }, [refreshProgressiveInfo]);

  useEffect(() => {
    if (!isPremium && isAdReady) loadRewardedAd();
  }, [isPremium, isAdReady, loadRewardedAd]);

  // Countdown timer when maxed
  useEffect(() => {
    if (!progressiveInfo.maxReached || progressiveInfo.timeUntilResetMs <= 0) return;
    const interval = setInterval(() => {
      setProgressiveInfo((prev) => {
        const next = Math.max(0, prev.timeUntilResetMs - 1000);
        if (next <= 0) setTimeout(() => refreshProgressiveInfo(), 0);
        return { ...prev, timeUntilResetMs: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [progressiveInfo.maxReached, refreshProgressiveInfo]);

  const handleProgressiveAdSuccess = useCallback(
    (coinsEarned: number) => {
      setSuccessAmount(coinsEarned);
      refreshProgressiveInfo();
      setTimeout(() => setSuccessAmount(null), 2000);
    },
    [refreshProgressiveInfo]
  );

  const handleWatchProgressiveAd = useCallback(() => {
    if (progressiveInfo.maxReached || isPremium) return;
    const adLoading =
      !isAdReady ||
      rewardedLoadState === 'idle' ||
      rewardedLoadState === 'loading' ||
      isShowingAd;
    const adReady = rewardedLoadState === 'loaded' && !isShowingAd;
    const adErrorState = !!adError || rewardedLoadState === 'failed';
    if (adLoading || !adReady || adErrorState) return;
    playButtonClick();
    clearAdError();
    setIsShowingAd(true);
    const fallbackTimer = setTimeout(() => setIsShowingAd(false), 90000);
    showProgressiveRewardedAd((coins) => {
      clearTimeout(fallbackTimer);
      setIsShowingAd(false);
      handleProgressiveAdSuccess(coins);
    });
  }, [
    progressiveInfo.maxReached,
    isPremium,
    isAdReady,
    rewardedLoadState,
    isShowingAd,
    adError,
    clearAdError,
    showProgressiveRewardedAd,
    handleProgressiveAdSuccess,
    playButtonClick,
  ]);

  const handleRemoveAdsPurchase = useCallback(
    (type: PremiumSubscriptionType) => {
      playButtonClick();
      if (!user?.id) {
        setToast({ visible: true, type: 'info', title: tCoin('coinShop.removeAds.subscription.signInRequired') });
        return;
      }
      const pkg = REMOVE_ADS_PACKAGES.find((p) => p.id === type);
      if (!pkg) return;
      const periodKey = type === 'monthly' ? 'month' : type === 'quarterly' ? 'quarter' : 'year';
      ThemedAlert.alert(
        tCoin('coinShop.removeAds.subscription.confirmTitle'),
        tCoin('coinShop.removeAds.subscription.confirmMessage', {
          price: formatEgpPrice(pkg.price),
          period: tCoin(`coinShop.removeAds.subscription.${periodKey}`),
          defaultValue: `Subscribe for ${formatEgpPrice(pkg.price)} EGP per ${periodKey}? You'll get +500 bonus coins and 2× daily rewards.`,
        }),
        [
          { text: tCommon('cancel'), style: 'cancel', onPress: () => {} },
          {
            text: tCommon('confirm'),
            onPress: async () => {
              setPurchasingAdFree(type);
              try {
                const result = await IAPService.purchaseSubscription(user.id, type);
                if (result.success) {
                  setPremium(true);
                  await getUserProfileWithAvatar?.();
                  setToast({
                    visible: true,
                    type: 'success',
                    title: tCoin('coinShop.removeAds.subscription.successTitle'),
                    message: tCoin('coinShop.removeAds.subscription.successMessage'),
                  });
                } else {
                  setToast({
                    visible: true,
                    type: 'info',
                    title: tCommon('error'),
                    message: result.error || tCoin('coinShop.removeAds.subscription.errorMessage'),
                  });
                }
              } catch (e) {
                setToast({
                  visible: true,
                  type: 'info',
                  title: tCommon('error'),
                  message: tCoin('coinShop.removeAds.subscription.errorMessage'),
                });
              } finally {
                setPurchasingAdFree(null);
              }
            },
          },
        ]
      );
    },
    [user?.id, playButtonClick, tCoin, tCommon, setPremium, getUserProfileWithAvatar]
  );

  const adLoading =
    !isAdReady ||
    rewardedLoadState === 'idle' ||
    rewardedLoadState === 'loading' ||
    isShowingAd;
  const adReady = rewardedLoadState === 'loaded' && !isShowingAd;
  const adErrorState = !!adError || rewardedLoadState === 'failed';
  const adDisabled =
    progressiveInfo.maxReached || isPremium || adLoading || !adReady || adErrorState;

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
            colors={['#1E1B4B', '#2D2640', '#312E81']}
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

        {/* Progressive Ads - Watch Ads for Coins */}
        <View style={styles.watchVideoSection}>
          <View style={styles.watchVideoCard}>
            <LinearGradient
              colors={['#064E3B', '#065F46', '#047857']}
              style={styles.watchVideoCardGradient}
            >
              <Text style={styles.watchVideoLabel}>
                {tCoin('coinShop.progressiveAd.title', { defaultValue: 'Watch Ads for Coins' })}
              </Text>
              <View style={styles.cycleCounterRow}>
                <Text style={styles.cycleCounter}>
                  {tCoin('coinShop.progressiveAd.cycleCounter', {
                    current: progressiveInfo.adsWatchedThisHour,
                    total: 5,
                    defaultValue: `${progressiveInfo.adsWatchedThisHour}/5`,
                  })}
                </Text>
                <Text style={styles.watchVideoSubtext}>
                  {tCoin('coinShop.progressiveAd.completeAllReward', {
                    total: 100,
                    defaultValue: 'Complete all 5 rounds to get 100 coins',
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.watchVideoButton,
                  adDisabled && styles.watchVideoButtonDisabled,
                ]}
                onPress={adErrorState ? () => { clearAdError(); loadRewardedAd(); } : handleWatchProgressiveAd}
                disabled={adDisabled && !adErrorState}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.watchVideoButtonGradient,
                    adErrorState && styles.watchVideoButtonRetry,
                    adDisabled && !adErrorState && styles.watchVideoButtonDisabledBg,
                    !adErrorState && !adDisabled && styles.watchVideoButtonSuccess,
                  ]}
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
                  ) : progressiveInfo.maxReached ? (
                    <View>
                      <Text style={styles.watchVideoButtonText}>
                        {tCoin('coinShop.progressiveAd.maxReached', { defaultValue: 'Max Reached' })}
                      </Text>
                      <Text style={styles.watchVideoButtonSubtext}>
                        {tCoin('coinShop.progressiveAd.resetsIn', {
                          time: formatCountdown(progressiveInfo.timeUntilResetMs),
                          defaultValue: `Resets in: ${formatCountdown(progressiveInfo.timeUntilResetMs)}`,
                        })}
                      </Text>
                    </View>
                  ) : isPremium ? (
                    <Text style={styles.watchVideoButtonText}>
                      {tCoin('coinShop.watchVideoUnavailable', { defaultValue: 'Unavailable' })}
                    </Text>
                  ) : (
                    <View style={styles.watchVideoButtonContent}>
                      <Text style={styles.watchVideoPlayIcon}>▶</Text>
                      <Text style={styles.watchVideoButtonText}>
                        {tCoin('coinShop.progressiveAd.watchButton', {
                          coins: progressiveInfo.nextAdCoins,
                          defaultValue: `Watch Ad for ${progressiveInfo.nextAdCoins} Coins`,
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              {!progressiveInfo.maxReached && progressiveInfo.adsWatchedThisHour < 5 && (
                <Text style={styles.progressiveHint}>
                  {progressiveInfo.adsWatchedThisHour < 4
                    ? tCoin('coinShop.progressiveAd.nextReward', {
                        coins: [15, 20, 25, 30][progressiveInfo.adsWatchedThisHour] ?? 15,
                        defaultValue: `Next: ${[15, 20, 25, 30][progressiveInfo.adsWatchedThisHour] ?? 15} coins`,
                      })
                    : tCoin('coinShop.progressiveAd.finalReward', {
                        coins: 30,
                        defaultValue: 'Final: 30 coins',
                      })}
                </Text>
              )}
              {progressiveInfo.maxReached && (
                <Text style={styles.progressiveHint}>
                  {tCoin('coinShop.progressiveAd.hourlyMax', {
                    defaultValue: 'You can earn up to 100 coins per hour!',
                  })}
                </Text>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Remove Ads - Subscription options (compact horizontal) */}
        <View style={styles.removeAdsSection}>
          <Text style={styles.removeAdsLabel}>{tCoin('coinShop.removeAds.title')}</Text>
          {isPremium || user?.adFree ? (
            <View style={styles.removeAdsOwnedRow}>
              <Text style={styles.removeAdsOwnedText}>{tCoin('coinShop.removeAds.alreadyOwned')}</Text>
            </View>
          ) : (
            <View style={styles.removeAdsCardsColumn}>
              {REMOVE_ADS_PACKAGES.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.removeAdsCard, pkg.popular && styles.removeAdsCardPopular]}
                  onPress={() => handleRemoveAdsPurchase(pkg.id)}
                  disabled={!!purchasingAdFree}
                  activeOpacity={0.85}
                >
                  {pkg.popular && pkg.discount && (
                    <View style={styles.removeAdsSaveBadge}>
                      <Text style={styles.removeAdsSaveBadgeText}>🏷 {tCoin('coinShop.removeAds.subscription.saveBadge', { percent: pkg.discount })}</Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={pkg.popular ? ['#5B21B6', '#2563EB', '#1D4ED8'] : ['#1E1B4B', '#2D2640']}
                    style={styles.removeAdsCardInner}
                  >
                    {purchasingAdFree === pkg.id ? (
                      <View style={styles.removeAdsCardContent}>
                        <ActivityIndicator color={COLORS.white} size="small" />
                      </View>
                    ) : (
                      <View style={styles.removeAdsCardContent}>
                        <View style={styles.removeAdsCardLeft}>
                          <Text style={styles.removeAdsCardTitle}>
                            {tCoin(`coinShop.removeAds.subscription.${pkg.id}`)}
                          </Text>
                          <Text style={styles.removeAdsCardSubtitle}>
                            {tCoin(`coinShop.removeAds.subscription.${pkg.subtitleKey}`)}
                          </Text>
                        </View>
                        <View style={styles.removeAdsCardRight}>
                          <Text style={styles.removeAdsCardPrice}>{formatEgpPrice(pkg.price)} EGP</Text>
                          {pkg.id === 'yearly' && (
                            <Text style={styles.removeAdsCardPerMonth}>
                              {tCoin('coinShop.removeAds.subscription.perMonth', { price: (pkg.price / 12).toFixed(1) })}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Premium Purchase cards */}
        <Text style={styles.introTitle}>
          {tCoin('coinShop.premium.title', { defaultValue: 'Premium Coin Packages' })}
        </Text>
        <View style={styles.offers}>
          {PURCHASE_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.purchaseCard, pkg.popular && styles.purchaseCardFeatured]}
              activeOpacity={0.85}
              onPress={() => {
                playButtonClick();
                setToast({
                  visible: true,
                  type: 'info',
                  title: tCoin('coinShop.premium.confirmMessage', {
                    coins: pkg.coins,
                    price: formatEgpPrice(pkg.price),
                    defaultValue: `You'll receive ${pkg.coins} coins for ${formatEgpPrice(pkg.price)} EGP`,
                  }),
                });
              }}
            >
              <LinearGradient
                colors={['#1E1B4B', '#2D2640', '#312E81']}
                style={styles.purchaseCardGradient}
              >
                <View style={styles.purchaseCardBadgeSlot}>
                  {pkg.popular && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>
                        {tCoin('coinShop.premium.bestValue', { defaultValue: 'BEST VALUE' })}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.purchaseCoinsAmount}>{pkg.coins.toLocaleString()} COINS</Text>
                <View style={styles.purchaseCardBonusSlot}>
                  {pkg.id === 'ultimate' ? (
                    <Text style={styles.bonusText}>
                      {tCoin('coinShop.premium.bonus', { amount: 900, defaultValue: '+ 900 BONUS!' })}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.purchaseCoinRow}>
                  {coinImageSource ? (
                    <Image source={coinImageSource} style={styles.purchaseCoinIcon} resizeMode="contain" />
                  ) : (
                    <Text style={styles.purchaseCoinEmoji}>🪙</Text>
                  )}
                </View>
                <Text style={styles.purchaseDescription}>{pkg.description}</Text>
                <View style={[styles.purchaseButtonWrap, styles.purchaseButtonWrapUniform]}>
                  <View style={[styles.purchaseButton, styles.purchaseButtonSolid]}>
                    <Text style={styles.purchaseButtonText}>{formatEgpPrice(pkg.price)} EGP</Text>
                    <Text style={[styles.savingsText, (!pkg.savings || pkg.savings === '0%') && styles.savingsTextInvisible]}>
                      {pkg.savings && pkg.savings !== '0%'
                        ? tCoin('coinShop.premium.savings', { percent: pkg.savings, defaultValue: `Save ${pkg.savings}` })
                        : '\u00A0'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
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
    marginTop: SPACING.xl,
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
  purchaseButtonWrapUniform: {
    minHeight: 56,
  },
  purchaseCardBadgeSlot: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseCardBonusSlot: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonSolid: {
    backgroundColor: COLORS.warning,
  },
  purchaseButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  watchVideoSection: {
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['2xl'],
  },
  removeAdsSection: {
    marginBottom: SPACING.xl,
  },
  removeAdsLabel: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  removeAdsOwnedRow: {
    paddingVertical: SPACING.sm,
  },
  removeAdsOwnedText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  removeAdsCardsColumn: {
    gap: SPACING.lg,
  },
  removeAdsCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  removeAdsCardPopular: {
    borderColor: 'rgba(91, 33, 182, 0.5)',
    ...Platform.select({
      ios: { shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  removeAdsSaveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    zIndex: 1,
  },
  removeAdsSaveBadgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  removeAdsCardInner: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    minHeight: 72,
  },
  removeAdsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeAdsCardLeft: {
    flex: 1,
  },
  removeAdsCardTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  removeAdsCardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 4,
  },
  removeAdsCardRight: {
    alignItems: 'flex-end',
  },
  removeAdsCardPrice: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  removeAdsCardPerMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 4,
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
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  cycleCounterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cycleCounter: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  progressiveHint: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  watchVideoButtonSubtext: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 4,
  },
  bestValueBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  bonusText: {
    color: '#FCD34D',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.xs,
  },
  purchaseDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    zIndex: 1,
  },
  savingsText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  savingsTextInvisible: {
    opacity: 0,
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
  watchVideoButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  watchVideoButtonRetry: {
    backgroundColor: COLORS.warning,
  },
  watchVideoButtonDisabledBg: {
    backgroundColor: COLORS.gray[600],
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

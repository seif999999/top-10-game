import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useAd } from '../../contexts/AdContext';
import useAppTranslation from '../../../hooks/useTranslation';
import StandardButton from '../shared/StandardButton';
import { COLORS, SPACING } from '../../../backend/utils/constants';

let coinImageSource: any = null;
try {
  coinImageSource = require('../../assets/avatars/coin.png');
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

export interface RewardedAdButtonProps {
  /** Called when the user completes the ad and earns the reward. */
  onRewardEarned: (rewardType: string) => void;
  /** Reward type identifier (e.g. "hint", "extraTime", "doubleScore", "coins"). */
  rewardType: string;
  /** Optional custom button label. */
  buttonText?: string;
  /** Optional external disable (e.g. while another action is in progress). */
  disabled?: boolean;
  /** If set, this is a coin reward; button shows amount and coin icon. */
  coinAmount?: number;
  /** Timestamp (ms) when this coin reward is available again. */
  cooldownEndTime?: number;
  /** When true, button is disabled and shows countdown (use with cooldownEndTime). */
  onCooldown?: boolean;
}

/**
 * A button that loads and shows a rewarded ad. Handles loading state, errors,
 * premium (no ads), and calls onRewardEarned only when the user completes the ad.
 * Supports coin rewards with cooldown and success animation.
 */
const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  onRewardEarned,
  rewardType,
  buttonText,
  disabled: disabledProp = false,
  coinAmount,
  cooldownEndTime,
  onCooldown = false,
}) => {
  const { t: tCommon } = useAppTranslation('common');
  const { t } = useAppTranslation('components');
  const {
    isPremium,
    rewardedLoadState,
    adError,
    clearAdError,
    loadRewardedAd,
    showRewardedAd,
    isAdReady,
  } = useAd();

  const [isShowing, setIsShowing] = useState(false);
  const [countdownMs, setCountdownMs] = useState(0);
  const [showSuccessAmount, setShowSuccessAmount] = useState<number | null>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const isCoinReward = coinAmount != null && coinAmount > 0;
  const cooldownActive = isCoinReward && (onCooldown || (cooldownEndTime != null && cooldownEndTime > Date.now()));

  // Update countdown every second when cooldown is active
  useEffect(() => {
    if (!isCoinReward || cooldownEndTime == null) return;
    const tick = () => {
      const remaining = cooldownEndTime - Date.now();
      setCountdownMs(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isCoinReward, cooldownEndTime]);

  const watchVideoLabel = buttonText ?? (isCoinReward ? t('ads.watchAdForCoins', { amount: coinAmount }) : t('ads.watchVideo'));
  const loadingLabel = t('ads.loading');
  const loadFailedLabel = t('ads.loadFailed');
  const unavailableLabel = t('ads.unavailable');
  const premiumLabel = t('ads.premiumNoAds');
  const availableInLabel = countdownMs > 0 ? t('ads.availableIn', { time: formatMmSs(countdownMs) }) : watchVideoLabel;

  const isLoading =
    !isAdReady ||
    rewardedLoadState === 'idle' ||
    rewardedLoadState === 'loading' ||
    isShowing;
  const isLoaded = rewardedLoadState === 'loaded' && !isShowing;
  const hasError = !!adError || rewardedLoadState === 'failed';
  const isDisabled =
    disabledProp ||
    isPremium ||
    isLoading ||
    !isLoaded ||
    hasError ||
    (isCoinReward && cooldownActive);

  const handleRewardEarnedCallback = useCallback(() => {
    if (isCoinReward && coinAmount != null) {
      setShowSuccessAmount(coinAmount);
      successScale.setValue(0);
      successOpacity.setValue(1);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(successScale, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(successOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.delay(1200),
        Animated.timing(successOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setShowSuccessAmount(null);
      });
    }
    onRewardEarned(rewardType);
  }, [isCoinReward, coinAmount, rewardType, onRewardEarned, successScale, successOpacity]);

  const handlePress = useCallback(() => {
    if (isDisabled) return;
    clearAdError();
    setIsShowing(true);
    const fallbackTimer = setTimeout(() => {
      setIsShowing(false);
    }, 90000);
    showRewardedAd((reward) => {
      clearTimeout(fallbackTimer);
      setIsShowing(false);
      handleRewardEarnedCallback();
    });
  }, [
    isDisabled,
    clearAdError,
    showRewardedAd,
    handleRewardEarnedCallback,
  ]);

  useEffect(() => {
    if (adError && isShowing) {
      setIsShowing(false);
    }
  }, [adError, isShowing]);

  useEffect(() => {
    if (!isPremium && isAdReady) {
      loadRewardedAd();
    }
  }, [isPremium, isAdReady, loadRewardedAd]);

  const buttonTitle = isCoinReward && cooldownActive ? availableInLabel : (isLoading ? loadingLabel : watchVideoLabel);

  if (isPremium) {
    return (
      <View style={styles.wrapper}>
        <StandardButton
          title={premiumLabel}
          onPress={() => {}}
          disabled
          variant="disabled"
        />
      </View>
    );
  }

  if (hasError && !isLoading) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.errorText}>
          {adError || loadFailedLabel}
        </Text>
        <StandardButton
          title={tCommon('retry')}
          onPress={() => {
            clearAdError();
            loadRewardedAd();
          }}
          variant="secondary"
          size="small"
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (!isAdReady) {
    return (
      <View style={styles.wrapper}>
        <StandardButton
          title={unavailableLabel}
          onPress={() => {}}
          disabled
          variant="disabled"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.buttonRow}>
        {isCoinReward && !cooldownActive && (
          <View style={styles.coinIconWrap}>
            {coinImageSource ? (
              <Image source={coinImageSource} style={styles.coinIcon} resizeMode="contain" />
            ) : (
              <Text style={styles.coinEmoji}>🪙</Text>
            )}
          </View>
        )}
        <StandardButton
          title={buttonTitle}
          onPress={handlePress}
          disabled={isDisabled}
          loading={isLoading}
          variant={isLoaded && !cooldownActive ? 'success' : 'secondary'}
          style={isCoinReward ? styles.coinButton : undefined}
        />
      </View>

      {showSuccessAmount != null && (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.successBadge}>
            {coinImageSource ? (
              <Image source={coinImageSource} style={styles.successCoinIcon} resizeMode="contain" />
            ) : (
              <Text style={styles.successCoinEmoji}>🪙</Text>
            )}
            <Text style={styles.successText}>{t('ads.coinsEarned', { amount: showSuccessAmount })}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.xs,
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  coinIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinIcon: {
    width: 22,
    height: 22,
  },
  coinEmoji: {
    fontSize: 20,
  },
  coinButton: {
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.xs,
  },
  successOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  successCoinIcon: {
    width: 28,
    height: 28,
  },
  successCoinEmoji: {
    fontSize: 26,
  },
  successText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RewardedAdButton;

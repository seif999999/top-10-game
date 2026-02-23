/**
 * DoubleRewardAd Component
 * 
 * Shows a CTA after match/mission rewards are granted, allowing users
 * to watch an ad to double their coin reward.
 * 
 * If user accepts and completes ad → doubles coins
 * If skipped → user keeps base reward (no penalty)
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAd } from '../../contexts/AdContext';
import { CoinService } from '../../../backend/services/CoinService';
import { logger } from '../../../backend/utils/logger';
import useAppTranslation from '../../../hooks/useTranslation';
import { COLORS, SPACING } from '../../../backend/utils/constants';

export interface DoubleRewardAdProps {
  /** Base coin reward amount */
  baseCoins: number;
  /** User ID (required to grant coins) */
  userId: string;
  /** Callback when reward is doubled */
  onRewardDoubled?: (doubledAmount: number) => void;
  /** Callback when user skips */
  onSkipped?: () => void;
  /** Optional custom styling */
  style?: any;
}

const DoubleRewardAd: React.FC<DoubleRewardAdProps> = ({
  baseCoins,
  userId,
  onRewardDoubled,
  onSkipped,
  style,
}) => {
  const { t } = useAppTranslation('components');
  const { isPremium, showRewardedAd, isAdReady, rewardedLoadState } = useAd();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasDoubled, setHasDoubled] = useState(false);

  const handleWatchAd = useCallback(async () => {
    if (isPremium || isProcessing || hasDoubled || !isAdReady) return;

    setIsProcessing(true);

    try {
      await showRewardedAd(async (reward) => {
        try {
          // Double the coins
          const doubledAmount = baseCoins;
          await CoinService.getInstance().addCoins(
            userId,
            doubledAmount,
            `Double reward ad (${doubledAmount} coins)`
          );
          
          setHasDoubled(true);
          logger.log('DoubleRewardAd: Coins doubled', {
            userId,
            baseCoins,
            doubledAmount,
            totalEarned: baseCoins + doubledAmount,
          });
          
          onRewardDoubled?.(doubledAmount);
        } catch (error) {
          logger.error('DoubleRewardAd: Failed to add doubled coins', error);
          // Don't show error to user - they still got base reward
        } finally {
          setIsProcessing(false);
        }
      });
    } catch (error) {
      logger.warn('DoubleRewardAd: Ad failed to show', error);
      setIsProcessing(false);
    }
  }, [isPremium, isProcessing, hasDoubled, isAdReady, baseCoins, userId, showRewardedAd, onRewardDoubled]);

  const handleSkip = useCallback(() => {
    onSkipped?.();
  }, [onSkipped]);

  // Don't show if premium, already doubled, or no coins to double
  if (isPremium || hasDoubled || baseCoins <= 0) {
    return null;
  }

  const isLoading = rewardedLoadState === 'loading' || isProcessing;
  const isReady = isAdReady && rewardedLoadState === 'loaded' && !isProcessing;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('ads.doubleRewardTitle')}</Text>
        <Text style={styles.description}>
          {t('ads.doubleRewardDescription', { amount: baseCoins })}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.skipButton, !isReady && styles.buttonDisabled]}
            onPress={handleSkip}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>{t('ads.skip')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.watchButton,
              (!isReady || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleWatchAd}
            disabled={!isReady || isLoading || isProcessing}
            activeOpacity={0.8}
          >
            <Text style={styles.watchButtonText}>
              {isLoading ? t('ads.loading') : t('ads.watchAdToDouble')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  watchButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default DoubleRewardAd;

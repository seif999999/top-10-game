import React, { useMemo, useState } from 'react';
import { Platform, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAd } from '../../contexts/AdContext';
import { logger } from '../../../backend/utils/logger';
import { COLORS, SPACING } from '../../../backend/utils/constants';

// Lazy-load native BannerAd so web and unsupported environments don't break
let BannerAdNative: React.ComponentType<{
  unitId: string;
  size: string;
  onAdLoaded?: (dimensions: { width: number; height: number }) => void;
  onAdFailedToLoad?: (error: Error) => void;
}> | null = null;
let BannerAdSizeEnum: { ANCHORED_ADAPTIVE_BANNER: string } | null = null;
let TestIds: { ADAPTIVE_BANNER: string } | null = null;

function getBannerAdModule() {
  if (BannerAdNative != null) return { BannerAd: BannerAdNative, BannerAdSize: BannerAdSizeEnum, TestIds };
  if (Platform.OS === 'web') return null;
  // Expo Go does not include native AdMob; skip to avoid TurboModuleRegistry error
  if (typeof Constants !== 'undefined' && Constants.appOwnership === 'expo') return null;
  try {
    const mod = require('react-native-google-mobile-ads');
    BannerAdNative = mod.BannerAd;
    BannerAdSizeEnum = mod.BannerAdSize;
    TestIds = mod.TestIds;
    return { BannerAd: BannerAdNative, BannerAdSize: BannerAdSizeEnum, TestIds };
  } catch (e) {
    logger.warn('BannerAd: react-native-google-mobile-ads not available', e);
    return null;
  }
}

function getBannerUnitId(): string {
  if (__DEV__ && TestIds) return TestIds.ADAPTIVE_BANNER;
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID ?? '',
    android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ?? '',
    default: '',
  });
}

export interface BannerAdProps {
  /** Placement: top or bottom of screen (default 'bottom'). */
  position?: 'top' | 'bottom';
  /** If true, show a small X to dismiss the banner for this session. */
  dismissible?: boolean;
}

/**
 * Adaptive banner ad anchored to top or bottom. Respects safe area, premium,
 * and load errors. Auto-refresh follows AdMob default (~60s).
 */
const BannerAd: React.FC<BannerAdProps> = ({
  position = 'bottom',
  dismissible = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isPremium } = useAd();
  const [loadFailed, setLoadFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const adModule = useMemo(() => getBannerAdModule(), []);
  const unitId = useMemo(() => getBannerUnitId(), []);

  const handleFailedToLoad = (error: Error) => {
    logger.warn('BannerAd: failed to load', error);
    setLoadFailed(true);
  };

  if (isPremium || loadFailed || dismissed || !adModule || !unitId) {
    return null;
  }

  const { BannerAd: BannerAdComponent, BannerAdSize } = adModule;
  if (!BannerAdComponent || !BannerAdSize) return null;

  const isBottom = position === 'bottom';
  const containerStyle = [
    styles.container,
    isBottom
      ? { paddingBottom: Math.max(SPACING.sm, insets.bottom) }
      : { paddingTop: Math.max(SPACING.sm, insets.top) },
  ];

  return (
    <View style={containerStyle} pointerEvents="box-none">
      {dismissible && (
        <TouchableOpacity
          style={[styles.closeButton, isBottom ? styles.closeButtonBottom : styles.closeButtonTop]}
          onPress={() => {
            setDismissed(true);
            logger.log('BannerAd: dismissed by user');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close ad"
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      )}
      <BannerAdComponent
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={handleFailedToLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.sm,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonTop: {
    top: SPACING.xs,
  },
  closeButtonBottom: {
    bottom: SPACING.xs,
  },
  closeText: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '300',
  },
});

export default BannerAd;

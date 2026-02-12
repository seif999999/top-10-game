import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { COLORS, SPACING } from '../../backend/utils/constants';
import type { RootStackParamList } from '../../shared/types/navigation';

let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch {
  coinImageSource = null;
}

export type CoinDisplaySize = 'small' | 'medium' | 'large';

export interface CoinDisplayProps {
  size?: CoinDisplaySize;
  showShopButton?: boolean;
  style?: object;
}

const SIZE_STYLES: Record<CoinDisplaySize, { icon: number; fontSize: number; plusSize: number }> = {
  small: { icon: 18, fontSize: 14, plusSize: 20 },
  medium: { icon: 24, fontSize: 18, plusSize: 28 },
  large: { icon: 36, fontSize: 28, plusSize: 36 },
};

const CoinDisplay: React.FC<CoinDisplayProps> = ({
  size = 'medium',
  showShopButton = false,
  style,
}) => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'CoinsShop'>>();
  const { playButtonClick } = useAudio();
  const coins = user?.coins ?? 0;
  const prevCoins = useRef(coins);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (coins > prevCoins.current) {
      prevCoins.current = coins;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.25, duration: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start();
    } else {
      prevCoins.current = coins;
    }
  }, [coins, scaleAnim]);

  const dims = SIZE_STYLES[size];
  const handlePress = () => {
    playButtonClick();
    if (showShopButton) navigation.navigate('CoinsShop');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={showShopButton ? 0.7 : 1}
      disabled={!showShopButton}
      style={[styles.wrapper, style]}
    >
      <Animated.View style={[styles.inner, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconWrap, { width: dims.icon + 4, height: dims.icon + 4 }]}>
          {coinImageSource ? (
            <Image
              source={coinImageSource}
              style={{ width: dims.icon, height: dims.icon }}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.emoji, { fontSize: dims.icon }]}>🪙</Text>
          )}
        </View>
        <Text style={[styles.balance, { fontSize: dims.fontSize }]}>
          {coins.toLocaleString()}
        </Text>
        {showShopButton && (
          <View style={[styles.plusWrap, { width: dims.plusSize, height: dims.plusSize }]}>
            <Text style={[styles.plusText, { fontSize: dims.fontSize * 0.9 }]}>+</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {},
  balance: {
    color: COLORS.text,
    fontWeight: '700',
  },
  plusWrap: {
    backgroundColor: COLORS.secondary,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  plusText: {
    color: COLORS.white,
    fontWeight: '800',
  },
});

export default CoinDisplay;

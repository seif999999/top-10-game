/**
 * Preloads header icons (coin, shop, medal) by rendering them off-screen at app startup.
 * This forces React Native to decode and cache the images so they render immediately when displayed.
 */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

let coinSource: number | null = null;
let shopSource: number | null = null;
let medalSource: number | null = null;
let homeBgSource: number | null = null;
try {
  coinSource = require('../assets/avatars/coin.png');
} catch { /* ignore */ }
try {
  shopSource = require('../assets/icons/shop.png');
} catch { /* ignore */ }
try {
  medalSource = require('../assets/icons/medal.png');
} catch { /* ignore */ }
try {
  homeBgSource = require('../assets/images/home-background.png');
} catch { /* ignore */ }

const SOURCES = [coinSource, shopSource, medalSource, homeBgSource].filter(Boolean) as number[];

export function IconPreloader(): React.ReactElement {
  if (SOURCES.length === 0) return <></>;
  return (
    <View style={styles.preloader} pointerEvents="none" collapsable>
      {SOURCES.map((source, i) => (
        <Image
          key={i}
          source={source}
          style={styles.hiddenImage}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  preloader: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  hiddenImage: {
    position: 'absolute',
    width: 48,
    height: 48, // Decode at display size for proper caching
  },
});

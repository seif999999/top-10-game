/**
 * BannerAd – web stub. No native AdMob on web; returns null.
 * This file is used when building for web so react-native-google-mobile-ads is never imported.
 */

import React from 'react';

export interface BannerAdProps {
  position?: 'top' | 'bottom';
  dismissible?: boolean;
}

const BannerAd: React.FC<BannerAdProps> = () => {
  return null;
};

export default BannerAd;

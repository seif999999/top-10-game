/**
 * In-App Purchase service for Remove Ads subscriptions.
 * Option 1: Subscription model (Monthly 60 EGP, Quarterly 150 EGP, Yearly 500 EGP)
 *
 * Uses mock implementation for development. Replace with real IAP when configured:
 * - iOS: App Store Connect products
 * - Android: Google Play Console products
 * - Use react-native-iap or expo-in-app-purchases
 */

import { logger } from '../utils/logger';
import UserProfileService from './userProfileService';

export type PremiumSubscriptionType = 'monthly' | 'quarterly' | 'yearly';

const PRODUCT_IDS: Record<PremiumSubscriptionType, string> = {
  monthly: 'com.top10game.premium.monthly',
  quarterly: 'com.top10game.premium.quarterly',
  yearly: 'com.top10game.premium.yearly',
};

export interface PurchaseResult {
  success: boolean;
  error?: string;
}

/**
 * Mock IAP - simulates successful purchase for development only.
 * Disabled in production; use real IAP (react-native-purchases) when configured.
 */
const mockPurchase = async (
  _productId: string,
  userId: string,
  type: PremiumSubscriptionType
): Promise<PurchaseResult> => {
  if (!__DEV__) {
    return { success: false, error: 'Mock IAP disabled in production. Configure real IAP.' };
  }
  logger.log(`IAPService: mock purchase ${type} for ${userId}`);
  await UserProfileService.getInstance().setPremiumStatus(userId, type);
  await UserProfileService.getInstance().grantPremiumBonuses(userId);
  return { success: true };
};

export class IAPService {
  private static instance: IAPService | null = null;

  private constructor() {}

  public static getInstance(): IAPService {
    if (!IAPService.instance) {
      IAPService.instance = new IAPService();
    }
    return IAPService.instance;
  }

  /**
   * Purchase a subscription. Uses mock in __DEV__ only.
   * In production: integrate react-native-purchases or expo-in-app-purchases.
   */
  public async purchaseSubscription(
    userId: string,
    type: PremiumSubscriptionType
  ): Promise<PurchaseResult> {
    const productId = PRODUCT_IDS[type];
    try {
      if (!__DEV__) {
        return {
          success: false,
          error: 'In-app purchases are not configured. Please update from the app store.',
        };
      }
      return await mockPurchase(productId, userId, type);
    } catch (error) {
      logger.error('IAPService: purchase failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  public getProductId(type: PremiumSubscriptionType): string {
    return PRODUCT_IDS[type];
  }
}

export default IAPService.getInstance();

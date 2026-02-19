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
 * Mock IAP - simulates successful purchase for development.
 * In production, replace with real store purchase flow.
 */
const mockPurchase = async (
  _productId: string,
  userId: string,
  type: PremiumSubscriptionType
): Promise<PurchaseResult> => {
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
   * Purchase a subscription. Uses mock for now.
   * TODO: Integrate react-native-iap or expo-in-app-purchases when store is configured.
   */
  public async purchaseSubscription(
    userId: string,
    type: PremiumSubscriptionType
  ): Promise<PurchaseResult> {
    const productId = PRODUCT_IDS[type];
    try {
      // Mock implementation - in production, initiate real IAP flow
      // const purchase = await RNIap.requestSubscription({ sku: productId });
      // if (purchase) { ... validate receipt, then grant }
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

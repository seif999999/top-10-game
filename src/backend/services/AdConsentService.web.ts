/**
 * AdConsentService – web stub. No tracking transparency on web.
 * This file is used when building for web so expo-tracking-transparency is never imported.
 */

import { logger } from '../utils/logger';

export type TrackingConsentStatus = 'granted' | 'denied' | 'undetermined';
export type GdprConsentType = 'personalized' | 'non_personalized' | 'unknown';

export class AdConsentService {
  private static instance: AdConsentService | null = null;
  private initPromise: Promise<void> = Promise.resolve();

  private constructor() {
    logger.log('AdConsentService (web): stub loaded');
  }

  public static getInstance(): AdConsentService {
    if (!AdConsentService.instance) {
      AdConsentService.instance = new AdConsentService();
    }
    return AdConsentService.instance;
  }

  public async initialize(): Promise<void> {
    logger.log('AdConsentService: skipped (web)');
    return this.initPromise;
  }

  public async getTrackingConsent(): Promise<boolean> {
    return true;
  }

  public hasTrackingConsentSync(): boolean | null {
    return true;
  }

  public async getTrackingStatus(): Promise<TrackingConsentStatus> {
    return 'granted';
  }

  public async wasAttPromptShown(): Promise<boolean> {
    return false;
  }

  public async getGdprConsent(): Promise<GdprConsentType> {
    return 'unknown';
  }

  public async setGdprConsent(_type: GdprConsentType): Promise<void> {
    // no-op
  }

  public async hasGdprConsent(): Promise<boolean> {
    return false;
  }

  public async clearStoredConsent(): Promise<void> {
    // no-op
  }
}

export default AdConsentService.getInstance();

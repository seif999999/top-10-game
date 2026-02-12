/**
 * AdConsentService – singleton for privacy/consent (iOS ATT, stored preferences, future GDPR).
 * Requests tracking permission on iOS, stores result in AsyncStorage, only prompts once per install.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  TRACKING_STATUS: 'ad_consent_tracking_status',
  TRACKING_UPDATED_AT: 'ad_consent_tracking_updated_at',
  ATT_PROMPT_SHOWN: 'ad_consent_att_prompt_shown',
  GDPR_CONSENT: 'ad_consent_gdpr',
} as const;

export type TrackingConsentStatus = 'granted' | 'denied' | 'undetermined';

/** Stored consent payload. */
interface StoredTrackingConsent {
  status: TrackingConsentStatus;
  updatedAt: string;
}

/** Future: GDPR consent type for EU users. */
export type GdprConsentType = 'personalized' | 'non_personalized' | 'unknown';

interface StoredGdprConsent {
  type: GdprConsentType;
  updatedAt: string;
}

/** Lazy-load tracking transparency on native only (avoid web/unsupported). */
function isTrackingTransparencyAvailable(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    const { isAvailable } = require('expo-tracking-transparency');
    return typeof isAvailable === 'function' ? isAvailable() : false;
  } catch {
    return false;
  }
}

export class AdConsentService {
  private static instance: AdConsentService | null = null;

  private initPromise: Promise<void> | null = null;
  private cachedTrackingGranted: boolean | null = null;
  private cachedTrackingStatus: TrackingConsentStatus | null = null;

  private constructor() {}

  public static getInstance(): AdConsentService {
    if (!AdConsentService.instance) {
      AdConsentService.instance = new AdConsentService();
    }
    return AdConsentService.instance;
  }

  /**
   * Call once at app startup (e.g. after app is ready).
   * On iOS: gets current permission; if undetermined, requests (shows system prompt once per install).
   * Stores result in AsyncStorage and respects user choice thereafter.
   */
  public async initialize(): Promise<void> {
    if (this.initPromise !== null) return this.initPromise;

    if (Platform.OS === 'web') {
      this.cachedTrackingGranted = true;
      this.cachedTrackingStatus = 'granted';
      this.initPromise = Promise.resolve();
      logger.log('AdConsentService: skipped (web)');
      return this.initPromise;
    }

    if (!isTrackingTransparencyAvailable()) {
      this.cachedTrackingGranted = true;
      this.cachedTrackingStatus = 'granted';
      this.initPromise = Promise.resolve();
      logger.log('AdConsentService: ATT not available, treating as granted');
      return this.initPromise;
    }

    this.initPromise = this.runInitialization();
    return this.initPromise;
  }

  private async runInitialization(): Promise<void> {
    try {
      const current = await getTrackingPermissionsAsync();
      const status = this.normalizeStatus(current.status);

      if (status === 'undetermined') {
        logger.log('AdConsentService: tracking undetermined, requesting permission');
        const result = await requestTrackingPermissionsAsync();
        const newStatus = this.normalizeStatus(result.status);
        this.cachedTrackingGranted = result.granted;
        this.cachedTrackingStatus = newStatus;
        await this.saveTrackingConsent(newStatus);
        logger.log('AdConsentService: user choice', newStatus);
      } else {
        this.cachedTrackingGranted = current.granted;
        this.cachedTrackingStatus = status;
        await this.saveTrackingConsent(status);
      }
    } catch (e) {
      logger.error('AdConsentService: initialize failed', e);
      this.cachedTrackingGranted = false;
      this.cachedTrackingStatus = 'denied';
      await this.saveTrackingConsent('denied');
    }
  }

  private normalizeStatus(status: string): TrackingConsentStatus {
    if (status === PermissionStatus.GRANTED) return 'granted';
    if (status === PermissionStatus.DENIED) return 'denied';
    return 'undetermined';
  }

  private async saveTrackingConsent(status: TrackingConsentStatus): Promise<void> {
    try {
      const payload: StoredTrackingConsent = {
        status,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_STATUS, JSON.stringify(payload));
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_UPDATED_AT, payload.updatedAt);
      await AsyncStorage.setItem(STORAGE_KEYS.ATT_PROMPT_SHOWN, 'true');
    } catch (e) {
      logger.error('AdConsentService: failed to save tracking consent', e);
    }
  }

  /**
   * Returns whether the user has granted tracking (e.g. for personalized ads).
   * Resolves to true on Android/web or when ATT is unavailable; false when denied.
   * Call after initialize() for accurate result.
   */
  public async getTrackingConsent(): Promise<boolean> {
    if (this.cachedTrackingGranted !== null) return this.cachedTrackingGranted;
    if (Platform.OS === 'web') return true;

    if (!isTrackingTransparencyAvailable()) return true;

    try {
      const current = await getTrackingPermissionsAsync();
      this.cachedTrackingGranted = current.granted;
      this.cachedTrackingStatus = this.normalizeStatus(current.status);
      await this.saveTrackingConsent(this.cachedTrackingStatus);
      return this.cachedTrackingGranted;
    } catch (e) {
      logger.error('AdConsentService: getTrackingConsent failed', e);
      return false;
    }
  }

  /**
   * Sync check: returns last known consent (true/false). Call after initialize().
   * If not yet initialized, returns null.
   */
  public hasTrackingConsentSync(): boolean | null {
    return this.cachedTrackingGranted;
  }

  /**
   * Returns the stored tracking status ('granted' | 'denied' | 'undetermined').
   * Prefer getTrackingConsent() for a boolean check.
   */
  public async getTrackingStatus(): Promise<TrackingConsentStatus> {
    if (this.cachedTrackingStatus !== null) return this.cachedTrackingStatus;

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRACKING_STATUS);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredTrackingConsent;
        this.cachedTrackingStatus = parsed.status;
        this.cachedTrackingGranted = parsed.status === 'granted';
        return this.cachedTrackingStatus;
      }
    } catch (e) {
      logger.warn('AdConsentService: getTrackingStatus read failed', e);
    }

    if (Platform.OS === 'web' || !isTrackingTransparencyAvailable()) {
      this.cachedTrackingStatus = 'granted';
      this.cachedTrackingGranted = true;
      return 'granted';
    }

    try {
      const current = await getTrackingPermissionsAsync();
      this.cachedTrackingStatus = this.normalizeStatus(current.status);
      this.cachedTrackingGranted = current.granted;
      return this.cachedTrackingStatus;
    } catch {
      this.cachedTrackingStatus = 'denied';
      this.cachedTrackingGranted = false;
      return 'denied';
    }
  }

  /**
   * Whether the ATT prompt has been shown (we stored that we completed the flow).
   * Used for "only show once per installation" (system also enforces this on iOS).
   */
  public async wasAttPromptShown(): Promise<boolean> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ATT_PROMPT_SHOWN);
    return value === 'true';
  }

  // ---------- GDPR (future EU users) ----------

  /**
   * Get stored GDPR consent. Defaults to 'unknown' if never set.
   */
  public async getGdprConsent(): Promise<GdprConsentType> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.GDPR_CONSENT);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredGdprConsent;
        if (['personalized', 'non_personalized', 'unknown'].includes(parsed.type)) {
          return parsed.type as GdprConsentType;
        }
      }
    } catch (e) {
      logger.warn('AdConsentService: getGdprConsent read failed', e);
    }
    return 'unknown';
  }

  /**
   * Store GDPR consent (for future EU consent flow).
   */
  public async setGdprConsent(type: GdprConsentType): Promise<void> {
    try {
      const payload: StoredGdprConsent = {
        type,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.GDPR_CONSENT, JSON.stringify(payload));
      logger.log('AdConsentService: GDPR consent saved', type);
    } catch (e) {
      logger.error('AdConsentService: setGdprConsent failed', e);
      throw e;
    }
  }

  /**
   * Whether we have a definite GDPR choice (for future: show consent UI only when unknown in EU).
   */
  public async hasGdprConsent(): Promise<boolean> {
    const type = await this.getGdprConsent();
    return type === 'personalized' || type === 'non_personalized';
  }

  /** Clear all stored consent (e.g. for testing or account logout). */
  public async clearStoredConsent(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TRACKING_STATUS,
        STORAGE_KEYS.TRACKING_UPDATED_AT,
        STORAGE_KEYS.ATT_PROMPT_SHOWN,
        STORAGE_KEYS.GDPR_CONSENT,
      ]);
      this.cachedTrackingGranted = null;
      this.cachedTrackingStatus = null;
      logger.log('AdConsentService: stored consent cleared');
    } catch (e) {
      logger.error('AdConsentService: clearStoredConsent failed', e);
      throw e;
    }
  }
}

export default AdConsentService.getInstance();

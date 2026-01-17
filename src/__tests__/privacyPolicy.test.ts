import PrivacyPolicyService from '../backend/services/privacyPolicyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
}));

// Mock Firebase db
jest.mock('../services/firebase', () => ({
  db: {}
}));

describe('PrivacyPolicyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasAcceptedCurrentVersion', () => {
    it('should return false for anonymous users with no acceptance', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await PrivacyPolicyService.hasAcceptedCurrentVersion();
      expect(result).toBe(false);
    });

    it('should return true for anonymous users with current version acceptance', async () => {
      const acceptance = {
        userId: 'anonymous',
        acceptedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(acceptance));
      
      const result = await PrivacyPolicyService.hasAcceptedCurrentVersion();
      expect(result).toBe(true);
    });

    it('should return false for anonymous users with old version acceptance', async () => {
      const acceptance = {
        userId: 'anonymous',
        acceptedAt: new Date().toISOString(),
        version: '0.9.0',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(acceptance));
      
      const result = await PrivacyPolicyService.hasAcceptedCurrentVersion();
      expect(result).toBe(false);
    });
  });

  describe('recordAcceptance', () => {
    it('should record acceptance for logged-in users', async () => {
      const { setDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({ id: 'test-user' });
      
      await PrivacyPolicyService.recordAcceptance('test-user', {
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent',
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
          model: 'iPhone',
        },
      });
      
      expect(setDoc).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should record acceptance for anonymous users', async () => {
      await PrivacyPolicyService.recordAnonymousAcceptance({
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent',
        deviceInfo: {
          platform: 'android',
          version: '1.0.0',
        },
      });
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version', () => {
      const version = PrivacyPolicyService.getCurrentVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', () => {
      const history = PrivacyPolicyService.getVersionHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('version');
      expect(history[0]).toHaveProperty('effectiveDate');
      expect(history[0]).toHaveProperty('lastUpdated');
      expect(history[0]).toHaveProperty('changes');
    });
  });

  describe('needsReAcceptance', () => {
    it('should return true when no acceptance exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await PrivacyPolicyService.needsReAcceptance();
      expect(result).toBe(true);
    });

    it('should return false when current version is accepted', async () => {
      const acceptance = {
        userId: 'anonymous',
        acceptedAt: new Date().toISOString(),
        version: '1.0.0',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(acceptance));
      
      const result = await PrivacyPolicyService.needsReAcceptance();
      expect(result).toBe(false);
    });
  });

  describe('revokeAcceptance', () => {
    it('should revoke acceptance for logged-in users', async () => {
      const { setDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      setDoc.mockResolvedValue(undefined);
      doc.mockReturnValue({ id: 'test-user' });
      
      await PrivacyPolicyService.revokeAcceptance('test-user');
      
      expect(setDoc).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('exportUserData', () => {
    it('should export user data when acceptance exists', async () => {
      const { getDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      const mockData = {
        userId: 'test-user',
        acceptedAt: { toDate: () => new Date() },
        version: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent',
        deviceInfo: {
          platform: 'ios',
          version: '1.0.0',
        },
      };
      
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      doc.mockReturnValue({ id: 'test-user' });
      
      const result = await PrivacyPolicyService.exportUserData('test-user');
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('test-user');
      expect(result?.version).toBe('1.0.0');
    });

    it('should return null when no acceptance exists', async () => {
      const { getDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      getDoc.mockResolvedValue({ exists: () => false });
      doc.mockReturnValue({ id: 'test-user' });
      
      const result = await PrivacyPolicyService.exportUserData('test-user');
      expect(result).toBeNull();
    });
  });

  describe('validateAcceptance', () => {
    it('should validate current acceptance', async () => {
      const { getDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      const mockData = {
        acceptedAt: { toDate: () => new Date() },
        version: '1.0.0',
      };
      
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      doc.mockReturnValue({ id: 'test-user' });
      
      const result = await PrivacyPolicyService.validateAcceptance('test-user');
      
      expect(result.valid).toBe(true);
      expect(result.version).toBe('1.0.0');
      expect(result.needsUpdate).toBe(false);
    });

    it('should detect when update is needed', async () => {
      const { getDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      const mockData = {
        acceptedAt: { toDate: () => new Date() },
        version: '0.9.0',
      };
      
      getDoc.mockResolvedValue({ exists: () => true, data: () => mockData });
      doc.mockReturnValue({ id: 'test-user' });
      
      const result = await PrivacyPolicyService.validateAcceptance('test-user');
      
      expect(result.valid).toBe(false);
      expect(result.version).toBe('0.9.0');
      expect(result.needsUpdate).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      
      const result = await PrivacyPolicyService.hasAcceptedCurrentVersion();
      expect(result).toBe(false);
    });

    it('should handle Firebase errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      const { doc } = require('firebase/firestore');
      
      getDoc.mockRejectedValue(new Error('Firebase error'));
      doc.mockReturnValue({ id: 'test-user' });
      
      const result = await PrivacyPolicyService.validateAcceptance('test-user');
      expect(result.valid).toBe(false);
      expect(result.version).toBe('error');
      expect(result.needsUpdate).toBe(true);
    });
  });
});

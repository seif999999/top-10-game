import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import audioService from '../../backend/services/audioService';
import { getUserPreferences, saveUserPreferences, UserPreferences } from '../../backend/services/localStorage';
import { useAuth } from './AuthContext';
import { logger } from '../../backend/utils/logger';

interface AudioContextType {
  // State
  isSFXEnabled: boolean;
  isMusicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  isInitialized: boolean;
  
  // Actions
  playButtonClick: () => Promise<void>;
  playSFX: (name: string) => Promise<void>;
  playSuccess: () => Promise<void>;
  playError: () => Promise<void>;
  playGameStart: () => Promise<void>;
  playGameEnd: () => Promise<void>;
  
  // Music controls
  playBackgroundMusic: () => Promise<void>;
  stopBackgroundMusic: () => Promise<void>;
  pauseBackgroundMusic: () => Promise<void>;
  resumeBackgroundMusic: () => Promise<void>;
  
  // Settings
  toggleSFX: () => Promise<void>;
  toggleMusic: () => Promise<void>;
  setSFXVolume: (volume: number) => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSFXEnabled, setIsSFXEnabled] = useState(true);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [sfxVolume, setSFXVolumeState] = useState(0.7);
  const [musicVolume, setMusicVolumeState] = useState(0.3);

  // Initialize audio service and load preferences
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioService.init();
        await audioService.preloadSounds();
        setIsInitialized(true);
        logger.log('Audio context initialized');
      } catch (error) {
        logger.error('Error initializing audio context:', error);
      }
    };

    initAudio();

    // Cleanup on unmount
    return () => {
      audioService.cleanup();
    };
  }, []);

  // Load user preferences when user changes
  useEffect(() => {
    const loadPreferences = async () => {
      if (user?.id) {
        try {
          const prefs = await getUserPreferences(user.id);
          
          setIsSFXEnabled(prefs.soundEnabled);
          setIsMusicEnabled(prefs.musicEnabled);
          setSFXVolumeState(prefs.sfxVolume);
          setMusicVolumeState(prefs.musicVolume);
          
          // Apply settings to audio service
          audioService.applySettings({
            sfxEnabled: prefs.soundEnabled,
            musicEnabled: prefs.musicEnabled,
            sfxVolume: prefs.sfxVolume,
            musicVolume: prefs.musicVolume,
          });
          
          logger.log('Audio preferences loaded for user:', user.id);
        } catch (error) {
          logger.error('Error loading audio preferences:', error);
        }
      }
    };

    loadPreferences();
  }, [user?.id]);

  // Save preferences helper
  const savePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (user?.id) {
      try {
        const currentPrefs = await getUserPreferences(user.id);
        const newPrefs = { ...currentPrefs, ...updates };
        await saveUserPreferences(user.id, newPrefs);
      } catch (error) {
        logger.error('Error saving audio preferences:', error);
      }
    }
  }, [user?.id]);

  // Sound effect methods
  const playButtonClick = useCallback(async () => {
    await audioService.playButtonClick();
  }, []);

  const playSFX = useCallback(async (name: string) => {
    await audioService.playSFX(name);
  }, []);

  const playSuccess = useCallback(async () => {
    await audioService.playSuccess();
  }, []);

  const playError = useCallback(async () => {
    await audioService.playError();
  }, []);

  const playGameStart = useCallback(async () => {
    await audioService.playGameStart();
  }, []);

  const playGameEnd = useCallback(async () => {
    await audioService.playGameEnd();
  }, []);

  // Music control methods
  const playBackgroundMusic = useCallback(async () => {
    await audioService.playBackgroundMusic();
  }, []);

  const stopBackgroundMusic = useCallback(async () => {
    await audioService.stopBackgroundMusic();
  }, []);

  const pauseBackgroundMusic = useCallback(async () => {
    await audioService.pauseBackgroundMusic();
  }, []);

  const resumeBackgroundMusic = useCallback(async () => {
    await audioService.resumeBackgroundMusic();
  }, []);

  // Settings methods
  const toggleSFX = useCallback(async () => {
    const newValue = !isSFXEnabled;
    setIsSFXEnabled(newValue);
    audioService.setSFXEnabled(newValue);
    await savePreferences({ soundEnabled: newValue });
  }, [isSFXEnabled, savePreferences]);

  const toggleMusic = useCallback(async () => {
    const newValue = !isMusicEnabled;
    setIsMusicEnabled(newValue);
    await audioService.setMusicEnabled(newValue);
    await savePreferences({ musicEnabled: newValue });
  }, [isMusicEnabled, savePreferences]);

  const setSFXVolume = useCallback(async (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSFXVolumeState(clampedVolume);
    audioService.setSFXVolume(clampedVolume);
    await savePreferences({ sfxVolume: clampedVolume });
  }, [savePreferences]);

  const setMusicVolume = useCallback(async (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMusicVolumeState(clampedVolume);
    await audioService.setMusicVolume(clampedVolume);
    await savePreferences({ musicVolume: clampedVolume });
  }, [savePreferences]);

  const value: AudioContextType = {
    // State
    isSFXEnabled,
    isMusicEnabled,
    sfxVolume,
    musicVolume,
    isInitialized,
    
    // Sound effects
    playButtonClick,
    playSFX,
    playSuccess,
    playError,
    playGameStart,
    playGameEnd,
    
    // Music controls
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    
    // Settings
    toggleSFX,
    toggleMusic,
    setSFXVolume,
    setMusicVolume,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Hook to access audio context
 */
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;

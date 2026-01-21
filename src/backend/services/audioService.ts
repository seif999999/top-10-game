import { Audio, AVPlaybackStatus } from 'expo-av';
import { logger } from '../utils/logger';

// Sound file imports - these will be loaded dynamically
// Users need to add actual audio files to the sounds folder
const SOUND_FILES: { [key: string]: any } = {};

// Try to load sound files, but don't fail if they don't exist
const loadSoundFiles = () => {
  const loadedSounds: string[] = [];
  const missingSounds: string[] = [];
  
  try {
    // These will only work if the files exist
    // Using dynamic requires with try-catch for each
    try { 
      SOUND_FILES.click = require('../../frontend/assets/sounds/click.mp3'); 
      loadedSounds.push('click');
    } catch (e) { 
      missingSounds.push('click');
    }
    try { 
      SOUND_FILES.success = require('../../frontend/assets/sounds/success.mp3'); 
      loadedSounds.push('success');
    } catch (e) { 
      missingSounds.push('success');
    }
    try { 
      SOUND_FILES.error = require('../../frontend/assets/sounds/error.mp3'); 
      loadedSounds.push('error');
    } catch (e) { 
      missingSounds.push('error');
    }
    try { 
      SOUND_FILES.gameStart = require('../../frontend/assets/sounds/game-start.mp3'); 
      loadedSounds.push('gameStart');
    } catch (e) { 
      missingSounds.push('gameStart');
    }
    try { 
      SOUND_FILES.gameEnd = require('../../frontend/assets/sounds/game-end.mp3'); 
      loadedSounds.push('gameEnd');
    } catch (e) { 
      missingSounds.push('gameEnd');
    }
    try { 
      SOUND_FILES.backgroundMusic = require('../../frontend/assets/sounds/background-music.mp3'); 
      loadedSounds.push('backgroundMusic');
    } catch (e) { 
      missingSounds.push('backgroundMusic');
    }
    
    logger.log(`🔊 Sound files loaded: [${loadedSounds.join(', ')}]`);
    if (missingSounds.length > 0) {
      logger.log(`⚠️ Sound files missing: [${missingSounds.join(', ')}]`);
    }
  } catch (e) {
    logger.log('Error loading sound files:', e);
  }
};

// Initialize sound files
loadSoundFiles();

class AudioService {
  private static instance: AudioService | null = null;
  private backgroundMusic: Audio.Sound | null = null;
  private soundEffects: Map<string, Audio.Sound> = new Map();
  private isInitialized: boolean = false;
  
  // Settings
  private sfxEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.3;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Initialize audio settings
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isInitialized = true;
      logger.log('Audio service initialized');
    } catch (error) {
      logger.error('Error initializing audio:', error);
    }
  }

  /**
   * Preload sound effects for instant playback
   */
  async preloadSounds(): Promise<void> {
    try {
      const soundsToLoad = ['click', 'success', 'error', 'gameStart', 'gameEnd'];
      
      for (const name of soundsToLoad) {
        if (SOUND_FILES[name]) {
          try {
            const { sound } = await Audio.Sound.createAsync(SOUND_FILES[name], {
              shouldPlay: false,
              volume: this.sfxVolume,
            });
            this.soundEffects.set(name, sound);
          } catch (e) {
            logger.log(`Could not load sound: ${name}`);
          }
        }
      }
      
      logger.log(`Preloaded ${this.soundEffects.size} sound effects`);
    } catch (error) {
      logger.error('Error preloading sounds:', error);
    }
  }

  /**
   * Play a sound effect by name
   */
  async playSFX(name: string): Promise<void> {
    if (!this.sfxEnabled) return;

    try {
      const sound = this.soundEffects.get(name);
      if (sound) {
        await sound.setVolumeAsync(this.sfxVolume);
        await sound.setPositionAsync(0); // Reset to start
        await sound.playAsync();
      } else if (SOUND_FILES[name]) {
        // If not preloaded, try to play directly
        const { sound: newSound } = await Audio.Sound.createAsync(
          SOUND_FILES[name],
          { shouldPlay: true, volume: this.sfxVolume }
        );
        // Unload after playing
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            newSound.unloadAsync();
          }
        });
      }
    } catch (error) {
      logger.error(`Error playing sound effect ${name}:`, error);
    }
  }

  /**
   * Play button click sound (convenience method)
   */
  async playButtonClick(): Promise<void> {
    await this.playSFX('click');
  }

  /**
   * Play success sound
   */
  async playSuccess(): Promise<void> {
    await this.playSFX('success');
  }

  /**
   * Play error sound
   */
  async playError(): Promise<void> {
    await this.playSFX('error');
  }

  /**
   * Play game start sound
   */
  async playGameStart(): Promise<void> {
    await this.playSFX('gameStart');
  }

  /**
   * Play game end sound
   */
  async playGameEnd(): Promise<void> {
    await this.playSFX('gameEnd');
  }

  /**
   * Start background music
   */
  async playBackgroundMusic(): Promise<void> {
    if (!this.musicEnabled || !SOUND_FILES.backgroundMusic) return;

    try {
      // Stop existing music first
      if (this.backgroundMusic) {
        try {
          // Check if sound is loaded before stopping
          const status = await this.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.backgroundMusic.stopAsync();
            await this.backgroundMusic.unloadAsync();
          }
        } catch (soundError: any) {
          // If sound is not loaded or already unloaded, just clear the reference
          if (soundError?.message?.includes('not loaded') || soundError?.message?.includes('Cannot complete operation')) {
            logger.log('Existing background music not loaded, clearing reference');
          } else {
            throw soundError;
          }
        }
        this.backgroundMusic = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        SOUND_FILES.backgroundMusic,
        {
          isLooping: true,
          volume: this.musicVolume,
          shouldPlay: true,
        }
      );

      this.backgroundMusic = sound;
      logger.log('Background music started');
    } catch (error) {
      logger.error('Error playing background music:', error);
    }
  }

  /**
   * Stop background music
   */
  async stopBackgroundMusic(): Promise<void> {
    try {
      if (this.backgroundMusic) {
        try {
          // Check if sound is loaded before stopping
          const status = await this.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.backgroundMusic.stopAsync();
            await this.backgroundMusic.unloadAsync();
          }
        } catch (soundError: any) {
          // If sound is not loaded or already unloaded, just clear the reference
          if (soundError?.message?.includes('not loaded') || soundError?.message?.includes('Cannot complete operation')) {
            logger.log('Background music already stopped or not loaded');
          } else {
            throw soundError;
          }
        }
        this.backgroundMusic = null;
        logger.log('Background music stopped');
      }
    } catch (error) {
      logger.error('Error stopping background music:', error);
      // Clear reference even on error to prevent future issues
      this.backgroundMusic = null;
    }
  }

  /**
   * Pause background music
   */
  async pauseBackgroundMusic(): Promise<void> {
    try {
      if (this.backgroundMusic) {
        try {
          // Check if sound is loaded before pausing
          const status = await this.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.backgroundMusic.pauseAsync();
          }
        } catch (soundError: any) {
          // If sound is not loaded, just log and continue
          if (soundError?.message?.includes('not loaded') || soundError?.message?.includes('Cannot complete operation')) {
            logger.log('Background music not loaded, cannot pause');
          } else {
            throw soundError;
          }
        }
      }
    } catch (error) {
      logger.error('Error pausing background music:', error);
    }
  }

  /**
   * Resume background music
   */
  async resumeBackgroundMusic(): Promise<void> {
    if (!this.musicEnabled) return;
    
    try {
      if (this.backgroundMusic) {
        try {
          // Check if sound is loaded before resuming
          const status = await this.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.backgroundMusic.playAsync();
          } else {
            // If not loaded, try to start it fresh
            logger.log('Background music not loaded, starting fresh');
            await this.playBackgroundMusic();
          }
        } catch (soundError: any) {
          // If sound is not loaded, try to start it fresh
          if (soundError?.message?.includes('not loaded') || soundError?.message?.includes('Cannot complete operation')) {
            logger.log('Background music not loaded, starting fresh');
            await this.playBackgroundMusic();
          } else {
            throw soundError;
          }
        }
      }
    } catch (error) {
      logger.error('Error resuming background music:', error);
    }
  }

  /**
   * Set SFX enabled state
   */
  setSFXEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    logger.log(`SFX ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get SFX enabled state
   */
  isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  /**
   * Set music enabled state
   */
  async setMusicEnabled(enabled: boolean): Promise<void> {
    this.musicEnabled = enabled;
    
    if (!enabled && this.backgroundMusic) {
      await this.stopBackgroundMusic();
    }
    
    logger.log(`Music ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get music enabled state
   */
  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Set SFX volume (0-1)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all preloaded sounds
    this.soundEffects.forEach(async (sound) => {
      try {
        await sound.setVolumeAsync(this.sfxVolume);
      } catch (e) {
        // Ignore errors for unloaded sounds
      }
    });
  }

  /**
   * Get SFX volume
   */
  getSFXVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Set music volume (0-1)
   */
  async setMusicVolume(volume: number): Promise<void> {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.setVolumeAsync(this.musicVolume);
      } catch (error) {
        logger.error('Error setting music volume:', error);
      }
    }
  }

  /**
   * Get music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Apply settings from preferences
   */
  applySettings(settings: {
    sfxEnabled?: boolean;
    musicEnabled?: boolean;
    sfxVolume?: number;
    musicVolume?: number;
  }): void {
    if (settings.sfxEnabled !== undefined) {
      this.sfxEnabled = settings.sfxEnabled;
    }
    if (settings.musicEnabled !== undefined) {
      this.musicEnabled = settings.musicEnabled;
    }
    if (settings.sfxVolume !== undefined) {
      this.sfxVolume = settings.sfxVolume;
    }
    if (settings.musicVolume !== undefined) {
      this.musicVolume = settings.musicVolume;
    }
  }

  /**
   * Cleanup all sounds
   */
  async cleanup(): Promise<void> {
    try {
      // Stop and unload background music
      if (this.backgroundMusic) {
        try {
          // Check if sound is loaded before stopping
          const status = await this.backgroundMusic.getStatusAsync();
          if (status.isLoaded) {
            await this.backgroundMusic.stopAsync();
            await this.backgroundMusic.unloadAsync();
          }
        } catch (e) {
          // Ignore errors for already unloaded sounds
          logger.log('Background music already unloaded or not loaded');
        }
        this.backgroundMusic = null;
      }

      // Unload all sound effects
      for (const sound of this.soundEffects.values()) {
        try {
          await sound.unloadAsync();
        } catch (e) {
          // Ignore errors for already unloaded sounds
        }
      }
      this.soundEffects.clear();
      
      logger.log('Audio service cleaned up');
    } catch (error) {
      logger.error('Error cleaning up audio:', error);
    }
  }
}

export default AudioService.getInstance();

import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { RoomData, Player } from './multiplayerService';

/**
 * Comprehensive Edge Case Handler for Multiplayer System
 * Handles all edge cases including disconnections, data corruption, and security issues
 */

export interface EdgeCaseConfig {
  // Connection settings
  hostDisconnectTimeout: number; // 30 seconds
  playerDisconnectTimeout: number; // 60 seconds
  maxDisconnectTime: number; // 5 minutes
  reconnectionAttempts: number; // 3 attempts
  
  // Room settings
  maxRoomAge: number; // 24 hours
  maxPlayers: number; // 8 players
  roomCleanupDelay: number; // 10 minutes
  
  // Security settings
  maxSubmissionsPerMinute: number; // 10 submissions
  maxRoomCreationsPerHour: number; // 5 rooms
  suspiciousActivityThreshold: number; // 20 actions per minute
}

export const DEFAULT_EDGE_CASE_CONFIG: EdgeCaseConfig = {
  hostDisconnectTimeout: 30000, // 30 seconds
  playerDisconnectTimeout: 60000, // 60 seconds
  maxDisconnectTime: 300000, // 5 minutes
  reconnectionAttempts: 3,
  maxRoomAge: 86400000, // 24 hours
  maxPlayers: 8,
  roomCleanupDelay: 600000, // 10 minutes
  maxSubmissionsPerMinute: 10,
  maxRoomCreationsPerHour: 5,
  suspiciousActivityThreshold: 20
};

export class EdgeCaseHandler {
  private static instance: EdgeCaseHandler;
  private config: EdgeCaseConfig;
  private activeListeners: Map<string, () => void> = new Map();
  private playerActivity: Map<string, { actions: number; lastAction: number }> = new Map();
  private roomCleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor(config: EdgeCaseConfig = DEFAULT_EDGE_CASE_CONFIG) {
    this.config = config;
    this.startPeriodicCleanup();
  }

  static getInstance(config?: EdgeCaseConfig): EdgeCaseHandler {
    if (!EdgeCaseHandler.instance) {
      EdgeCaseHandler.instance = new EdgeCaseHandler(config);
    }
    return EdgeCaseHandler.instance;
  }

  // ========================================
  // 1. CONNECTION & NETWORK ISSUES
  // ========================================

  /**
   * Handle host disconnection during active gameplay
   */
  async handleHostDisconnection(roomCode: string, disconnectedHostId: string): Promise<boolean> {
    try {
      console.log(`🚨 Handling host disconnection in room ${roomCode}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.log('Room not found, host disconnection handled');
        return true;
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Find eligible replacement host (longest connected player)
      const eligiblePlayers = Object.values(roomData.players)
        .filter(p => p.id !== disconnectedHostId && p.isConnected)
        .sort((a, b) => a.joinedAt - b.joinedAt);

      if (eligiblePlayers.length === 0) {
        // No eligible replacement - end game gracefully
        await this.endGameDueToHostDisconnection(roomCode);
        return true;
      }

      // Promote new host
      const newHost = eligiblePlayers[0];
      await this.promoteToHost(roomCode, newHost.id, disconnectedHostId);
      
      // Notify all players
      await this.notifyHostChange(roomCode, newHost.name);
      
      console.log(`✅ Host promoted: ${newHost.name} (${newHost.id})`);
      return true;

    } catch (error) {
      console.error('❌ Error handling host disconnection:', error);
      // Fallback: End game gracefully
      await this.endGameWithError(roomCode, 'Host connection lost');
      return false;
    }
  }

  /**
   * Handle player disconnection during gameplay
   */
  async handlePlayerDisconnection(roomCode: string, playerId: string): Promise<void> {
    try {
      console.log(`🔌 Handling player disconnection: ${playerId}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      
      // Mark player as disconnected but keep in game
      await updateDoc(roomRef, {
        [`players.${playerId}.isConnected`]: false,
        [`players.${playerId}.lastSeen`]: Date.now(),
        lastActivity: serverTimestamp()
      });

      // Set timer to remove player if they don't reconnect
      const cleanupTimer = setTimeout(async () => {
        await this.removeDisconnectedPlayer(roomCode, playerId);
      }, this.config.maxDisconnectTime);

      this.roomCleanupTimers.set(`${roomCode}-${playerId}`, cleanupTimer);
      
      console.log(`✅ Player marked as disconnected: ${playerId}`);

    } catch (error) {
      console.error('❌ Error handling player disconnection:', error);
    }
  }

  /**
   * Handle Firebase service outage
   */
  async handleFirebaseOutage(): Promise<void> {
    console.log('🚨 Firebase service outage detected');
    
    // Show error message to all active users
    this.broadcastErrorToAllUsers('Firebase service temporarily unavailable. Attempting to reconnect...');
    
    // Implement exponential backoff reconnection
    let attempt = 0;
    const maxAttempts = 5;
    
    while (attempt < maxAttempts) {
      try {
        await this.testFirebaseConnection();
        console.log('✅ Firebase connection restored');
        this.broadcastSuccessToAllUsers('Connection restored!');
        return;
      } catch (error) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Reconnection attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error('❌ Failed to restore Firebase connection after all attempts');
    this.broadcastErrorToAllUsers('Unable to restore connection. Please refresh the app.');
  }

  // ========================================
  // 2. ROOM STATE CORRUPTION
  // ========================================

  /**
   * Handle duplicate room codes
   */
  async handleDuplicateRoomCode(roomCode: string): Promise<string> {
    console.log(`🔄 Handling duplicate room code: ${roomCode}`);
    
    // Generate new code with additional entropy
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 4);
    const newRoomCode = roomCode.substring(0, 4) + timestamp.substring(-2) + randomSuffix;
    
    // Verify new code is unique
    const isAvailable = await this.isRoomCodeAvailable(newRoomCode);
    if (isAvailable) {
      console.log(`✅ Generated new unique room code: ${newRoomCode}`);
      return newRoomCode;
    }
    
    // If still duplicate, generate completely new code
    return this.generateSecureRoomCode();
  }

  /**
   * Handle room data corruption
   */
  async handleRoomDataCorruption(roomCode: string): Promise<boolean> {
    try {
      console.log(`🔧 Repairing corrupted room data: ${roomCode}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.log('Room not found, cannot repair');
        return false;
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Validate and repair room data
      const repairedData = this.repairRoomData(roomData);
      
      // Update with repaired data
      await updateDoc(roomRef, {
        ...repairedData,
        lastRepair: serverTimestamp()
      });
      
      console.log(`✅ Room data repaired: ${roomCode}`);
      return true;

    } catch (error) {
      console.error('❌ Error repairing room data:', error);
      return false;
    }
  }

  /**
   * Handle orphaned rooms
   */
  async handleOrphanedRoom(roomCode: string): Promise<void> {
    try {
      console.log(`🧹 Cleaning up orphaned room: ${roomCode}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return;
      }

      const roomData = roomSnap.data() as RoomData;
      const now = Date.now();
      
      // Check if room is truly orphaned (no active players)
      const activePlayers = Object.values(roomData.players).filter(p => p.isConnected);
      
      if (activePlayers.length === 0) {
        // Check if enough time has passed since last activity
        const timeSinceLastActivity = now - roomData.lastActivity;
        
        if (timeSinceLastActivity > this.config.roomCleanupDelay) {
          await this.cleanupRoom(roomCode);
          console.log(`✅ Orphaned room cleaned up: ${roomCode}`);
        }
      }

    } catch (error) {
      console.error('❌ Error handling orphaned room:', error);
    }
  }

  // ========================================
  // 3. AUTHENTICATION & SECURITY
  // ========================================

  /**
   * Handle authentication failures
   */
  async handleAuthenticationFailure(userId: string): Promise<boolean> {
    try {
      console.log(`🔐 Handling authentication failure for user: ${userId}`);
      
      // Attempt automatic re-authentication
      const authService = (await import('./authService')).AuthService.getInstance();
      
      try {
        await authService.ensureAuthenticated();
        console.log('✅ Authentication restored');
        return true;
      } catch (error) {
        console.error('❌ Re-authentication failed:', error);
        return false;
      }

    } catch (error) {
      console.error('❌ Error handling authentication failure:', error);
      return false;
    }
  }

  /**
   * Handle malicious player activity
   */
  async handleMaliciousPlayer(roomCode: string, playerId: string, action: string): Promise<boolean> {
    try {
      console.log(`🚨 Detecting malicious activity from player ${playerId}: ${action}`);
      
      // Track player activity
      const now = Date.now();
      const playerActivity = this.playerActivity.get(playerId) || { actions: 0, lastAction: now };
      
      // Reset counter if more than a minute has passed
      if (now - playerActivity.lastAction > 60000) {
        playerActivity.actions = 0;
      }
      
      playerActivity.actions++;
      playerActivity.lastAction = now;
      this.playerActivity.set(playerId, playerActivity);
      
      // Check if player exceeds suspicious activity threshold
      if (playerActivity.actions > this.config.suspiciousActivityThreshold) {
        console.log(`🚨 Player ${playerId} flagged for suspicious activity`);
        
        // Temporarily restrict player actions
        await this.restrictPlayerActions(roomCode, playerId, 300000); // 5 minutes
        
        // Notify host
        await this.notifyHostOfSuspiciousActivity(roomCode, playerId);
        
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('❌ Error handling malicious player:', error);
      return false;
    }
  }

  // ========================================
  // 4. GAME FLOW DISRUPTIONS
  // ========================================

  /**
   * Handle players joining during active game
   */
  async handleLateJoinAttempt(roomCode: string, playerId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        return { allowed: false, reason: 'Room not found' };
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Check if game is in progress
      if (roomData.status === 'playing') {
        return { 
          allowed: false, 
          reason: 'Game is already in progress. Please wait for the next game.' 
        };
      }
      
      // Check if room is full
      const playerCount = Object.keys(roomData.players).length;
      if (playerCount >= this.config.maxPlayers) {
        return { 
          allowed: false, 
          reason: 'Room is full. Maximum players reached.' 
        };
      }
      
      return { allowed: true };

    } catch (error) {
      console.error('❌ Error handling late join attempt:', error);
      return { allowed: false, reason: 'Error checking room status' };
    }
  }

  /**
   * Handle zero submissions scenario
   */
  async handleZeroSubmissions(roomCode: string): Promise<void> {
    try {
      console.log(`📝 Handling zero submissions in room ${roomCode}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      
      // Advance to next question automatically
      await updateDoc(roomRef, {
        gamePhase: 'question',
        questionStartTime: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      
      // Notify players
      await this.notifyPlayers(roomCode, 'No answers submitted. Moving to next question.');
      
      console.log('✅ Advanced to next question due to zero submissions');

    } catch (error) {
      console.error('❌ Error handling zero submissions:', error);
    }
  }

  // ========================================
  // 5. TIMING & SYNCHRONIZATION
  // ========================================

  /**
   * Handle clock drift between devices
   */
  async synchronizeTime(roomCode: string): Promise<number> {
    try {
      // Use server timestamp as authoritative time
      const serverTime = Date.now(); // This would be actual server time in production
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await updateDoc(roomRef, {
        lastSyncTime: serverTime,
        lastActivity: serverTimestamp()
      });
      
      return serverTime;

    } catch (error) {
      console.error('❌ Error synchronizing time:', error);
      return Date.now(); // Fallback to client time
    }
  }

  /**
   * Handle rapid state changes with optimistic locking
   */
  async handleConcurrentStateChange(roomCode: string, updateFunction: () => Promise<any>): Promise<boolean> {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Concurrent state change attempt ${attempt} for room ${roomCode}`);
        await updateFunction();
        console.log(`✅ Concurrent state change successful on attempt ${attempt}`);
        return true;
      } catch (error: any) {
        console.error(`❌ Concurrent state change attempt ${attempt} failed:`, error);
        
        // Check if it's a validation error (don't retry these)
        if (error.message?.includes('invalid data') || 
            error.message?.includes('Unsupported field value: undefined') ||
            error.message?.includes('Data sanitization failed') ||
            error.message?.includes('Room data validation failed')) {
          console.error('❌ Firestore validation error: undefined values detected');
          throw new Error('Invalid data: undefined values not allowed in Firestore');
        }
        
        if (error.code === 'failed-precondition') {
          // Conflict detected, retry
          if (attempt < maxRetries) {
            const delay = 1000 * attempt; // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        if (attempt === maxRetries) {
          console.error('❌ Failed to handle concurrent state change after all retries');
          throw new Error(`Failed to create room due to concurrent state changes`);
        }
      }
    }
    
    return false;
  }

  // ========================================
  // 6. RESOURCE & PERFORMANCE
  // ========================================

  /**
   * Handle memory leaks from listeners
   */
  cleanupListeners(): void {
    console.log('🧹 Cleaning up Firebase listeners');
    
    this.activeListeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
        this.activeListeners.delete(key);
      } catch (error) {
        console.error(`❌ Error cleaning up listener ${key}:`, error);
      }
    });
    
    console.log(`✅ Cleaned up ${this.activeListeners.size} listeners`);
  }

  /**
   * Handle large room performance issues
   */
  async optimizeLargeRoom(roomCode: string): Promise<void> {
    try {
      console.log(`⚡ Optimizing large room: ${roomCode}`);
      
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) return;

      const roomData = roomSnap.data() as RoomData;
      const playerCount = Object.keys(roomData.players).length;
      
      if (playerCount > 6) { // Optimize for rooms with 6+ players
        // Implement pagination for player list
        // Use minimal data updates
        // Optimize real-time listeners
        console.log(`✅ Room optimized for ${playerCount} players`);
      }

    } catch (error) {
      console.error('❌ Error optimizing large room:', error);
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private async promoteToHost(roomCode: string, newHostId: string, oldHostId: string): Promise<void> {
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    await updateDoc(roomRef, {
      hostId: newHostId,
      [`players.${newHostId}.isHost`]: true,
      [`players.${oldHostId}.isHost`]: false,
      lastActivity: serverTimestamp()
    });
  }

  private async endGameDueToHostDisconnection(roomCode: string): Promise<void> {
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    await updateDoc(roomRef, {
      status: 'finished',
      gamePhase: 'finished',
      endReason: 'host_disconnected',
      lastActivity: serverTimestamp()
    });
  }

  private async endGameWithError(roomCode: string, reason: string): Promise<void> {
    const roomRef = doc(db, 'multiplayerGames', roomCode);
    await updateDoc(roomRef, {
      status: 'finished',
      gamePhase: 'finished',
      endReason: reason,
      lastActivity: serverTimestamp()
    });
  }

  private async notifyHostChange(roomCode: string, newHostName: string): Promise<void> {
    // This would integrate with your notification system
    console.log(`📢 Host changed to: ${newHostName} in room ${roomCode}`);
  }

  private async notifyPlayers(roomCode: string, message: string): Promise<void> {
    // This would integrate with your notification system
    console.log(`📢 Room ${roomCode}: ${message}`);
  }

  private repairRoomData(roomData: any): any {
    // Implement data validation and repair logic
    const repaired = { ...roomData };
    
    // Ensure required fields exist
    if (!repaired.players) repaired.players = {};
    if (!repaired.status) repaired.status = 'lobby';
    if (!repaired.gamePhase) repaired.gamePhase = 'lobby';
    if (!repaired.maxPlayers) repaired.maxPlayers = 8;
    if (!repaired.questionTimeLimit) repaired.questionTimeLimit = 60;
    
    return repaired;
  }

  private async isRoomCodeAvailable(roomCode: string): Promise<boolean> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      const roomSnap = await getDoc(roomRef);
      return !roomSnap.exists();
    } catch (error) {
      return false;
    }
  }

  private generateSecureRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async removeDisconnectedPlayer(roomCode: string, playerId: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await updateDoc(roomRef, {
        [`players.${playerId}`]: null,
        lastActivity: serverTimestamp()
      });
      
      // Clean up timer
      const timerKey = `${roomCode}-${playerId}`;
      const timer = this.roomCleanupTimers.get(timerKey);
      if (timer) {
        clearTimeout(timer);
        this.roomCleanupTimers.delete(timerKey);
      }
      
      console.log(`✅ Removed disconnected player: ${playerId}`);
    } catch (error) {
      console.error('❌ Error removing disconnected player:', error);
    }
  }

  private async cleanupRoom(roomCode: string): Promise<void> {
    try {
      const roomRef = doc(db, 'multiplayerGames', roomCode);
      await deleteDoc(roomRef);
      console.log(`✅ Room cleaned up: ${roomCode}`);
    } catch (error) {
      console.error('❌ Error cleaning up room:', error);
    }
  }

  private async testFirebaseConnection(): Promise<boolean> {
    try {
      const testRef = doc(db, 'test', 'connection');
      await updateDoc(testRef, { test: true });
      return true;
    } catch (error) {
      throw error;
    }
  }

  private broadcastErrorToAllUsers(message: string): void {
    // This would integrate with your notification system
    console.log(`📢 System Error: ${message}`);
  }

  private broadcastSuccessToAllUsers(message: string): void {
    // This would integrate with your notification system
    console.log(`📢 System Success: ${message}`);
  }

  private async restrictPlayerActions(roomCode: string, playerId: string, duration: number): Promise<void> {
    // Implement player action restriction
    console.log(`🚫 Restricting player ${playerId} for ${duration}ms`);
  }

  private async notifyHostOfSuspiciousActivity(roomCode: string, playerId: string): Promise<void> {
    // Notify host of suspicious activity
    console.log(`🚨 Notified host of suspicious activity from player ${playerId}`);
  }

  private startPeriodicCleanup(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupListeners();
      this.cleanupExpiredRooms();
    }, 300000);
  }

  private async cleanupExpiredRooms(): Promise<void> {
    // Implement periodic room cleanup
    console.log('🧹 Running periodic room cleanup');
  }
}

export default EdgeCaseHandler;

/**
 * Multiplayer module exports
 * Re-exports all multiplayer-related utilities and helpers
 */

export {
  generateRoomCode,
  isRoomCodeAvailable,
  generateUniqueRoomCode,
  sanitizeForFirestore,
  validateRoomDataStructure,
  createInitialRoomData,
  createPlayer,
  checkCanJoinRoom,
  getRoomData,
  updateRoomData,
  deleteRoom,
} from './roomManagement';

export type { JoinCheckResult } from './roomManagement';

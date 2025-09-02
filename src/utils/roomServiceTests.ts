/**
 * Simple test utilities for the room service
 * These can be used for manual testing or debugging
 */

import { 
  createRoom, 
  joinRoom, 
  leaveRoom,
  getRoomData, 
  updateRoomGameState, 
  isRoomHost,
  RoomData 
} from '../services/roomService';

// Test user IDs
export const TEST_USER_IDS = {
  host: 'test_host_123',
  player1: 'test_player_456',
  player2: 'test_player_789',
};

/**
 * Test basic room creation and joining workflow
 */
export const testBasicRoomWorkflow = async (): Promise<void> => {
  try {
    console.log('🧪 Starting basic room workflow test...');
    
    // Step 1: Host creates room
    console.log('Step 1: Creating room...');
    const testCategory = 'Movies';
    const roomCode = await createRoom(TEST_USER_IDS.host, testCategory);
    console.log(`✅ Room created with code: ${roomCode} (Category: ${testCategory})`);
    
    // Step 2: Get room data
    console.log('Step 2: Getting room data...');
    const roomData = await getRoomData(roomCode);
    console.log('✅ Room data retrieved:', roomData);
    
    // Step 3: Check if host
    console.log('Step 3: Checking host status...');
    const isHost = await isRoomHost(roomCode, TEST_USER_IDS.host);
    const isNotHost = await isRoomHost(roomCode, TEST_USER_IDS.player1);
    console.log(`✅ Host check: ${isHost} (should be true)`);
    console.log(`✅ Non-host check: ${isNotHost} (should be false)`);
    
    // Step 4: Player joins room
    console.log('Step 4: Player joining room...');
    await joinRoom(roomCode, TEST_USER_IDS.player1);
    console.log('✅ Player joined room');
    
    // Step 5: Verify updated room data
    console.log('Step 5: Verifying updated room data...');
    const updatedRoomData = await getRoomData(roomCode);
    console.log('✅ Updated room data:', updatedRoomData);
    
    // Step 6: Update game state
    console.log('Step 6: Updating game state...');
    await updateRoomGameState(roomCode, 'starting', 'Movies');
    console.log('✅ Game state updated');
    
    // Step 7: Another player joins
    console.log('Step 7: Second player joining...');
    await joinRoom(roomCode, TEST_USER_IDS.player2);
    console.log('✅ Second player joined');
    
    // Step 8: Final room state
    console.log('Step 8: Getting final room state...');
    const finalRoomData = await getRoomData(roomCode);
    console.log('✅ Final room data:', finalRoomData);
    
    console.log('🎉 Basic room workflow test completed successfully!');
    return;
    
  } catch (error) {
    console.error('❌ Basic room workflow test failed:', error);
    throw error;
  }
};

/**
 * Test error scenarios
 */
export const testErrorScenarios = async (): Promise<void> => {
  try {
    console.log('🧪 Starting error scenarios test...');
    
    // Test 1: Join non-existent room
    console.log('Test 1: Joining non-existent room...');
    try {
      await joinRoom('NONEXIST', TEST_USER_IDS.player1);
      console.log('❌ Should have thrown error for non-existent room');
    } catch (error) {
      console.log('✅ Correctly threw error for non-existent room:', (error as Error).message);
    }
    
    // Test 2: Empty room code
    console.log('Test 2: Empty room code...');
    try {
      await joinRoom('', TEST_USER_IDS.player1);
      console.log('❌ Should have thrown error for empty room code');
    } catch (error) {
      console.log('✅ Correctly threw error for empty room code:', (error as Error).message);
    }
    
    // Test 3: Empty user ID
    console.log('Test 3: Empty user ID...');
    try {
      await createRoom('', 'Movies');
      console.log('❌ Should have thrown error for empty user ID');
    } catch (error) {
      console.log('✅ Correctly threw error for empty user ID:', (error as Error).message);
    }

    // Test 4: Empty category
    console.log('Test 4: Empty category...');
    try {
      await createRoom('test_user', '');
      console.log('❌ Should have thrown error for empty category');
    } catch (error) {
      console.log('✅ Correctly threw error for empty category:', (error as Error).message);
    }
    
    console.log('🎉 Error scenarios test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error scenarios test failed:', error);
    throw error;
  }
};

/**
 * Test room capacity limits
 */
export const testRoomCapacity = async (): Promise<void> => {
  try {
    console.log('🧪 Starting room capacity test...');
    
    // Create room with capacity of 2
    const roomCode = await createRoom(TEST_USER_IDS.host, 'Sports', 2);
    console.log(`✅ Room created with capacity 2: ${roomCode}`);
    
    // Add first player
    await joinRoom(roomCode, TEST_USER_IDS.player1);
    console.log('✅ First player joined');
    
    // Try to add third player (should fail)
    try {
      await joinRoom(roomCode, TEST_USER_IDS.player2);
      console.log('❌ Should have thrown error for room capacity exceeded');
    } catch (error) {
      console.log('✅ Correctly threw error for capacity exceeded:', (error as Error).message);
    }
    
    console.log('🎉 Room capacity test completed successfully!');
    
  } catch (error) {
    console.error('❌ Room capacity test failed:', error);
    throw error;
  }
};

/**
 * Comprehensive test suite
 */
export const runAllTests = async (): Promise<void> => {
  console.log('🚀 Starting comprehensive room service test suite...\n');
  
  try {
    await testBasicRoomWorkflow();
    console.log('');
    
    await testErrorScenarios();
    console.log('');
    
    await testRoomCapacity();
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    throw error;
  }
};

/**
 * Helper function to generate test room code for manual testing
 */
export const createTestRoom = async (hostId?: string, category?: string): Promise<string> => {
  const actualHostId = hostId || `test_host_${Date.now()}`;
  const actualCategory = category || 'Movies';
  return await createRoom(actualHostId, actualCategory);
};

/**
 * Helper function to simulate multiple players joining a room
 */
export const simulateMultipleJoins = async (roomCode: string, playerCount: number = 3): Promise<void> => {
  const promises = [];
  
  for (let i = 1; i <= playerCount; i++) {
    const playerId = `test_player_${Date.now()}_${i}`;
    promises.push(joinRoom(roomCode, playerId));
  }
  
  await Promise.all(promises);
  console.log(`✅ ${playerCount} players joined room ${roomCode}`);
};

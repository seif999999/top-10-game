/**
 * Firebase Emulator Load Test Script
 * 
 * Simulates 1000 concurrent users to test app scalability
 * 
 * Usage:
 *   1. Start Firebase Emulator: firebase emulators:start
 *   2. Run this script: node test/load-test.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  connectFirestoreEmulator, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} = require('firebase/firestore');
const { 
  getAuth, 
  connectAuthEmulator, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} = require('firebase/auth');

// Firebase config for emulator (projectId can be anything for emulator)
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test.firebaseapp.com',
  projectId: 'demo-test',
  storageBucket: 'demo-test.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

// Test configuration
const TOTAL_USERS = 1000;
const BATCH_SIZE = 50; // Process users in batches to avoid overwhelming
const COLLECTIONS = {
  USER_PROFILES: 'userProfiles',
  MULTIPLAYER_GAMES: 'multiplayerGames',
};

// Statistics tracking
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  errors: [],
  startTime: null,
  endTime: null
};

/**
 * Simulate a single user's complete journey
 */
async function simulateUser(userId) {
  const userStats = {
    userId,
    operations: 0,
    errors: []
  };

  try {
    // 1. Create user account
    const email = `user${userId}@test.com`;
    const password = 'testpass123';
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      userStats.operations++;
    } catch (error) {
      // If user already exists, try to sign in
      if (error.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, email, password);
        userStats.operations++;
      } else {
        throw error;
      }
    }

    // 2. Create/Update user profile
    const userProfileRef = doc(db, COLLECTIONS.USER_PROFILES, `user_${userId}`);
    await setDoc(userProfileRef, {
      id: `user_${userId}`,
      email: email,
      displayName: `User ${userId}`,
      coins: Math.floor(Math.random() * 1000),
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      isPublic: Math.random() > 0.5, // Random public/private
      selectedAvatar: `avatar_${Math.floor(Math.random() * 10)}`,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0
      }
    }, { merge: true });
    userStats.operations++;

    // 3. Read user profile (simulate loading profile)
    const profileDoc = await getDoc(userProfileRef);
    if (profileDoc.exists()) {
      userStats.operations++;
    }

    // 4. Create a multiplayer room (simulate hosting)
    const roomCode = `ROOM${String(userId).padStart(6, '0')}`;
    const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);
    
    await setDoc(roomRef, {
      roomCode: roomCode,
      hostId: `user_${userId}`,
      createdAt: serverTimestamp(),
      status: 'lobby',
      gamePhase: 'lobby',
      category: 'general',
      questions: [],
      currentQuestionIndex: 0,
      players: {
        [`user_${userId}`]: {
          id: `user_${userId}`,
          name: `User ${userId}`,
          score: 0,
          isHost: true,
          joinedAt: Date.now(),
          isConnected: true,
          lastSeen: Date.now()
        }
      },
      scores: {
        [`user_${userId}`]: 0
      },
      turnOrder: [`user_${userId}`],
      currentTurnIndex: 0,
      currentAnswers: [],
      revealedAnswers: Array(10).fill(null),
      answersSubmittedCount: 0,
      playerSubmissions: {},
      maxPlayers: 4,
      isPrivate: false,
      lastActivity: Date.now(),
      turnTimeLimit: 60,
      questionTimeLimit: 60
    });
    userStats.operations++;

    // 5. Read the room (simulate loading room)
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists()) {
      userStats.operations++;
    }

    // 6. Simulate game actions (submit answers, update scores)
    // Simulate 5 game actions per user
    for (let i = 0; i < 5; i++) {
      try {
        // Update player submission
        await updateDoc(roomRef, {
          [`playerSubmissions.user_${userId}`]: {
            answer: `Answer ${i} from user ${userId}`,
            isCorrect: Math.random() > 0.5,
            points: Math.floor(Math.random() * 10),
            timestamp: serverTimestamp()
          },
          [`scores.user_${userId}`]: Math.floor(Math.random() * 100),
          lastActivity: Date.now()
        });
        userStats.operations++;

        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        userStats.errors.push(`Action ${i}: ${error.message}`);
      }
    }

    // 7. Update user profile stats
    await updateDoc(userProfileRef, {
      'stats.gamesPlayed': Math.floor(Math.random() * 10),
      'stats.gamesWon': Math.floor(Math.random() * 5),
      'stats.totalScore': Math.floor(Math.random() * 1000),
      lastUpdated: serverTimestamp()
    });
    userStats.operations++;

    stats.success++;
    return userStats;

  } catch (error) {
    stats.failed++;
    userStats.errors.push(error.message);
    stats.errors.push({
      userId,
      error: error.message,
      code: error.code
    });
    return userStats;
  }
}

/**
 * Run load test with batching
 */
async function runLoadTest(userCount = TOTAL_USERS) {
  console.log('\n🚀 Starting Firebase Emulator Load Test');
  console.log('=' .repeat(50));
  console.log(`📊 Target Users: ${userCount}`);
  console.log(`📦 Batch Size: ${BATCH_SIZE}`);
  console.log('=' .repeat(50));
  console.log('\n⏳ Make sure Firebase Emulator is running: firebase emulators:start\n');

  stats.startTime = Date.now();
  let completed = 0;

  // Process users in batches
  for (let i = 0; i < userCount; i += BATCH_SIZE) {
    const batch = [];
    const batchEnd = Math.min(i + BATCH_SIZE, userCount);
    
    // Create batch of promises
    for (let j = i; j < batchEnd; j++) {
      batch.push(simulateUser(j));
    }

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batch);
    
    // Count successes and failures in this batch
    const batchSuccess = batchResults.filter(r => r.status === 'fulfilled').length;
    const batchFailed = batchResults.filter(r => r.status === 'rejected').length;
    
    completed += batch.length;
    const progress = ((completed / userCount) * 100).toFixed(1);
    
    console.log(`📊 Progress: ${completed}/${userCount} users (${progress}%) | ✅ ${stats.success} success | ❌ ${stats.failed} failed`);

    // Small delay between batches to avoid overwhelming
    if (i + BATCH_SIZE < userCount) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  stats.endTime = Date.now();
  const duration = (stats.endTime - stats.startTime) / 1000;

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('✅ Load Test Complete!');
  console.log('='.repeat(50));
  console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
  console.log(`👥 Total Users: ${userCount}`);
  console.log(`✅ Successful: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`📈 Success Rate: ${((stats.success / userCount) * 100).toFixed(2)}%`);
  console.log(`⚡ Throughput: ${(userCount / duration).toFixed(2)} users/second`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (showing first 10):`);
    stats.errors.slice(0, 10).forEach((err, idx) => {
      console.log(`   ${idx + 1}. User ${err.userId}: ${err.error} (${err.code || 'N/A'})`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more errors`);
    }
  }

  console.log('\n💡 Next Steps:');
  console.log('   1. Check Firebase Emulator UI: http://localhost:4000');
  console.log('   2. Review Firestore data in the emulator');
  console.log('   3. Check for any errors or race conditions');
  console.log('   4. Analyze performance bottlenecks\n');
}

// Handle command line arguments
const userCount = process.argv[2] ? parseInt(process.argv[2], 10) : TOTAL_USERS;

// Run the test
runLoadTest(userCount)
  .then(() => {
    console.log('✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });

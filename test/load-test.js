/**
 * Firebase Emulator Load Test Script
 * 
 * Simulates 1000 concurrent users to test app scalability
 * 
 * Usage:
 *   1. Start Firebase Emulator: firebase emulators:start
 *   2. Run this script: node test/load-test.js
 */

const { initializeApp, getApps } = require('firebase/app');
const { 
  getFirestore, 
  connectFirestoreEmulator, 
  doc, 
  setDoc, 
  getDoc,
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

/** Get a dedicated Firebase app/auth/db for this userId so concurrent users don't overwrite auth.currentUser */
function getFirebaseForUser(userId) {
  const appName = `loadtest_${userId}`;
  const existing = getApps().find((a) => a.name === appName);
  const app = existing || initializeApp(firebaseConfig, appName);
  const db = getFirestore(app);
  const auth = getAuth(app);
  if (!existing) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  }
  return { app, db, auth };
}

// Test configuration
const TOTAL_USERS = 1000;
const BATCH_SIZE = 50; // Process users in batches to avoid overwhelming
const COLLECTIONS = {
  USER_PROFILES: 'userProfiles',
  MULTIPLAYER_GAMES: 'multiplayerGames',
};

/** Keys for per-step timing (same order as simulateUser) */
const STEP_KEYS = [
  'auth',
  'profileWrite',
  'profileRead',
  'roomCreate',
  'roomRead',
  'gameActions',
  'profileStatsUpdate',
];

// Statistics tracking
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  errors: [],
  startTime: null,
  endTime: null,
  /** Per-user response times (full flow) in ms — only for successful users */
  latenciesMs: [],
  /** Per-step arrays of ms (successful users only) */
  stepLatencies: Object.fromEntries(STEP_KEYS.map((k) => [k, []])),
};

/**
 * Simulate a single user's complete journey
 */
async function simulateUser(userId) {
  const t0 = Date.now();
  const userStats = {
    userId,
    operations: 0,
    errors: [],
    latencyMs: 0,
    stepMs: Object.fromEntries(STEP_KEYS.map((k) => [k, 0])),
  };

  const { db, auth } = getFirebaseForUser(userId);

  try {
    // 1. Create user account
    const email = `user${userId}@test.com`;
    const password = 'testpass123';

    let t = Date.now();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      userStats.operations++;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        await signInWithEmailAndPassword(auth, email, password);
        userStats.operations++;
      } else {
        throw error;
      }
    }
    userStats.stepMs.auth = Date.now() - t;

    // Firestore rules require document IDs and hostId/players to use request.auth.uid
    const uid = auth.currentUser.uid;

    // 2. Create/Update user profile (document ID must be auth UID per security rules)
    const userProfileRef = doc(db, COLLECTIONS.USER_PROFILES, uid);
    t = Date.now();
    await setDoc(userProfileRef, {
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
    userStats.stepMs.profileWrite = Date.now() - t;

    // 3. Read user profile (simulate loading profile)
    t = Date.now();
    const profileDoc = await getDoc(userProfileRef);
    userStats.stepMs.profileRead = Date.now() - t;
    if (profileDoc.exists()) {
      userStats.operations++;
    }

    // 4. Create a multiplayer room (simulate hosting) - hostId/players must use auth UID per rules
    const roomCode = `ROOM${String(userId).padStart(6, '0')}`;
    const roomRef = doc(db, COLLECTIONS.MULTIPLAYER_GAMES, roomCode);

    t = Date.now();
    await setDoc(roomRef, {
      roomCode: roomCode,
      hostId: uid,
      createdAt: serverTimestamp(),
      status: 'lobby',
      gamePhase: 'lobby',
      category: 'general',
      questions: [],
      currentQuestionIndex: 0,
      players: {
        [uid]: {
          id: uid,
          name: `User ${userId}`,
          score: 0,
          isHost: true,
          joinedAt: Date.now(),
          isConnected: true,
          lastSeen: Date.now()
        }
      },
      scores: {
        [uid]: 0
      },
      turnOrder: [uid],
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
    userStats.stepMs.roomCreate = Date.now() - t;

    // 5. Read the room (simulate loading room)
    t = Date.now();
    const roomDoc = await getDoc(roomRef);
    userStats.stepMs.roomRead = Date.now() - t;
    if (roomDoc.exists()) {
      userStats.operations++;
    }

    // 6. Simulate game actions (submit answers, update scores) - use auth UID for participant fields
    t = Date.now();
    for (let i = 0; i < 5; i++) {
      try {
        await updateDoc(roomRef, {
          [`playerSubmissions.${uid}`]: {
            answer: `Answer ${i} from user ${userId}`,
            isCorrect: Math.random() > 0.5,
            points: Math.floor(Math.random() * 10),
            timestamp: serverTimestamp()
          },
          [`scores.${uid}`]: Math.floor(Math.random() * 100),
          lastActivity: Date.now()
        });
        userStats.operations++;

        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        userStats.errors.push(`Action ${i}: ${error.message}`);
      }
    }
    userStats.stepMs.gameActions = Date.now() - t;

    // 7. Update user profile stats
    t = Date.now();
    await updateDoc(userProfileRef, {
      'stats.gamesPlayed': Math.floor(Math.random() * 10),
      'stats.gamesWon': Math.floor(Math.random() * 5),
      'stats.totalScore': Math.floor(Math.random() * 1000),
      lastUpdated: serverTimestamp()
    });
    userStats.operations++;
    userStats.stepMs.profileStatsUpdate = Date.now() - t;

    stats.success++;
    userStats.latencyMs = Date.now() - t0;
    stats.latenciesMs.push(userStats.latencyMs);
    STEP_KEYS.forEach((k) => stats.stepLatencies[k].push(userStats.stepMs[k]));
    return userStats;

  } catch (error) {
    stats.failed++;
    userStats.latencyMs = Date.now() - t0;
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
 * Compute percentile from sorted array (0-100).
 */
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(Math.ceil((p / 100) * sortedArr.length) - 1, sortedArr.length - 1);
  return sortedArr[Math.max(0, idx)];
}

function summarizeStep(samples) {
  if (!samples || samples.length === 0) return null;
  const sorted = samples.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((s, n) => s + n, 0);
  const avg = sum / sorted.length;
  const p95 = percentile(sorted, 95);
  return { min: sorted[0], avg, p95, max: sorted[sorted.length - 1], n: sorted.length };
}

/**
 * Run load test with batching
 */
async function runLoadTest(userCount = TOTAL_USERS) {
  stats.success = 0;
  stats.failed = 0;
  stats.errors = [];
  stats.latenciesMs = [];
  STEP_KEYS.forEach((k) => {
    stats.stepLatencies[k] = [];
  });

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

  // Response time metrics (successful users only)
  const latencies = stats.latenciesMs.slice().sort((a, b) => a - b);
  const avgMs = latencies.length ? latencies.reduce((s, n) => s + n, 0) / latencies.length : 0;
  const minMs = latencies.length ? latencies[0] : 0;
  const maxMs = latencies.length ? latencies[latencies.length - 1] : 0;
  const p50Ms = percentile(latencies, 50);
  const p95Ms = percentile(latencies, 95);

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
  console.log('\n📐 Response time (per user, successful only):');
  console.log(`   Min:   ${minMs.toFixed(0)} ms`);
  console.log(`   Avg:   ${avgMs.toFixed(0)} ms`);
  console.log(`   P50:   ${p50Ms.toFixed(0)} ms`);
  console.log(`   P95:   ${p95Ms.toFixed(0)} ms`);
  console.log(`   Max:   ${maxMs.toFixed(0)} ms`);
  if (latencies.length > 0) {
    const verdict = p95Ms <= 200 ? '✅ Good (p95 ≤ 200 ms)' : (p95Ms <= 500 ? '⚠️ Acceptable (p95 ≤ 500 ms)' : '❌ Slow (p95 > 500 ms)');
    console.log(`   Verdict: ${verdict}`);
  }

  const phaseLabels = [
    ['auth', '1. Sign up / sign in (Auth)'],
    ['profileWrite', '2. Save profile (Firestore write)'],
    ['profileRead', '3. Load profile (Firestore read)'],
    ['roomCreate', '4. Create game room (Firestore write)'],
    ['roomRead', '5. Load room (Firestore read)'],
    ['gameActions', '6. Five answer/score updates (like in-game)'],
    ['profileStatsUpdate', '7. Final profile stats update'],
  ];
  console.log('\n📊 Time per operation (successful users only, milliseconds):');
  console.log('   (min / avg / p95 / max — lower is faster)');
  for (const [key, label] of phaseLabels) {
    const s = summarizeStep(stats.stepLatencies[key]);
    if (!s) continue;
    console.log(
      `   ${label}`,
    );
    console.log(
      `        min=${s.min.toFixed(0)}  avg=${s.avg.toFixed(0)}  p95=${s.p95.toFixed(0)}  max=${s.max.toFixed(0)}  (n=${s.n})`,
    );
  }
  console.log('   (Runs on your PC via Emulator — good for comparing before/after changes.)\n');

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

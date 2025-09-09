/**
 * Firestore Security Rules Test
 * Tests the security rules to ensure proper access control
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, signInAnonymously, signOut } from 'firebase/auth';

// Mock Firebase config for testing
const firebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "test-app-id"
};

describe('Firestore Security Rules', () => {
  let app: any;
  let db: any;
  let auth: any;

  beforeAll(async () => {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Connect to emulators
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
  });

  beforeEach(async () => {
    // Sign out any existing user
    try {
      await signOut(auth);
    } catch (error) {
      // Ignore if no user is signed in
    }
  });

  describe('User Profiles Security', () => {
    test('should allow users to read and write their own profile', async () => {
      // Sign in as a test user
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      const userProfileRef = doc(db, 'userProfiles', userId);
      const testProfile = {
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        isPublic: false
      };

      // Should be able to write own profile
      await expect(setDoc(userProfileRef, testProfile)).resolves.not.toThrow();

      // Should be able to read own profile
      const docSnap = await getDoc(userProfileRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.displayName).toBe('Test User');
    });

    test('should deny access to other users profiles when not public', async () => {
      // Sign in as user 1
      const user1Credential = await signInAnonymously(auth);
      const user1Id = user1Credential.user.uid;

      // Create a profile for user 1
      const user1ProfileRef = doc(db, 'userProfiles', user1Id);
      await setDoc(user1ProfileRef, {
        email: 'user1@example.com',
        displayName: 'User 1',
        isPublic: false
      });

      // Sign out and sign in as user 2
      await signOut(auth);
      const user2Credential = await signInAnonymously(auth);
      const user2Id = user2Credential.user.uid;

      // Should not be able to read user 1's private profile
      await expect(getDoc(user1ProfileRef)).rejects.toThrow();

      // Should not be able to write to user 1's profile
      await expect(setDoc(user1ProfileRef, {
        displayName: 'Hacked User'
      })).rejects.toThrow();
    });

    test('should allow reading public profiles', async () => {
      // Sign in as user 1
      const user1Credential = await signInAnonymously(auth);
      const user1Id = user1Credential.user.uid;

      // Create a public profile for user 1
      const user1ProfileRef = doc(db, 'userProfiles', user1Id);
      await setDoc(user1ProfileRef, {
        email: 'user1@example.com',
        displayName: 'Public User 1',
        isPublic: true
      });

      // Sign out and sign in as user 2
      await signOut(auth);
      const user2Credential = await signInAnonymously(auth);

      // Should be able to read user 1's public profile
      const docSnap = await getDoc(user1ProfileRef);
      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()?.displayName).toBe('Public User 1');
    });
  });

  describe('Multiplayer Games Security', () => {
    test('should allow authenticated users to create rooms', async () => {
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      const roomRef = doc(db, 'multiplayerGames', 'TEST123');
      const testRoom = {
        hostId: userId,
        players: {
          [userId]: {
            id: userId,
            name: 'Test Host',
            isHost: true,
            isReady: false
          }
        },
        status: 'lobby',
        createdAt: new Date()
      };

      // Should be able to create room
      await expect(setDoc(roomRef, testRoom)).resolves.not.toThrow();
    });

    test('should deny room creation with invalid data', async () => {
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      const roomRef = doc(db, 'multiplayerGames', 'TEST456');
      const invalidRoom = {
        hostId: 'different-user-id', // Wrong host ID
        players: {
          [userId]: {
            id: userId,
            name: 'Test Host',
            isHost: true,
            isReady: false
          }
        },
        status: 'lobby'
      };

      // Should be denied due to invalid host ID
      await expect(setDoc(roomRef, invalidRoom)).rejects.toThrow();
    });

    test('should allow room participants to update room', async () => {
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      // Create a room
      const roomRef = doc(db, 'multiplayerGames', 'TEST789');
      const testRoom = {
        hostId: userId,
        players: {
          [userId]: {
            id: userId,
            name: 'Test Host',
            isHost: true,
            isReady: false
          }
        },
        status: 'lobby',
        createdAt: new Date()
      };
      await setDoc(roomRef, testRoom);

      // Should be able to update room as participant
      await expect(updateDoc(roomRef, {
        status: 'starting'
      })).resolves.not.toThrow();
    });

    test('should deny access to test collection', async () => {
      const userCredential = await signInAnonymously(auth);
      const testRef = doc(db, 'test', 'testDoc');

      // Should be denied access to test collection
      await expect(setDoc(testRef, { test: 'data' })).rejects.toThrow();
      await expect(getDoc(testRef)).rejects.toThrow();
    });
  });

  describe('Unauthenticated Access', () => {
    test('should deny all access when not authenticated', async () => {
      // Ensure no user is signed in
      await signOut(auth);

      const userProfileRef = doc(db, 'userProfiles', 'test-user');
      const roomRef = doc(db, 'multiplayerGames', 'TEST999');

      // Should be denied access to user profiles
      await expect(getDoc(userProfileRef)).rejects.toThrow();
      await expect(setDoc(userProfileRef, { test: 'data' })).rejects.toThrow();

      // Should be denied access to multiplayer games
      await expect(getDoc(roomRef)).rejects.toThrow();
      await expect(setDoc(roomRef, { test: 'data' })).rejects.toThrow();
    });
  });
});

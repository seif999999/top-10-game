import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GameStats, UserProfile } from '../../shared/types';
import { COLLECTIONS } from '../utils/constants';

export const createUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<void> => {
  const ref = doc(db, COLLECTIONS.USER_PROFILES, userId);
  await setDoc(ref, {
    ...userData,
    createdAt: serverTimestamp(),
    stats: userData.stats ?? { gamesPlayed: 0, wins: 0, totalScore: 0, averageScore: 0 },
    coins: userData.coins ?? 0 // Default to 0 coins for new users
  }, { merge: true });
};

type UserProfileDoc = Partial<UserProfile> & {
  createdAt?: { toDate?: () => Date };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const ref = doc(db, COLLECTIONS.USER_PROFILES, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as UserProfileDoc;
  return {
    id: userId,
    email: data.email ?? '',
    displayName: data.displayName,
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    stats: data.stats,
    coins: data.coins ?? 0 // Default to 0 if not set
  };
};

export const updateUserStats = async (userId: string, stats: Partial<GameStats>): Promise<void> => {
  const ref = doc(db, COLLECTIONS.USER_PROFILES, userId);
  await updateDoc(ref, { stats });
};



import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GameStats, UserProfile } from '../types';

export const createUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await setDoc(ref, {
    ...userData,
    createdAt: serverTimestamp(),
    stats: userData.stats ?? { gamesPlayed: 0, wins: 0, totalScore: 0, averageScore: 0 }
  }, { merge: true });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: userId,
    email: data.email ?? '',
    displayName: data.displayName,
    createdAt: data.createdAt?.toDate?.() ?? undefined,
    stats: data.stats
  };
};

export const updateUserStats = async (userId: string, stats: Partial<GameStats>): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { stats });
};



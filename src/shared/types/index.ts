export type GameStats = {
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  averageScore: number;
};

/** Single coin transaction for history (stored in userProfiles/{userId}/coinTransactions). */
export interface CoinTransaction {
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  timestamp: Date;
}

export type User = {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: Date;
  stats?: GameStats;
  selectedAvatar?: string; // Avatar ID or undefined for no avatar
  avatarUrl?: string; // Cached avatar URL
  coins?: number; // Coin balance (defaults to 0)
  /** Legacy: one-time coin purchase for ad-free. Kept for backward compatibility. */
  adFree?: boolean;
  /** Subscription premium: monthly (60 EGP), quarterly (150 EGP), yearly (500 EGP). */
  premiumType?: 'monthly' | 'quarterly' | 'yearly';
  /** Timestamp (ms) when subscription expires. Undefined = not subscribed or legacy adFree. */
  premiumExpiresAt?: number;
  /** Timestamp (ms) when premium was purchased. */
  premiumPurchasedAt?: number;
  /** 2 for premium users (double daily rewards), 1 otherwise. */
  dailyRewardMultiplier?: number;
  /** VIP badge for premium subscribers. */
  hasVIPBadge?: boolean;
  /** Populated when explicitly loading transaction history (e.g. CoinService.getCoinTransactions). */
  coinTransactions?: CoinTransaction[];
  // Daily streak fields
  lastLoginDate?: Date; // Last time user claimed daily reward
  currentStreak?: number; // Consecutive days logged in (1-7, resets each week)
  currentWeek?: number; // Which week they're on (1, 2, 3, etc.) - determines reward multiplier
};

export type UserProfile = User;

export type Avatar = {
  id: string;
  name: string;
  url: string;
  description: string;
};

export interface CustomQuestion {
  id: string;
  question: string;
  answers: string[];
  createdAt: Date;
  lastPlayed?: Date;
  playCount: number;
}

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type Lobby = {
  id: string;
  hostUserId: string;
  categoryId: string;
  players: string[];
  isStarted: boolean;
};

export type GameRoom = {
  id: string;
  players: string[];
  category: string;
  isActive: boolean;
  createdAt: Date;
};

export type Question = {
  id: string;
  category: string;
  title: string;
  answers: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};

export interface QuestionAnswer {
  text: string;
  rank: number;
  points: number;
  normalized?: string;
  aliases?: string[];
}

export interface GameQuestion {
  id: string;
  category: string;
  title: string;
  answers: QuestionAnswer[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PlayerAnswer {
  playerId: string;
  answer: string;
  timeTaken: number;
  isCorrect: boolean;
  rank?: number;
  points?: number;
  similarity?: number;
}

export interface GameRound {
  question: GameQuestion;
  playerAnswers: PlayerAnswer[];
  roundNumber: number;
  timeLimit: number;
}

export interface GameState {
  gameId: string;
  category: string;
  players: string[];
  currentRound: number;
  totalRounds: number;
  rounds: GameRound[];
  scores: { [playerId: string]: number };
  gamePhase: 'lobby' | 'question' | 'answered' | 'results' | 'finished';
  timeRemaining: number;
  currentQuestion?: GameQuestion;
  roundStartTime?: number;
  shuffledQuestions?: GameQuestion[]; // OFFLINE ONLY - For team mode
}

export interface GameResults {
  gameId: string;
  category: string;
  players: string[];
  finalScores: { [playerId: string]: number };
  roundResults: GameRound[];
  winner: string;
  totalTime: number;
  averageScore: number;
  bestAnswer?: PlayerAnswer;
}

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  pendingAction: boolean;
  /** One-time message after receiving welcome coins (e.g. "Welcome! You've received 100 coins to get started!"). Clear after showing. */
  welcomeCoinsMessage: string | null;
  clearWelcomeCoinsMessage: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; avatarId?: string }) => Promise<void>;
  updateUserAvatar: (selectedAvatar: string | undefined) => Promise<void>;
  getUserProfileWithAvatar: () => Promise<User | null>;
};

// Re-export mission types
export * from './missions';

// Re-export ad types
export * from './ads';



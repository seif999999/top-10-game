export type GameStats = {
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  averageScore: number;
};

export type User = {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: Date;
  stats?: GameStats;
};

export type UserProfile = User;

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
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
};



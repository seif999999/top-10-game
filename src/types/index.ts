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

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};



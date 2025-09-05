// Unified game types for single-player and multiplayer consistency
// This replaces the fragmented Question/GameQuestion types across the codebase

export type Answer = {
  id: string;           // stable id
  text: string;         // canonical answer text
  rank: number;         // 1..10 (1 highest)
  aliases?: string[];   // accepted nicknames
};

export type Question = {
  id: string;
  text: string;
  answers: Answer[];    // always length up to 10
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

// Legacy compatibility types for migration
export type LegacyQuestion = {
  id: string;
  text: string;
  answers: string[];    // legacy format
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

// Migration helper type
export type QuestionAnswer = {
  text: string;
  rank: number;
  points: number;
  normalized?: string;
  aliases?: string[];
};

// Room state types for multiplayer
export type RoomStatus = 'lobby' | 'playing' | 'finished';
export type GamePhase = 'lobby' | 'question' | 'answers' | 'results' | 'finished';

// Player types
export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt: number;
  isConnected: boolean;
  lastSeen: number;
};

// Room data structure
export type RoomData = {
  // Room Info
  roomCode: string;
  hostId: string;
  createdAt: number;
  status: RoomStatus;
  
  // Game Setup
  category: string;
  questions: Question[];
  currentQuestionIndex: number;
  
  // Players
  players: {
    [playerId: string]: Player;
  };
  
  // Game State
  gamePhase: GamePhase;
  questionStartTime: number;    // server timestamp
  questionTimeLimit: number;    // seconds
  roundStartTs?: number;        // server timestamp for current round
  roundDurationSeconds?: number; // duration for current round
  
  // Answers & Scoring
  currentAnswers: Answer[];     // Correct answers for current question
  revealedAnswers: string[];    // Answer texts that have been revealed
  answerOwners: { [answerText: string]: string }; // Who revealed each answer
  playerSubmissions: {
    [playerId: string]: {
      answers: string[];
      submittedAt: number;
      points: number;
    }
  };
  
  // Metadata
  maxPlayers: number;
  isPrivate: boolean;
  lastActivity: number;
};

// Answer result for processing
export type AnswerResult = {
  answer: string;
  isCorrect: boolean;
  points: number;
  similarity: number;
  rank?: number;
};

// Game result for final scoring
export type GameResult = {
  playerId: string;
  playerName: string;
  totalScore: number;
  answers: AnswerResult[];
  rank: number;
};

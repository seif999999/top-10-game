// OFFLINE ONLY - Team mode types and constants

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export interface TeamSetupConfig {
  numberOfTeams: number;
  teamNames: string[];
  roundTimer: number;
  maxRounds?: number;
  isHostedLocal: boolean;
}

export interface TeamGameState {
  teams: Team[];
  currentTeamIndex: number;
  roundTimerSeconds: number;
  timeRemaining: number;
  isTurnActive: boolean;
  isHostedLocal: boolean;
  currentRound: number;
  maxRounds?: number;
  answerAssignments: { [answerIndex: number]: { teamId: string; points: number } };
}

// Pre-defined team colors
export const TEAM_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
] as const;

// Timer options (0 = no timer/infinity)
export const ROUND_TIMER_OPTIONS = [30, 60, 90, 0] as const;

// Max rounds options
export const MAX_ROUNDS_OPTIONS = ['Unlimited', 1, 3, 5] as const;
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
  '#FF4444', // Red
  '#1E3A8A', // Dark Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
] as const;

// Timer options (0 = no timer/infinity)
export const ROUND_TIMER_OPTIONS = [30, 60, 90, 0] as const;

// Max rounds options
export const MAX_ROUNDS_OPTIONS = ['Unlimited', 1, 3, 5] as const;
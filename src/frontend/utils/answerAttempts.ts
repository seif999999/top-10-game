export interface AttemptRecord {
  text: string;
  isCorrect: boolean;
}

export function normalizeGuess(text: string): string {
  return text.toLowerCase().trim();
}

export function isDuplicateGuess(guess: string, attempts: AttemptRecord[]): boolean {
  const normalized = normalizeGuess(guess);
  if (!normalized) return false;
  return attempts.some((attempt) => normalizeGuess(attempt.text) === normalized);
}

export function appendAttempt(
  attempts: AttemptRecord[],
  text: string,
  isCorrect: boolean
): AttemptRecord[] {
  return [...attempts, { text, isCorrect }];
}

export function partitionAttempts(attempts: AttemptRecord[]): {
  correct: AttemptRecord[];
  incorrect: AttemptRecord[];
} {
  return {
    correct: attempts.filter((attempt) => attempt.isCorrect),
    incorrect: attempts.filter((attempt) => !attempt.isCorrect),
  };
}

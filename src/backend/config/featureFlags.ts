// Feature flags for controlling experimental features
export const FEATURES = {
  // OFFLINE ONLY - Teams & Turn-Based Play for single-player mode
  teamsEnabled: true, // Enable teams feature for testing
} as const;

export type FeatureFlags = typeof FEATURES;

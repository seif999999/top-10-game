# TODO Tracking

**Last Updated:** 2026-01-15

## Active TODOs

### High Priority
- [ ] **Streak calculation implementation** (src/services/statsService.ts)
  - Context: Feature placeholder, needs game history tracking
  - Requirements:
    - Define what constitutes a "streak" (e.g., consecutive wins, consecutive correct answers)
    - Implement logic to track and update `currentStreak` and `bestStreak` in user stats
    - Ensure streak is reset on loss or inactivity
  - Estimated effort: Medium
  - Blocked by: Need to decide on precise streak logic and integrate with game results processing

### Medium Priority
- [ ] **External moderation API integration** (src/services/externalModerationService.ts)
  - Context: Currently uses mock implementation for AWS Comprehend, Google Cloud Natural Language, and OpenAI Moderation API
  - Requirements:
    - Choose a primary external moderation service (e.g., Google Perspective API, AWS Comprehend, OpenAI)
    - Implement actual API calls and integrate with `moderateWithProvider`
    - Handle API keys securely (environment variables)
    - Implement error handling and fallback mechanisms
  - Estimated effort: Large
  - Blocked by: Need to choose moderation service provider and obtain API credentials

## Completed
- None yet



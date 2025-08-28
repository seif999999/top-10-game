/**
 * Simple test to verify scoring works
 */

// Test data
const testQuestion = {
  answers: [
    { text: 'Soccer', rank: 1, points: 1, normalized: 'soccer' },
    { text: 'Basketball', rank: 2, points: 2, normalized: 'basketball' },
    { text: 'Tennis', rank: 3, points: 3, normalized: 'tennis' },
    { text: 'Rugby', rank: 10, points: 10, normalized: 'rugby' }
  ]
};

// Mock game state
let gameState = {
  scores: { 'You': 0 },
  currentRound: 1,
  timeRemaining: 60
};

// Simple scoring function
function simpleScore(playerId, rank) {
  const score = rank; // Rank = points
  gameState.scores[playerId] += score;
  console.log(`✅ ${playerId} got ${score} points (rank ${rank}), total: ${gameState.scores[playerId]}`);
  return score;
}

// Test the scoring
export const testSimpleScoring = () => {
  console.log('🧪 Testing Simple Scoring System...\n');
  
  // Reset scores
  gameState.scores = { 'You': 0 };
  
  // Test multiple answers
  simpleScore('You', 1);  // Should be 1
  simpleScore('You', 3);  // Should be 4
  simpleScore('You', 10); // Should be 14
  simpleScore('You', 2);  // Should be 16
  
  console.log('\n🎉 Final Score:', gameState.scores['You']);
  console.log('Expected: 16 (1+3+10+2)');
  console.log('✅ Test Complete!');
};

export default testSimpleScoring;

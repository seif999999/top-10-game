/**
 * Test score display functionality
 */

// Mock game state
let mockGameState = {
  scores: { 'You': 0 },
  currentRound: 1,
  gamePhase: 'question'
};

// Mock functions
function mockGetPlayerScore(playerId) {
  return mockGameState.scores[playerId] || 0;
}

function mockSubmitAnswer(playerId, answer, timeRemaining) {
  // Simulate scoring
  const rank = Math.floor(Math.random() * 10) + 1; // Random rank 1-10
  const score = rank; // Simple scoring: rank = points
  
  mockGameState.scores[playerId] += score;
  
  console.log(`🎯 ${playerId} submitted "${answer}"`);
  console.log(`   Rank: ${rank}, Points: ${score}`);
  console.log(`   Total Score: ${mockGameState.scores[playerId]}`);
  
  return { rank, score, totalScore: mockGameState.scores[playerId] };
}

// Test function
export const testScoreDisplay = () => {
  console.log('🧪 Testing Score Display...\n');
  
  // Reset scores
  mockGameState.scores = { 'You': 0 };
  
  // Test multiple answers
  const answers = ['soccer', 'basketball', 'tennis', 'football'];
  
  answers.forEach((answer, index) => {
    console.log(`\n--- Answer ${index + 1} ---`);
    const result = mockSubmitAnswer('You', answer, 30);
    console.log(`Current Display Score: ${mockGetPlayerScore('You')}`);
  });
  
  console.log('\n🎉 Final Test Results:');
  console.log(`Expected Total: ${answers.length} answers with random scores`);
  console.log(`Actual Total: ${mockGameState.scores['You']}`);
  console.log('✅ Score display test complete!');
};

export default testScoreDisplay;

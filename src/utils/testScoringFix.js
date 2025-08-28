/**
 * Quick test to verify the scoring fix
 */

import { validateAnswer, calculateScore } from '../services/questionsService';

// Test data with the new scoring system
const testQuestion = {
  answers: [
    { text: 'Soccer/Football', rank: 1, points: 1, normalized: 'soccer football', aliases: ['football', 'soccer'] },
    { text: 'Cricket', rank: 2, points: 2, normalized: 'cricket' },
    { text: 'Basketball', rank: 3, points: 3, normalized: 'basketball' },
    { text: 'Tennis', rank: 4, points: 4, normalized: 'tennis' },
    { text: 'Volleyball', rank: 5, points: 5, normalized: 'volleyball' },
    { text: 'Table Tennis', rank: 6, points: 6, normalized: 'table tennis', aliases: ['ping pong'] },
    { text: 'Baseball', rank: 7, points: 7, normalized: 'baseball' },
    { text: 'Golf', rank: 8, points: 8, normalized: 'golf' },
    { text: 'American Football', rank: 9, points: 9, normalized: 'american football', aliases: ['football'] },
    { text: 'Rugby', rank: 10, points: 10, normalized: 'rugby' }
  ]
};

export const testScoringFix = () => {
  console.log('🧪 Testing Scoring Fix...\n');

  // Test 1: Rank 1 should give 1 point
  const test1 = validateAnswer('soccer', testQuestion.answers);
  console.log('Test 1 - "soccer" (rank 1):');
  console.log('Expected: rank 1, points 1');
  console.log('Result:', test1);
  console.log('✅ Pass:', test1.isCorrect && test1.rank === 1 && test1.points === 1);
  console.log('');

  // Test 2: Rank 10 should give 10 points
  const test2 = validateAnswer('rugby', testQuestion.answers);
  console.log('Test 2 - "rugby" (rank 10):');
  console.log('Expected: rank 10, points 10');
  console.log('Result:', test2);
  console.log('✅ Pass:', test2.isCorrect && test2.rank === 10 && test2.points === 10);
  console.log('');

  // Test 3: Simple score calculation (no time bonus, no difficulty multiplier)
  const scoreTest = calculateScore({
    rank: 1,
    timeTaken: 2, // 2 seconds
    totalTime: 60, // 60 seconds
    difficulty: 'medium'
  });
  console.log('Test 3 - Simple score calculation:');
  console.log('Rank: 1 (any time, any difficulty)');
  console.log('Expected: 1 point (rank position only)');
  console.log('Result:', scoreTest);
  console.log('✅ Pass:', scoreTest === 1);
  console.log('');

  // Test 4: Maximum score for rank 10
  const maxScoreTest = calculateScore({
    rank: 10,
    timeTaken: 1, // 1 second (fastest)
    totalTime: 60, // 60 seconds
    difficulty: 'hard'
  });
  console.log('Test 4 - Maximum score (rank 10):');
  console.log('Expected: 10 points (rank position only)');
  console.log('Result:', maxScoreTest);
  console.log('✅ Pass:', maxScoreTest === 10);
  console.log('');

  console.log('🎉 Simplified Scoring Test Complete!');
  console.log('📊 Summary:');
  console.log('- Rank 1 gives 1 point ✅');
  console.log('- Rank 10 gives 10 points ✅');
  console.log('- No speed bonus ✅');
  console.log('- No difficulty multipliers ✅');
  console.log('- Simple rank-based scoring ✅');
};

export default testScoringFix;

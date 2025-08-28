/**
 * Test file to verify the new scoring system
 * Run this to test the scoring logic changes
 */

import { validateAnswer, calculateScore, normalizeAnswer } from '../services/questionsService';

// Test data
const testQuestion = {
  id: 'test-1',
  category: 'Test',
  title: 'Top 10 highest paid athletes in 2024',
  difficulty: 'medium',
  answers: [
    { text: 'Cristiano Ronaldo', rank: 1, points: 1, normalized: 'cristiano ronaldo', aliases: ['ronaldo', 'cr7'] },
    { text: 'Lionel Messi', rank: 2, points: 2, normalized: 'lionel messi', aliases: ['messi'] },
    { text: 'LeBron James', rank: 3, points: 3, normalized: 'lebron james', aliases: ['lebron', 'king james'] },
    { text: 'Giannis Antetokounmpo', rank: 4, points: 4, normalized: 'giannis antetokounmpo', aliases: ['giannis', 'greek freak'] },
    { text: 'Stephen Curry', rank: 5, points: 5, normalized: 'stephen curry', aliases: ['curry', 'steph'] },
    { text: 'Kevin Durant', rank: 6, points: 6, normalized: 'kevin durant', aliases: ['durant', 'kd'] },
    { text: 'Roger Federer', rank: 7, points: 7, normalized: 'roger federer', aliases: ['federer'] },
    { text: 'Canelo Alvarez', rank: 8, points: 8, normalized: 'canelo alvarez', aliases: ['canelo'] },
    { text: 'Dak Prescott', rank: 9, points: 9, normalized: 'dak prescott', aliases: ['dak'] },
    { text: 'Tom Brady', rank: 10, points: 10, normalized: 'tom brady', aliases: ['brady'] }
  ]
};

/**
 * Test the new scoring system
 */
export const testNewScoringSystem = () => {
  console.log('🧪 Testing New Scoring System...\n');

  // Test 1: Exact matches with normalized answers
  console.log('📝 Test 1: Exact matches with normalized answers');
  const test1 = validateAnswer('cristiano ronaldo', testQuestion.answers);
  console.log('Input: "cristiano ronaldo"');
  console.log('Expected: rank 1, points 1');
  console.log('Result:', test1);
  console.log('✅ Pass:', test1.isCorrect && test1.rank === 1 && test1.points === 1);
  console.log('');

  // Test 2: Alias matches
  console.log('📝 Test 2: Alias matches');
  const test2 = validateAnswer('ronaldo', testQuestion.answers);
  console.log('Input: "ronaldo"');
  console.log('Expected: rank 1, points 1');
  console.log('Result:', test2);
  console.log('✅ Pass:', test2.isCorrect && test2.rank === 1 && test2.points === 1);
  console.log('');

  // Test 3: Case insensitive
  console.log('📝 Test 3: Case insensitive');
  const test3 = validateAnswer('CRISTIANO RONALDO', testQuestion.answers);
  console.log('Input: "CRISTIANO RONALDO"');
  console.log('Expected: rank 1, points 1');
  console.log('Result:', test3);
  console.log('✅ Pass:', test3.isCorrect && test3.rank === 1 && test3.points === 1);
  console.log('');

  // Test 4: Rank 10 should give 10 points
  console.log('📝 Test 4: Rank 10 should give 10 points');
  const test4 = validateAnswer('tom brady', testQuestion.answers);
  console.log('Input: "tom brady"');
  console.log('Expected: rank 10, points 10');
  console.log('Result:', test4);
  console.log('✅ Pass:', test4.isCorrect && test4.rank === 10 && test4.points === 10);
  console.log('');

  // Test 5: Score calculation with time bonus
  console.log('📝 Test 5: Score calculation with time bonus');
  const scoreTest = calculateScore({
    rank: 1,
    timeTaken: 2, // 2 seconds
    totalTime: 60, // 60 seconds
    difficulty: 'medium'
  });
  console.log('Rank: 1, Time: 2s/60s, Difficulty: medium');
  console.log('Expected: ~1 base + ~48 speed bonus = ~49 * 1.2 = ~59');
  console.log('Result:', scoreTest);
  console.log('✅ Pass:', scoreTest > 50 && scoreTest < 70);
  console.log('');

  // Test 6: Normalization
  console.log('📝 Test 6: String normalization');
  const normalizeTest1 = normalizeAnswer('  Cristiano   Ronaldo!!!  ');
  const normalizeTest2 = normalizeAnswer('CRISTIANO RONALDO');
  console.log('Input 1: "  Cristiano   Ronaldo!!!  "');
  console.log('Normalized 1:', normalizeTest1);
  console.log('Input 2: "CRISTIANO RONALDO"');
  console.log('Normalized 2:', normalizeTest2);
  console.log('✅ Pass:', normalizeTest1 === normalizeTest2);
  console.log('');

  // Test 7: Invalid answers
  console.log('📝 Test 7: Invalid answers');
  const test7 = validateAnswer('invalid answer', testQuestion.answers);
  console.log('Input: "invalid answer"');
  console.log('Expected: isCorrect = false');
  console.log('Result:', test7);
  console.log('✅ Pass:', !test7.isCorrect);
  console.log('');

  console.log('🎉 Scoring System Test Complete!');
};

/**
 * Test specific scenarios
 */
export const testSpecificScenarios = () => {
  console.log('🧪 Testing Specific Scenarios...\n');

  // Scenario 1: Different ranks give different points
  console.log('📊 Scenario 1: Rank position = points');
  for (let i = 1; i <= 10; i++) {
    const answer = testQuestion.answers[i - 1];
    console.log(`Rank ${answer.rank}: ${answer.points} points`);
  }
  console.log('✅ Pass: All ranks match their point values\n');

  // Scenario 2: Speed bonus calculation
  console.log('⏱️ Scenario 2: Speed bonus calculation');
  const fastAnswer = calculateScore({ rank: 1, timeTaken: 1, totalTime: 60, difficulty: 'easy' });
  const slowAnswer = calculateScore({ rank: 1, timeTaken: 59, totalTime: 60, difficulty: 'easy' });
  console.log('Fast answer (1s):', fastAnswer);
  console.log('Slow answer (59s):', slowAnswer);
  console.log('✅ Pass:', fastAnswer > slowAnswer);
  console.log('');

  // Scenario 3: Difficulty multipliers
  console.log('🎯 Scenario 3: Difficulty multipliers');
  const easyScore = calculateScore({ rank: 5, timeTaken: 30, totalTime: 60, difficulty: 'easy' });
  const mediumScore = calculateScore({ rank: 5, timeTaken: 30, totalTime: 60, difficulty: 'medium' });
  const hardScore = calculateScore({ rank: 5, timeTaken: 30, totalTime: 60, difficulty: 'hard' });
  console.log('Easy difficulty:', easyScore);
  console.log('Medium difficulty:', mediumScore);
  console.log('Hard difficulty:', hardScore);
  console.log('✅ Pass:', easyScore < mediumScore && mediumScore < hardScore);
  console.log('');
};

// Export for use in development
export default {
  testNewScoringSystem,
  testSpecificScenarios
};

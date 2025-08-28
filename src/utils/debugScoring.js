/**
 * Debug script to test scoring system
 */

// Mock the data structure
const mockQuestion = {
  id: 'sports-1',
  category: 'Sports',
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

// Mock normalize function
function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Mock validate function
function validateAnswer(userAnswer, correctAnswers) {
  if (!userAnswer.trim()) {
    return { isCorrect: false };
  }
  
  const normalizedUserAnswer = normalizeAnswer(userAnswer);
  console.log(`🔍 Validating: "${userAnswer}" -> normalized: "${normalizedUserAnswer}"`);
  
  // Check for exact matches first (normalized)
  for (const answer of correctAnswers) {
    // Check exact match with normalized answer
    if (answer.normalized && normalizedUserAnswer === answer.normalized) {
      console.log(`✅ EXACT MATCH: "${answer.text}" (rank ${answer.rank}, points ${answer.points})`);
      return {
        isCorrect: true,
        matchedAnswer: answer,
        rank: answer.rank,
        points: answer.points,
        similarity: 1
      };
    }
    
    // Check aliases
    if (answer.aliases) {
      for (const alias of answer.aliases) {
        const normalizedAlias = normalizeAnswer(alias);
        if (normalizedUserAnswer === normalizedAlias) {
          console.log(`✅ ALIAS MATCH: "${alias}" -> "${answer.text}" (rank ${answer.rank}, points ${answer.points})`);
          return {
            isCorrect: true,
            matchedAnswer: answer,
            rank: answer.rank,
            points: answer.points,
            similarity: 1
          };
        }
      }
    }
  }
  
  return { isCorrect: false };
}

// Test function
export const debugScoring = () => {
  console.log('🧪 DEBUGGING SCORING SYSTEM...\n');
  
  // Test cases
  const testCases = [
    'messi',
    'lebron james',
    'ronaldo',
    'curry',
    'invalid answer'
  ];
  
  let totalScore = 0;
  
  testCases.forEach((testAnswer, index) => {
    console.log(`\n--- Test ${index + 1}: "${testAnswer}" ---`);
    
    const validation = validateAnswer(testAnswer, mockQuestion.answers);
    
    if (validation.isCorrect && validation.rank) {
      const score = validation.rank; // Rank = points
      totalScore += score;
      console.log(`✅ CORRECT! Rank: ${validation.rank}, Points: ${score}`);
      console.log(`   Running total: ${totalScore}`);
    } else {
      console.log(`❌ INCORRECT! No points awarded`);
    }
  });
  
  console.log(`\n🎉 FINAL RESULTS:`);
  console.log(`   Expected total: 2 + 3 + 1 + 5 = 11`);
  console.log(`   Actual total: ${totalScore}`);
  console.log(`   Test ${totalScore === 11 ? 'PASSED' : 'FAILED'}!`);
};

export default debugScoring;

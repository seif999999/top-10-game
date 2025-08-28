/**
 * Script to update all questions to use the new scoring system
 * rank 1 = 1 point, rank 10 = 10 points
 */

const fs = require('fs');
const path = require('path');

// Read the current questions file
const questionsPath = path.join(__dirname, '../data/sampleQuestions.ts');
let content = fs.readFileSync(questionsPath, 'utf8');

// Function to update points for a question block
function updateQuestionPoints(questionBlock) {
  // Find all points: X patterns and replace them
  let updated = questionBlock;
  
  // Replace points: 10 with points: 1 (rank 1)
  updated = updated.replace(/rank: 1, points: 10/g, 'rank: 1, points: 1');
  // Replace points: 9 with points: 2 (rank 2)
  updated = updated.replace(/rank: 2, points: 9/g, 'rank: 2, points: 2');
  // Replace points: 8 with points: 3 (rank 3)
  updated = updated.replace(/rank: 3, points: 8/g, 'rank: 3, points: 3');
  // Replace points: 7 with points: 4 (rank 4)
  updated = updated.replace(/rank: 4, points: 7/g, 'rank: 4, points: 4');
  // Replace points: 6 with points: 5 (rank 5)
  updated = updated.replace(/rank: 5, points: 6/g, 'rank: 5, points: 5');
  // Replace points: 5 with points: 6 (rank 6)
  updated = updated.replace(/rank: 6, points: 5/g, 'rank: 6, points: 6');
  // Replace points: 4 with points: 7 (rank 7)
  updated = updated.replace(/rank: 7, points: 4/g, 'rank: 7, points: 7');
  // Replace points: 3 with points: 8 (rank 8)
  updated = updated.replace(/rank: 8, points: 3/g, 'rank: 8, points: 8');
  // Replace points: 2 with points: 9 (rank 9)
  updated = updated.replace(/rank: 9, points: 2/g, 'rank: 9, points: 9');
  // Replace points: 1 with points: 10 (rank 10)
  updated = updated.replace(/rank: 10, points: 1/g, 'rank: 10, points: 10');
  
  // Fix any points: 100 that should be points: 10
  updated = updated.replace(/rank: 10, points: 100/g, 'rank: 10, points: 10');
  
  return updated;
}

// Update the content
content = updateQuestionPoints(content);

// Write back to file
fs.writeFileSync(questionsPath, content, 'utf8');

console.log('✅ Updated all questions to use new scoring system (rank 1 = 1 point, rank 10 = 10 points)');

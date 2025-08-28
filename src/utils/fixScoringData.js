/**
 * Script to fix all scoring data to match the new system
 * Rank 1 = 1 point, Rank 10 = 10 points
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/sampleQuestions.ts');

function fixScoringData() {
  console.log('🔧 Fixing scoring data...');
  
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix all the points values to match rank
    // This will update all questions to have the correct scoring system
    
    // Pattern: rank: X, points: Y -> rank: X, points: X
    const rankPointsPattern = /rank:\s*(\d+),\s*points:\s*\d+/g;
    
    let match;
    let updatedContent = content;
    let changes = 0;
    
    while ((match = rankPointsPattern.exec(content)) !== null) {
      const rank = parseInt(match[1]);
      const oldPoints = match[0].match(/points:\s*(\d+)/)[1];
      const newPoints = rank; // Rank = points
      
      if (parseInt(oldPoints) !== newPoints) {
        const oldPattern = `rank: ${rank}, points: ${oldPoints}`;
        const newPattern = `rank: ${rank}, points: ${newPoints}`;
        updatedContent = updatedContent.replace(oldPattern, newPattern);
        changes++;
        console.log(`✅ Fixed: ${oldPattern} -> ${newPattern}`);
      }
    }
    
    // Write the updated content back
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`🎉 Successfully fixed ${changes} scoring entries!`);
    console.log('📊 New scoring system: Rank 1 = 1 point, Rank 10 = 10 points');
    
  } catch (error) {
    console.error('❌ Error fixing scoring data:', error);
  }
}

// Run the fix
fixScoringData();

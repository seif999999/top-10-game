import { distance } from 'fastest-levenshtein';
import { logger } from '../utils/logger';

/**
 * Enhanced fuzzy matching service for answer validation
 * Provides flexible answer matching with typos, casing, and common variations
 */

export interface FuzzyMatchResult {
  isMatch: boolean;
  matchedAnswer?: any;
  similarity: number;
  confidence: 'exact' | 'high' | 'medium' | 'low' | 'none';
  originalAnswer: string;
  officialAnswer: string;
}

export interface AnswerMatchConfig {
  exactMatchThreshold: number; // 1.0
  highConfidenceThreshold: number; // 0.85
  mediumConfidenceThreshold: number; // 0.70
  lowConfidenceThreshold: number; // 0.55
  minLengthForFuzzy: number; // 3
  maxLengthDifference: number; // 0.5 (50% of longer string)
}

// Default configuration
const DEFAULT_CONFIG: AnswerMatchConfig = {
  exactMatchThreshold: 1.0,
  highConfidenceThreshold: 0.85,
  mediumConfidenceThreshold: 0.70,
  lowConfidenceThreshold: 0.50, // Lowered from 0.55 to 0.50 for more lenient matching
  minLengthForFuzzy: 2, // Lowered from 3 to 2 to allow shorter matches
  maxLengthDifference: 0.6 // Increased from 0.5 to 0.6 for more flexible length matching
};

/**
 * Common nickname and abbreviation mappings
 */
const NICKNAME_DICTIONARY: Record<string, string[]> = {
  // Common first names
  'michael': ['mike', 'mick', 'mickey', 'mich', 'micheal'],
  'thomas': ['tom', 'tommy', 'thom'],
  'robert': ['bob', 'bobby', 'rob', 'robbie'],
  'william': ['bill', 'billy', 'will', 'willy'],
  'richard': ['rick', 'ricky', 'dick', 'rich'],
  'james': ['jim', 'jimmy', 'jamie', 'lebron', 'king james'],
  'charles': ['charlie', 'chuck', 'charlie'],
  'joseph': ['joe', 'joey'],
  'david': ['dave', 'davey', 'davie'],
  'daniel': ['dan', 'danny'],
  'matthew': ['matt', 'matty'],
  'anthony': ['tony', 'ant'],
  'christopher': ['chris', 'christy'],
  'andrew': ['andy', 'drew'],
  'joshua': ['josh'],
  'benjamin': ['ben', 'benny'],
  'samuel': ['sam', 'sammy'],
  'alexander': ['alex', 'al', 'alex'],
  'jonathan': ['jon', 'johnny', 'john'],
  'nicholas': ['nick', 'nicky'],
  'elizabeth': ['liz', 'lizzie', 'beth', 'betty'],
  'jennifer': ['jen', 'jenny'],
  'sarah': ['sara', 'sally'],
  'jessica': ['jess', 'jessie'],
  'amanda': ['mandy', 'mandi'],
  'ashley': ['ash'],
  'stephanie': ['steph', 'stephie'],
  'nicole': ['nikki', 'nic'],
  'samantha': ['sam', 'sammy'],
  'michelle': ['mich', 'shell'],
  'katherine': ['kate', 'katie', 'kathy', 'kat'],
  'christine': ['chris', 'christy', 'tina'],
  'patricia': ['pat', 'patty', 'tricia'],
  'deborah': ['deb', 'debbie'],
  'susan': ['sue', 'suzie', 'susie'],
  'nancy': ['nan'],
  'lisa': ['liz'],
  'karen': ['kar'],
  'betty': ['beth'],
  'helen': ['helen'],
  'sandra': ['sandy'],
  'donna': ['don'],
  'carol': ['carrie'],
  'ruth': ['ruthie'],
  'sharon': ['shar'],
  'laura': ['laurie'],
  'kimberly': ['kim'],
  'dorothy': ['dottie', 'dot'],
  
  // Common last names
  'smith': ['smyth'],
  'johnson': ['johnston', 'magic'],
  'williams': ['williamson'],
  'brown': ['braun', 'brawn'],
  'jones': ['johns'],
  'garcia': ['garcía'],
  'miller': ['müller'],
  'davis': ['davies'],
  'rodriguez': ['rodríguez'],
  'martinez': ['martínez'],
  'hernandez': ['hernández'],
  'lopez': ['lópez'],
  'gonzalez': ['gonzález'],
  'wilson': ['wilsen'],
  'anderson': ['andersen'],
  'tomas': ['thomas'],
  'taylor': ['tailor'],
  'moore': ['more'],
  'jackson': ['jaxon'],
  'martin': ['martín'],
  'lee': ['leigh'],
  'perez': ['peréz'],
  'thompson': ['tompson'],
  'white': ['whyte'],
  'harris': ['harries'],
  'sanchez': ['sánchez'],
  'clark': ['clarke'],
  'ramirez': ['ramírez'],
  'lewis': ['louis'],
  'robinson': ['robertson', 'david', 'admiral'],
  'walker': ['walkar'],
  'young': ['yung'],
  'allen': ['alan'],
  'king': ['kings'],
  'wright': ['right'],
  'scott': ['scot'],
  'torres': ['torrez'],
  'nguyen': ['nguyn'],
  'hill': ['hills', 'grant'],
  'flores': ['florés'],
  'green': ['greene'],
  'adams': ['adam'],
  'nelson': ['neilson'],
  'baker': ['barker'],
  'hall': ['halls'],
  'rivera': ['riviera'],
  'campbell': ['campbel'],
  'mitchell': ['mitchall'],
  'carter': ['karter', 'vince', 'half man half amazing'],
  'roberts': ['robert'],
  
  // Sports nicknames and common terms
  'curry': ['steph', 'stephen'],
  'durant': ['kd'],
  'antetokounmpo': ['giannis', 'greek freak'],
  'bryant': ['kobe', 'mamba', 'black mamba'],
  'jordan': ['mj', 'air jordan'],
  'oneal': ['shaq', 'shaquille'],
  'bird': ['larry'],
  'chamberlain': ['wilt'],
  'russell': ['bill'],
  'west': ['jerry', 'logo'],
  'robertson': ['big o', 'oscar'],
  'barkley': ['charles', 'sir charles'],
  'malone': ['karl', 'mailman'],
  'stockton': ['john'],
  'pippen': ['scottie'],
  'rodman': ['dennis'],
  'kukoc': ['toni'],
  'kerr': ['steve'],
  'fisher': ['derek'],
  'o\'neal': ['shaq', 'shaquille', 'diesel'],
  'garnett': ['kg', 'kevin'],
  'duncan': ['tim', 'big fundamental'],
  'parker': ['tony'],
  'ginobili': ['manu'],
  'nowitzki': ['dirk', 'german wunderkind'],
  'nash': ['steve'],
  'stoudemire': ['amare', 'stat'],
  'marbury': ['starbury', 'stephon'],
  'iverson': ['ai', 'allen', 'answer'],
  'mcgrady': ['tmac', 'tracy'],
  'hardaway': ['penny', 'anfernee'],
  'ewing': ['patrick'],
  'mutombo': ['dikembe'],
  'olajuwon': ['hakeem', 'dream'],
  'horry': ['robert', 'big shot rob']
};

/**
 * Enhanced answer normalization
 * Handles typos, casing, punctuation, and common variations
 */
export function normalizeAnswerEnhanced(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const result = text
    .toLowerCase()
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove common punctuation but keep important characters
    .replace(/[^\w\s\-'&]/g, '')
    // Normalize common abbreviations
    .replace(/\b(mr|mrs|ms|dr|prof|rev|sir|dame)\b\.?/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\.?$/g, '')
    // Normalize common articles
    .replace(/\b(the|a|an)\b/g, '')
    // Normalize common prefixes
    .replace(/\b(saint|st|santa|santa)\b/g, 'st')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
    
  logger.log(`🔍 NORMALIZE: "${text}" -> "${result}"`);
  return result;
}

/**
 * Get all possible variations of a name including nicknames
 */
export function getAnswerVariations(text: string): string[] {
  const normalized = normalizeAnswerEnhanced(text);
  const variations = new Set<string>([normalized]);
  
  // Add original normalized version
  variations.add(normalized);
  
  // Add nickname variations
  const words = normalized.split(' ');
  for (const word of words) {
    if (NICKNAME_DICTIONARY[word]) {
      for (const nickname of NICKNAME_DICTIONARY[word]) {
        const variation = normalized.replace(word, nickname);
        variations.add(variation);
      }
    }
  }
  
  // Add reverse nickname variations (if input is nickname, add full name)
  for (const [fullName, nicknames] of Object.entries(NICKNAME_DICTIONARY)) {
    for (const nickname of nicknames) {
      if (normalized.includes(nickname)) {
        const variation = normalized.replace(nickname, fullName);
        variations.add(variation);
      }
    }
  }
  
  return Array.from(variations);
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const normalized1 = normalizeAnswerEnhanced(str1);
  const normalized2 = normalizeAnswerEnhanced(str2);
  
  if (normalized1 === normalized2) return 1;
  
  // Use fastest-levenshtein for better performance
  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1;
  
  const levenshteinDistance = distance(normalized1, normalized2);
  const similarity = 1 - (levenshteinDistance / maxLength);
  
  return Math.max(0, similarity);
}

/**
 * Check if two strings are similar enough for fuzzy matching
 */
export function isSimilarEnough(str1: string, str2: string, config: AnswerMatchConfig = DEFAULT_CONFIG): boolean {
  const normalized1 = normalizeAnswerEnhanced(str1);
  const normalized2 = normalizeAnswerEnhanced(str2);
  
  // Length checks
  if (normalized1.length < config.minLengthForFuzzy || normalized2.length < config.minLengthForFuzzy) {
    return normalized1 === normalized2;
  }
  
  const lengthDiff = Math.abs(normalized1.length - normalized2.length);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const lengthRatio = lengthDiff / maxLength;
  
  if (lengthRatio > config.maxLengthDifference) {
    return false;
  }
  
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= config.lowConfidenceThreshold;
}

/**
 * Find the best matching answer using fuzzy matching
 */
export function findBestMatch(
  userAnswer: string,
  correctAnswers: any[],
  config: AnswerMatchConfig = DEFAULT_CONFIG
): FuzzyMatchResult {
  if (!userAnswer || !correctAnswers || correctAnswers.length === 0) {
    return {
      isMatch: false,
      similarity: 0,
      confidence: 'none',
      originalAnswer: userAnswer,
      officialAnswer: ''
    };
  }

  const normalizedUserAnswer = normalizeAnswerEnhanced(userAnswer);
  logger.log(`🔍 FUZZY MATCHING DEBUG:`, {
    userAnswer,
    normalizedUserAnswer,
    correctAnswersCount: correctAnswers.length
  });
  
  let bestMatch: any = null;
  let bestSimilarity = 0;
  let bestConfidence: 'exact' | 'high' | 'medium' | 'low' | 'none' = 'none';

  // Get all variations of the user's answer
  const userVariations = getAnswerVariations(userAnswer);
  logger.log(`🔍 USER VARIATIONS:`, userVariations);

  for (const answer of correctAnswers) {
    const answerText = typeof answer === 'string' ? answer : answer.text;
    const normalizedAnswer = normalizeAnswerEnhanced(answerText);
    
    // Check exact match first
    if (normalizedUserAnswer === normalizedAnswer) {
      return {
        isMatch: true,
        matchedAnswer: answer,
        similarity: 1,
        confidence: 'exact',
        originalAnswer: userAnswer,
        officialAnswer: answerText
      };
    }
    
    // Check aliases
    if (answer.aliases && Array.isArray(answer.aliases)) {
      logger.log(`🔍 CHECKING ALIASES for "${answerText}":`, answer.aliases);
      for (const alias of answer.aliases) {
        const normalizedAlias = normalizeAnswerEnhanced(alias);
        logger.log(`🔍 Alias "${alias}" -> normalized: "${normalizedAlias}" vs user: "${normalizedUserAnswer}"`);
        if (normalizedUserAnswer === normalizedAlias) {
          logger.log(`✅ EXACT ALIAS MATCH: "${userAnswer}" -> "${answerText}" via alias "${alias}"`);
          return {
            isMatch: true,
            matchedAnswer: answer,
            similarity: 1,
            confidence: 'exact',
            originalAnswer: userAnswer,
            officialAnswer: answerText
          };
        }
      }
    }
    
    // Check fuzzy matching with all variations
    for (const variation of userVariations) {
      const similarity = calculateSimilarity(variation, normalizedAnswer);
      
      // Also check if user input is contained in the answer or vice versa
      const containsMatch = normalizedAnswer.includes(variation) || variation.includes(normalizedAnswer);
      
      // Check individual word matches (for cases like "curry" matching "Stephen Curry")
      const answerWords = normalizedAnswer.split(' ');
      const variationWords = variation.split(' ');
      let wordMatch = false;
      let bestWordSimilarity = 0;
      
      for (const answerWord of answerWords) {
        for (const variationWord of variationWords) {
          const wordSimilarity = calculateSimilarity(variationWord, answerWord);
          if (wordSimilarity > 0.7) { // High similarity for individual words
            wordMatch = true;
            bestWordSimilarity = Math.max(bestWordSimilarity, wordSimilarity);
          }
        }
      }
      
      const effectiveSimilarity = containsMatch ? Math.max(similarity, 0.8) : 
                                 wordMatch ? Math.max(similarity, bestWordSimilarity * 0.9) : 
                                 similarity;
      
      logger.log(`🔍 FUZZY CHECK: "${variation}" vs "${normalizedAnswer}" -> similarity: ${similarity.toFixed(3)}, contains: ${containsMatch}, wordMatch: ${wordMatch}, effective: ${effectiveSimilarity.toFixed(3)}`);
      
      if (effectiveSimilarity > bestSimilarity) {
        bestSimilarity = effectiveSimilarity;
        bestMatch = answer;
        
        // Determine confidence level
        if (effectiveSimilarity >= config.exactMatchThreshold) {
          bestConfidence = 'exact';
        } else if (effectiveSimilarity >= config.highConfidenceThreshold) {
          bestConfidence = 'high';
        } else if (effectiveSimilarity >= config.mediumConfidenceThreshold) {
          bestConfidence = 'medium';
        } else if (effectiveSimilarity >= config.lowConfidenceThreshold) {
          bestConfidence = 'low';
        } else {
          bestConfidence = 'none';
        }
        
        logger.log(`✅ NEW BEST MATCH: "${answerText}" with confidence: ${bestConfidence} (${effectiveSimilarity.toFixed(3)})`);
      }
    }
  }

  const isMatch = bestSimilarity >= config.lowConfidenceThreshold && bestMatch !== null;
  
  return {
    isMatch,
    matchedAnswer: isMatch ? bestMatch : undefined,
    similarity: bestSimilarity,
    confidence: isMatch ? bestConfidence : 'none',
    originalAnswer: userAnswer,
    officialAnswer: isMatch ? (typeof bestMatch === 'string' ? bestMatch : bestMatch.text) : ''
  };
}

/**
 * Validate answer with enhanced fuzzy matching
 */
export function validateAnswerFuzzy(
  userAnswer: string,
  correctAnswers: any[],
  config: AnswerMatchConfig = DEFAULT_CONFIG
): {
  isCorrect: boolean;
  matchedAnswer?: any;
  rank?: number;
  points?: number;
  similarity: number;
  confidence: string;
  originalAnswer: string;
  officialAnswer: string;
} {
  const result = findBestMatch(userAnswer, correctAnswers, config);
  
  if (result.isMatch && result.matchedAnswer) {
    const answer = result.matchedAnswer;
    return {
      isCorrect: true,
      matchedAnswer: answer,
      rank: answer.rank || 0,
      points: answer.points || (answer.rank || 0),
      similarity: result.similarity,
      confidence: result.confidence,
      originalAnswer: result.originalAnswer,
      officialAnswer: result.officialAnswer
    };
  }
  
  return {
    isCorrect: false,
    similarity: result.similarity,
    confidence: result.confidence,
    originalAnswer: result.originalAnswer,
    officialAnswer: result.officialAnswer
  };
}

/**
 * Create a custom configuration for specific use cases
 */
export function createMatchConfig(overrides: Partial<AnswerMatchConfig>): AnswerMatchConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

/**
 * Debug function to test fuzzy matching
 */
export function debugFuzzyMatching(userAnswer: string, correctAnswers: any[]): void {
  logger.log('🔍 Fuzzy Matching Debug:');
  logger.log('User Answer:', userAnswer);
  logger.log('Normalized:', normalizeAnswerEnhanced(userAnswer));
  logger.log('Variations:', getAnswerVariations(userAnswer));
  
  const result = findBestMatch(userAnswer, correctAnswers);
  logger.log('Best Match:', result);
  
  for (const answer of correctAnswers) {
    const answerText = typeof answer === 'string' ? answer : answer.text;
    const similarity = calculateSimilarity(userAnswer, answerText);
    logger.log(`  "${answerText}" -> similarity: ${similarity.toFixed(3)}`);
  }
}

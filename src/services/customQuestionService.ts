import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CustomQuestion {
  id: string;
  question: string;
  answers: string[];
  createdAt: Date;
  lastPlayed?: Date;
  playCount: number;
}

const CUSTOM_QUESTIONS_KEY = 'custom_questions';

/**
 * Service for managing custom questions locally
 */
export class CustomQuestionService {
  private static instance: CustomQuestionService | null = null;

  private constructor() {}

  public static getInstance(): CustomQuestionService {
    if (!CustomQuestionService.instance) {
      CustomQuestionService.instance = new CustomQuestionService();
    }
    return CustomQuestionService.instance;
  }

  /**
   * Save a custom question
   */
  public async saveCustomQuestion(question: string, answers: string[]): Promise<CustomQuestion> {
    try {
      console.log('💾 CustomQuestionService: Saving custom question...');
      
      const customQuestion: CustomQuestion = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: question.trim(),
        answers: answers.filter(answer => answer.trim().length > 0),
        createdAt: new Date(),
        playCount: 0
      };

      // Get existing questions
      const existingQuestions = await this.getAllCustomQuestions();
      
      // Add new question
      const updatedQuestions = [...existingQuestions, customQuestion];
      
      // Save to storage
      if (Platform.OS === 'web') {
        localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
      } else {
        await AsyncStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(updatedQuestions));
      }
      
      console.log('✅ CustomQuestionService: Custom question saved:', customQuestion.id);
      return customQuestion;
    } catch (error) {
      console.error('❌ CustomQuestionService: Error saving custom question:', error);
      throw error;
    }
  }

  /**
   * Get all custom questions
   */
  public async getAllCustomQuestions(): Promise<CustomQuestion[]> {
    try {
      console.log('🔍 CustomQuestionService: Retrieving all custom questions...');
      
      let questionsData: string | null = null;
      
      if (Platform.OS === 'web') {
        questionsData = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
      } else {
        questionsData = await AsyncStorage.getItem(CUSTOM_QUESTIONS_KEY);
      }

      if (!questionsData) {
        console.log('🚪 CustomQuestionService: No custom questions found');
        return [];
      }

      const questions = JSON.parse(questionsData);
      
      // Convert date strings back to Date objects
      const parsedQuestions = questions.map((q: any) => ({
        ...q,
        createdAt: new Date(q.createdAt),
        lastPlayed: q.lastPlayed ? new Date(q.lastPlayed) : undefined
      }));

      console.log('✅ CustomQuestionService: Retrieved custom questions:', parsedQuestions.length);
      return parsedQuestions;
    } catch (error) {
      console.error('❌ CustomQuestionService: Error retrieving custom questions:', error);
      return [];
    }
  }

  /**
   * Get a specific custom question by ID
   */
  public async getCustomQuestion(id: string): Promise<CustomQuestion | null> {
    try {
      const questions = await this.getAllCustomQuestions();
      return questions.find(q => q.id === id) || null;
    } catch (error) {
      console.error('❌ CustomQuestionService: Error retrieving custom question:', error);
      return null;
    }
  }

  /**
   * Update play count and last played date
   */
  public async updatePlayStats(id: string): Promise<void> {
    try {
      console.log('📊 CustomQuestionService: Updating play stats for question:', id);
      
      const questions = await this.getAllCustomQuestions();
      const questionIndex = questions.findIndex(q => q.id === id);
      
      if (questionIndex !== -1) {
        questions[questionIndex].playCount += 1;
        questions[questionIndex].lastPlayed = new Date();
        
        // Save updated questions
        if (Platform.OS === 'web') {
          localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
        } else {
          await AsyncStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
        }
        
        console.log('✅ CustomQuestionService: Play stats updated');
      }
    } catch (error) {
      console.error('❌ CustomQuestionService: Error updating play stats:', error);
    }
  }

  /**
   * Delete a custom question
   */
  public async deleteCustomQuestion(id: string): Promise<void> {
    try {
      console.log('🗑️ CustomQuestionService: Deleting custom question:', id);
      
      const questions = await this.getAllCustomQuestions();
      const filteredQuestions = questions.filter(q => q.id !== id);
      
      // Save updated questions
      if (Platform.OS === 'web') {
        localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(filteredQuestions));
      } else {
        await AsyncStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(filteredQuestions));
      }
      
      console.log('✅ CustomQuestionService: Custom question deleted');
    } catch (error) {
      console.error('❌ CustomQuestionService: Error deleting custom question:', error);
    }
  }

  /**
   * Clear all custom questions
   */
  public async clearAllCustomQuestions(): Promise<void> {
    try {
      console.log('🧹 CustomQuestionService: Clearing all custom questions...');
      
      if (Platform.OS === 'web') {
        localStorage.removeItem(CUSTOM_QUESTIONS_KEY);
      } else {
        await AsyncStorage.removeItem(CUSTOM_QUESTIONS_KEY);
      }
      
      console.log('✅ CustomQuestionService: All custom questions cleared');
    } catch (error) {
      console.error('❌ CustomQuestionService: Error clearing custom questions:', error);
    }
  }
}

export default CustomQuestionService;

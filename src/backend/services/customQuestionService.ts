import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { safeJsonParse } from '../utils/safeJson';
import type { CustomQuestion } from '../../shared/types';
import { AppError } from '../../shared/errors';

const CUSTOM_QUESTIONS_KEY = 'custom_questions';
const NUM_SLOTS = 10;

type SlotsData = { slots: (CustomQuestion & { createdAt: string; lastPlayed?: string | null })[] };

/**
 * Service for managing custom questions in 10 fixed slots
 */
export class CustomQuestionService {
  private static instance: CustomQuestionService | null = null;

  public static readonly NUM_SLOTS = NUM_SLOTS;

  private constructor() {}

  public static getInstance(): CustomQuestionService {
    if (!CustomQuestionService.instance) {
      CustomQuestionService.instance = new CustomQuestionService();
    }
    return CustomQuestionService.instance;
  }

  /**
   * Get the 10 slots (each CustomQuestion | null). Migrates old list format to slots on first read.
   */
  public async getSlots(): Promise<(CustomQuestion | null)[]> {
    try {
      let raw: string | null = null;
      if (Platform.OS === 'web') {
        raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
      } else {
        raw = await AsyncStorage.getItem(CUSTOM_QUESTIONS_KEY);
      }
      if (!raw) {
        return Array(NUM_SLOTS).fill(null);
      }
      const parsed = safeJsonParse<SlotsData | CustomQuestion[]>(raw);
      if (!parsed) {
        logger.error('CustomQuestionService: invalid JSON in slots, resetting');
        return Array(NUM_SLOTS).fill(null);
      }
      let slots: (CustomQuestion | null)[];
      if (Array.isArray(parsed)) {
        // Old format: list of questions → migrate to 10 slots
        const list = parsed as (CustomQuestion & { createdAt: string })[];
        slots = Array(NUM_SLOTS)
          .fill(null)
          .map((_, i) => (list[i] ? { ...list[i], createdAt: new Date(list[i].createdAt), lastPlayed: (list[i] as { lastPlayed?: string })?.lastPlayed ? new Date((list[i] as { lastPlayed: string }).lastPlayed) : undefined } : null));
        await this.writeSlots(slots);
      } else {
        const data = parsed as SlotsData;
        slots = (data.slots || []).slice(0, NUM_SLOTS).map((q) =>
          q ? { ...q, createdAt: new Date(q.createdAt), lastPlayed: q.lastPlayed ? new Date(q.lastPlayed) : undefined } : null
        );
      }
      while (slots.length < NUM_SLOTS) slots.push(null);
      return slots.slice(0, NUM_SLOTS);
    } catch (e) {
      logger.error('CustomQuestionService: getSlots error', e);
      return Array(NUM_SLOTS).fill(null);
    }
  }

  private async writeSlots(slots: (CustomQuestion | null)[]): Promise<void> {
    const payload = JSON.stringify({
      slots: slots.slice(0, NUM_SLOTS).map((q) => (q ? { ...q, createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt, lastPlayed: q.lastPlayed instanceof Date ? q.lastPlayed.toISOString() : q.lastPlayed } : null)),
    });
    if (Platform.OS === 'web') {
      localStorage.setItem(CUSTOM_QUESTIONS_KEY, payload);
    } else {
      await AsyncStorage.setItem(CUSTOM_QUESTIONS_KEY, payload);
    }
  }

  /**
   * Save a question into a specific slot (0–9). Replaces any existing question in that slot.
   */
  public async saveToSlot(slotIndex: number, question: string, answers: string[]): Promise<CustomQuestion> {
    if (slotIndex < 0 || slotIndex >= NUM_SLOTS) {
      throw new AppError({
        code: 'INVALID_SLOT',
        message: `Slot index must be 0–${NUM_SLOTS - 1}`,
        userMessage: 'Invalid slot.',
      });
    }
    const slots = await this.getSlots();
    const customQuestion: CustomQuestion = {
      id: `custom-slot-${slotIndex + 1}`,
      question: question.trim(),
      answers: answers.filter((a) => a.trim().length > 0),
      createdAt: new Date(),
      playCount: 0,
    };
    slots[slotIndex] = customQuestion;
    await this.writeSlots(slots);
    logger.log('CustomQuestionService: Saved to slot', slotIndex + 1);
    return customQuestion;
  }

  /**
   * Save a custom question (legacy: saves to first empty slot, or slot 0 if all full)
   */
  public async saveCustomQuestion(question: string, answers: string[]): Promise<CustomQuestion> {
    const slots = await this.getSlots();
    const emptyIndex = slots.findIndex((s) => s == null);
    const slotIndex = emptyIndex >= 0 ? emptyIndex : 0;
    return this.saveToSlot(slotIndex, question, answers);
  }

  /**
   * Get all custom questions (non-null slots) for listing in Create Your Own category
   */
  public async getAllCustomQuestions(): Promise<CustomQuestion[]> {
    const slots = await this.getSlots();
    return slots.filter((s): s is CustomQuestion => s != null);
  }

  /**
   * Get a specific custom question by ID (or by slot index 0–9)
   */
  public async getCustomQuestion(id: string): Promise<CustomQuestion | null> {
    try {
      const slots = await this.getSlots();
      return slots.find((q) => q != null && q.id === id) || null;
    } catch (error) {
      logger.error('❌ CustomQuestionService: Error retrieving custom question:', error);
      return null;
    }
  }

  /**
   * Get question in a specific slot (0–9)
   */
  public async getSlot(slotIndex: number): Promise<CustomQuestion | null> {
    if (slotIndex < 0 || slotIndex >= NUM_SLOTS) return null;
    const slots = await this.getSlots();
    return slots[slotIndex] ?? null;
  }

  /**
   * Update play count and last played date
   */
  public async updatePlayStats(id: string): Promise<void> {
    try {
      const slots = await this.getSlots();
      const idx = slots.findIndex((q) => q != null && q.id === id);
      if (idx === -1) return;
      const slot = slots[idx];
      if (slot) {
        slot.playCount += 1;
        (slot as CustomQuestion & { lastPlayed?: Date }).lastPlayed = new Date();
        await this.writeSlots(slots);
      }
    } catch (error) {
      logger.error('❌ CustomQuestionService: Error updating play stats:', error);
    }
  }

  /**
   * Delete a custom question (clear its slot)
   */
  public async deleteCustomQuestion(id: string): Promise<void> {
    try {
      const slots = await this.getSlots();
      const idx = slots.findIndex((q) => q != null && q.id === id);
      if (idx === -1) return;
      slots[idx] = null;
      await this.writeSlots(slots);
    } catch (error) {
      logger.error('❌ CustomQuestionService: Error deleting custom question:', error);
    }
  }

  /**
   * Clear a specific slot by index (0–9)
   */
  public async clearSlot(slotIndex: number): Promise<void> {
    try {
      if (slotIndex < 0 || slotIndex >= NUM_SLOTS) return;
      const slots = await this.getSlots();
      slots[slotIndex] = null;
      await this.writeSlots(slots);
      logger.log('✅ CustomQuestionService: Cleared slot', slotIndex + 1);
    } catch (error) {
      logger.error('❌ CustomQuestionService: Error clearing slot:', error);
    }
  }

  /**
   * Clear all slots
   */
  public async clearAllCustomQuestions(): Promise<void> {
    try {
      await this.writeSlots(Array(NUM_SLOTS).fill(null));
    } catch (error) {
      logger.error('❌ CustomQuestionService: Error clearing custom questions:', error);
    }
  }
}

export default CustomQuestionService;

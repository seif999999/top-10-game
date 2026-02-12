import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import ThemedAlert from '../utils/themedAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { logger } from '../../backend/utils/logger';
import { CustomQuestionScreenProps } from '../../shared/types/navigation';
import CustomQuestionService from '../../backend/services/customQuestionService';
import { InputValidator } from '../../backend/utils/inputValidator';
import useAppTranslation from '../../hooks/useTranslation';

const { width } = Dimensions.get('window');

const CustomQuestionScreen: React.FC<CustomQuestionScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const slotIndex = route.params.slotIndex;
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const { t: tCommon } = useAppTranslation('common');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [slotLoaded, setSlotLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const service = CustomQuestionService.getInstance();
      const existing = await service.getSlot(slotIndex);
      if (cancelled) return;
      if (existing) {
        setQuestion(existing.question);
        const ans = existing.answers.slice();
        while (ans.length < 4) ans.push('');
        setAnswers(ans);
      }
      setSlotLoaded(true);
    };
    load();
    return () => { cancelled = true; };
  }, [slotIndex]);

  const handleAddAnswer = () => {
    if (answers.length < 10) { // Limit to 10 answers
      setAnswers([...answers, '']);
    }
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) { // Keep at least 2 answers
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleCreateQuestion = async () => {
    // Validate question
    if (!question.trim()) {
      ThemedAlert.warning(tScreens('customQuestion.missingQuestion'), tScreens('customQuestion.enterQuestion'));
      return;
    }

    // Validate answers
    const validAnswers = answers.filter(answer => answer.trim().length > 0);
    if (validAnswers.length < 2) {
      ThemedAlert.warning(tScreens('customQuestion.notEnoughAnswers'), tScreens('customQuestion.minAnswers'));
      return;
    }

    if (validAnswers.length > 10) {
      ThemedAlert.warning(tScreens('customQuestion.tooManyAnswers'), tScreens('customQuestion.maxAnswers'));
      return;
    }

    setIsLoading(true);
    try {
      logger.log('🔄 Saving custom question to slot...');
      const customQuestionService = CustomQuestionService.getInstance();
      await customQuestionService.saveToSlot(slotIndex, question.trim(), validAnswers);
      logger.log('✅ Custom question saved to slot', slotIndex + 1);
      ThemedAlert.success(tCommon('success'), tScreens('customQuestion.questionSaved', { number: slotIndex + 1 }));
      navigation.goBack();
    } catch (error) {
      logger.error('❌ Error creating custom question:', error);
      const errorMessage = error instanceof Error ? error.message : tScreens('customQuestion.createError');
      ThemedAlert.error(tCommon('error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClearSlot = () => {
    ThemedAlert.alert(
      tScreens('customQuestion.clearSlotTitle'),
      tScreens('customQuestion.clearSlotMessage', { number: slotIndex + 1 }),
      [
        {
          text: tCommon('cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: tCommon('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const service = CustomQuestionService.getInstance();
              await service.clearSlot(slotIndex);
              logger.log('✅ Slot cleared:', slotIndex + 1);
              ThemedAlert.success(tCommon('success'), tScreens('customQuestion.slotCleared', { number: slotIndex + 1 }));
              navigation.goBack();
            } catch (error) {
              logger.error('Error clearing slot:', error);
              ThemedAlert.error(tCommon('error'), tScreens('customQuestion.clearSlotError'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{tScreens('customQuestion.slotTitle', { number: slotIndex + 1 })}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Input Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, isRTL && styles.rtlText]}>{tScreens('customQuestion.questionLabel')}</Text>
            <TextInput
              style={[styles.questionInput, isRTL && styles.rtlText]}
              placeholder={tScreens('customQuestion.questionPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              textAlign={isRTL ? 'right' : 'left'}
              maxLength={500}
            />
          </View>

          {/* Answers Input Section */}
          <View style={styles.section}>
            <View style={[styles.answersHeader, isRTL && styles.rtlRow]}>
              <Text style={[styles.sectionLabel, isRTL && styles.rtlText]}>{tScreens('customQuestion.answersLabel')}</Text>
              <TouchableOpacity 
                onPress={handleAddAnswer} 
                style={styles.addButton}
                disabled={answers.length >= 10}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6D28D9', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>{tScreens('customQuestion.addAnswer')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {answers.map((answer, index) => (
              <View key={index} style={[styles.answerRow, isRTL && styles.rtlRow]}>
                <View style={[styles.answerNumberCircle, isRTL && { marginRight: 0, marginLeft: SPACING.md }]}>
                  <Text style={styles.answerNumber}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.answerInput, isRTL && styles.rtlText]}
                  placeholder={tScreens('customQuestion.answerPlaceholder', { number: index + 1 })}
                  placeholderTextColor="#9CA3AF"
                  value={answer}
                  onChangeText={(value) => handleAnswerChange(index, value)}
                  maxLength={100}
                  textAlign={isRTL ? 'right' : 'left'}
                />
                {answers.length > 2 && (
                  <TouchableOpacity 
                    onPress={() => handleRemoveAnswer(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={[styles.tipsTitle, isRTL && styles.rtlText]}>{tScreens('customQuestion.tipsTitle')}</Text>
            <View style={styles.tipsList}>
              <View style={[styles.tipsItem, isRTL && styles.rtlRow]}>
                <View style={[styles.tipsBullet, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
                <Text style={[styles.tipsText, isRTL && styles.rtlText]}>
                  {tScreens('customQuestion.tip1')}
                </Text>
              </View>
              <View style={[styles.tipsItem, isRTL && styles.rtlRow]}>
                <View style={[styles.tipsBullet, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
                <Text style={[styles.tipsText, isRTL && styles.rtlText]}>
                  {tScreens('customQuestion.tip2')}
                </Text>
              </View>
              <View style={[styles.tipsItem, isRTL && styles.rtlRow]}>
                <View style={[styles.tipsBullet, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
                <Text style={[styles.tipsText, isRTL && styles.rtlText]}>
                  {tScreens('customQuestion.tip3')}
                </Text>
              </View>
            </View>
          </View>

          {/* Create & Save Button */}
          <TouchableOpacity
            onPress={handleCreateQuestion}
            disabled={isLoading || !slotLoaded}
            style={styles.createButton}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4F46E5', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createButtonGradient}
            >
              <Text style={styles.createButtonText}>
                {!slotLoaded ? tCommon('loading') : isLoading ? tScreens('customQuestion.saving') : tScreens('customQuestion.saveToSlot')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Clear Slot Button */}
          <TouchableOpacity onPress={handleClearSlot} style={styles.clearSlotButtonContainer} activeOpacity={0.8}>
            <Text style={styles.clearSlotButtonText}>{tScreens('customQuestion.clearThisSlot')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  questionInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.lg,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#666666',
  },
  answersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  answerNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  answerNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  answerInput: {
    flex: 1,
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.lg,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#666666',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#666666',
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipsBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: SPACING.md,
    marginTop: 6,
  },
  tipsText: {
    fontSize: 15,
    color: '#E0E0E0',
    flex: 1,
    lineHeight: 22,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: SPACING.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  createButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  clearSlotButtonContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clearSlotButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default CustomQuestionScreen;

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS, COMPONENT_STYLES } from '../design-system';
import { getQuestionsByCategory } from '../../backend/services/questionsService';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { logger } from '../../backend/utils/logger';
import type { GameQuestion } from '../../shared/types';
import type { LegacyQuestion } from '../../shared/types/game';
import type { RootStackParamList } from '../../shared/types/navigation';

const MultiplayerQuestionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { 
    selectedCategory, 
    selectedQuestions, 
    setQuestions, 
    createRoom, 
    loading, 
    error,
    clearError,
    leaveRoom,
    resetAll,
    cleanup
  } = useMultiplayer();

  const { categoryName } = route.params as { categoryName: string };
  const [questions, setQuestionsState] = useState<GameQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<GameQuestion | null>(null);
  const [selectedTurnDuration, setSelectedTurnDuration] = useState<number>(60); // Default 60 seconds
  const [creatingRoomForQuestion, setCreatingRoomForQuestion] = useState<string | null>(null);

  // Timer duration options (in seconds)
  const turnDurationOptions = [
    { value: 30, label: '30 seconds', description: 'Quick rounds' },
    { value: 45, label: '45 seconds', description: 'Fast-paced' },
    { value: 60, label: '1 minute', description: 'Standard' },
    { value: 90, label: '1.5 minutes', description: 'Relaxed' },
    { value: 120, label: '2 minutes', description: 'Leisurely' }
  ];
  
  logger.log('🎯 MultiplayerQuestionsScreen loaded with category:', categoryName);

  useEffect(() => {
    loadQuestions();
  }, [categoryName]);

  useEffect(() => {
    if (error) {
      logger.error('Multiplayer error:', error);
      clearError();
    }
  }, [error, clearError]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const categoryQuestions = await getQuestionsByCategory(categoryName);
      setQuestionsState(categoryQuestions);
    } catch (error) {
      logger.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const toLegacyQuestion = (question: GameQuestion): LegacyQuestion => ({
    id: question.id,
    text: question.title,
    answers: question.answers.map(answer => answer.text),
    category: question.category,
    difficulty: question.difficulty
  });

  const handleQuestionSelect = async (question: GameQuestion) => {
    // Prevent multiple simultaneous room creations
    if (creatingRoomForQuestion || loading) {
      return;
    }

    logger.log('🎯 Question selected, creating room:', question.title);
    setSelectedQuestion(question);
    setQuestions([toLegacyQuestion(question)]);
    setCreatingRoomForQuestion(question.id || question.title);

    try {
      const convertedQuestions: LegacyQuestion[] = [toLegacyQuestion(question)];
      const roomCode = await createRoom(categoryName, convertedQuestions);
      navigation.navigate('RoomLobby', { 
        roomCode, 
        turnDuration: selectedTurnDuration 
      });
    } catch (error) {
      // Error is handled by the context; user can tap another question to retry
      setCreatingRoomForQuestion(null);
    }
  };

  const handleBackToCategories = () => {
    navigation.goBack();
  };


  if (loadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f1e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f1e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
            <Text style={styles.backButtonArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{categoryName}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.content}>
          <View style={styles.noQuestionsContainer}>
            <Text style={styles.noQuestionsTitle}>No Questions Available</Text>
            <Text style={styles.noQuestionsText}>
              No questions are available for the "{categoryName}" category.
            </Text>
            <TouchableOpacity 
              style={styles.backToCategoriesButton} 
              onPress={handleBackToCategories}
            >
              <Text style={styles.backToCategoriesButtonText}>Back to Categories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
          <Text style={styles.backButtonArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{categoryName}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Turn Duration - at top */}
        <View style={styles.timerSection}>
          <Text style={styles.timerTitle}>⏱️ Turn Duration</Text>
          <View style={styles.durationRow}>
            {turnDurationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationButton,
                  selectedTurnDuration === option.value && styles.durationButtonSelected
                ]}
                onPress={() => setSelectedTurnDuration(option.value)}
                accessibilityLabel={`Select ${option.value} seconds turn duration`}
                accessibilityState={{ selected: selectedTurnDuration === option.value }}
              >
                <Text style={[
                  styles.durationButtonText,
                  selectedTurnDuration === option.value && styles.durationButtonTextSelected
                ]}>
                  {option.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Questions List - tap to create room instantly */}
        <View style={styles.questionsList}>
          {questions.map((item, index) => {
            const isCreating = creatingRoomForQuestion === (item.id || item.title);
            const isDisabled = loading || creatingRoomForQuestion !== null;
            
            return (
              <TouchableOpacity 
                key={item.id || item.title}
                style={[
                  styles.questionCard,
                  isCreating && styles.questionCardSelected
                ]} 
                onPress={() => handleQuestionSelect(item)}
                disabled={isDisabled}
                activeOpacity={0.8}
                accessibilityLabel={`Question ${index + 1}: ${item.title}`}
                accessibilityRole="button"
                accessibilityHint={`Tap to create room with this question. ${item.answers?.length || 0} answers available.`}
                accessibilityState={{ selected: isCreating, disabled: isDisabled }}
              >
                <View style={styles.questionCardContent}>
                  <Text style={styles.questionNumber}>Question {index + 1}</Text>
                  <Text style={styles.questionText}>{item.title}</Text>
                </View>
                {isCreating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.questionArrow}>→</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
  backButtonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600' as const,
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
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700' as const,
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
    paddingBottom: SPACING['2xl'],
  },
  timerSection: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#666666',
  },
  timerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  durationButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 40,
  },
  durationButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  durationButtonTextSelected: {
    color: COLORS.white,
  },
  questionsList: {
    gap: SPACING.md,
  },
  questionCard: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#666666',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  questionCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  questionCardContent: {
    flex: 1,
  },
  questionNumber: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: SPACING.sm,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  questionArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300' as const,
    marginLeft: SPACING.md,
  },
  creatingRoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  creatingRoomText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 18,
    marginTop: SPACING.md
  },
  noQuestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl
  },
  noQuestionsTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  noQuestionsText: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24
  },
  backToCategoriesButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8
  },
  backToCategoriesButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
});

export default MultiplayerQuestionsScreen;

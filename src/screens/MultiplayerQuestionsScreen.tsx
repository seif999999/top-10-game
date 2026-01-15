import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  FlatList,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS, COMPONENT_STYLES } from '../design-system';
import { getQuestionsByCategory } from '../services/questionsService';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { logger } from '../utils/logger';

const MultiplayerQuestionsScreen: React.FC = () => {
  const navigation = useNavigation();
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
  const [questions, setQuestionsState] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedTurnDuration, setSelectedTurnDuration] = useState<number>(60); // Default 60 seconds

  // Timer duration options (in seconds)
  const turnDurationOptions = [
    { value: 30, label: '30 seconds', description: 'Quick rounds' },
    { value: 45, label: '45 seconds', description: 'Fast-paced' },
    { value: 60, label: '1 minute', description: 'Standard' },
    { value: 90, label: '1.5 minutes', description: 'Relaxed' },
    { value: 120, label: '2 minutes', description: 'Leisurely' }
  ];
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  
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

  const handleQuestionSelect = (question: any) => {
    logger.log('🎯 Question selected:', question.title);
    setSelectedQuestion(question);
    setQuestions([question] as any); // Type assertion for now
  };

  const handleCreateRoom = async () => {
    if (!selectedQuestion) {
      Alert.alert('No Question Selected', 'Please select a question to create a room.');
      return;
    }

    try {
      // Convert GameQuestion to Question format for multiplayer service
      const convertedQuestions: any[] = [{
        id: selectedQuestion.id,
        text: selectedQuestion.title, // Use title as text
        answers: selectedQuestion.answers.map((answer: any) => answer.text), // Convert QuestionAnswer[] to string[]
        category: selectedQuestion.category,
        difficulty: selectedQuestion.difficulty
      }];
      
      const roomCode = await createRoom(categoryName, convertedQuestions);
      (navigation as any).navigate('RoomLobby', { 
        roomCode, 
        turnDuration: selectedTurnDuration 
      });
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleBackToCategories = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(backButtonScale, {
        toValue: 0.9,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      })
    ]).start();
    
    navigation.goBack();
  };


  if (loadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity 
              onPress={handleBackToCategories} 
              style={styles.backButton}
              accessibilityLabel="Go back to category selection"
              accessibilityRole="button"
              accessibilityHint="Returns to the category selection screen"
            >
              <View style={styles.backButtonIcon}>
                <Text style={styles.backButtonArrow}>‹</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Choose a Question</Text>
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
              accessibilityLabel="Go back to category selection"
              accessibilityRole="button"
              accessibilityHint="Returns to the category selection screen"
            >
              <Text style={styles.backToCategoriesButtonText}>Back to Categories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const renderQuestionItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.questionCard,
        selectedQuestion?.id === item.id && styles.questionCardSelected
      ]} 
      onPress={() => handleQuestionSelect(item)}
      accessibilityLabel={`Question ${index + 1}: ${item.title}`}
      accessibilityRole="button"
      accessibilityHint={`Select this question. ${item.answers?.length || 0} answers available.`}
      accessibilityState={{ selected: selectedQuestion?.id === item.id }}
    >
      <View style={styles.questionContent}>
        <Text style={[
          styles.questionTitle,
          selectedQuestion?.id === item.id && styles.questionTitleSelected
        ]}>
          {item.title}
        </Text>
        <Text style={styles.questionSubtitle}>
          {item.answers?.length || 0} answers • Tap to select
        </Text>
      </View>
      <View style={[
        styles.questionArrow,
        selectedQuestion?.id === item.id && styles.questionArrowSelected
      ]}>
        <Text style={[
          styles.arrowText,
          selectedQuestion?.id === item.id && styles.arrowTextSelected
        ]}>
          {selectedQuestion?.id === item.id ? '✓' : '→'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
            <View style={styles.backButtonIcon}>
              <Text style={styles.backButtonArrow}>‹</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Choose a Question</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Timer Duration Selection - Embedded at top */}
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

        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
        </View>

        <View style={styles.questionsContainer}>
          {questions.map((item, index) => (
            <View key={item.id || item.title}>
              {renderQuestionItem({ item, index })}
              {index < questions.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        {/* Create Room Button */}
        {selectedQuestion && (
          <View style={styles.createRoomContainer}>
            <TouchableOpacity
              style={[
                styles.createRoomButton,
                loading && styles.createRoomButtonDisabled
              ]}
              onPress={handleCreateRoom}
              disabled={loading}
              accessibilityLabel="Create room with selected question"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.createRoomButtonText}>Create Room</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonArrow: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center'
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  timerSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
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
  categoryInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center'
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  questionsContainer: {
    paddingBottom: SPACING.xl
  },
  questionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  questionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '08',
  },
  questionContent: {
    flex: 1
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    lineHeight: 24
  },
  questionTitleSelected: {
    color: COLORS.primary,
  },
  questionSubtitle: {
    color: COLORS.muted,
    fontSize: 14
  },
  questionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md
  },
  questionArrowSelected: {
    backgroundColor: COLORS.primary,
  },
  arrowText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700'
  },
  arrowTextSelected: {
    color: COLORS.white,
  },
  separator: {
    height: SPACING.md
  },
  createRoomContainer: {
    paddingVertical: SPACING.lg,
  },
  createRoomButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  createRoomButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  createRoomButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.white,
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
    color: COLORS.muted,
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
  }
});

export default MultiplayerQuestionsScreen;

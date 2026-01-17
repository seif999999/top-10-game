import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { RESPONSIVE } from '../utils/responsive';
import { Question } from '../../backend/services/multiplayerService';
import { AuthService } from '../../backend/services/authService';
import { sampleQuestions } from '../../backend/data/sampleQuestions';
import CategoryCarousel, { Category } from '../components/CategoryCarousel';

interface CreateRoomScreenProps {}

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { 
    selectedCategory, 
    selectedQuestions, 
    setCategory, 
    setQuestions, 
    createRoom, 
    loading, 
    error,
    clearError,
    leaveRoom,
    resetAll,
    cleanup
  } = useMultiplayer();
  const authService = AuthService.getInstance();

  // Get unique categories from sample questions
  const availableCategories = [...new Set(sampleQuestions.map(q => q.category))];
  
  // Get categories dynamically from sample questions
  const categories: Category[] = availableCategories.map(categoryName => {
    const iconMap: { [key: string]: string } = {
      'Sports': '⚽',
      'Movies': '🎬',
      'Music': '🎵',
      'Science': '🔬',
      'History': '📚',
      'Geography': '🌍',
      'Movies & TV': '📺',
      'Food & Drink': '🍕',
      'Technology': '💻'
    };
    
    const colorMap: { [key: string]: string } = {
      'Sports': '#FF6B6B',
      'Movies': '#4ECDC4',
      'Music': '#45B7D1',
      'Science': '#DDA0DD',
      'History': '#FFEAA7',
      'Geography': '#96CEB4',
      'Movies & TV': '#4ECDC4',
      'Food & Drink': '#FFB347',
      'Technology': '#87CEEB'
    };
    
    const descriptionMap: { [key: string]: string } = {
      'Sports': 'Athletics, games, and competitions',
      'Movies': 'Films, television, and entertainment',
      'Music': 'Songs, artists, and musical genres',
      'Science': 'Scientific discoveries and facts',
      'History': 'Historical events and figures',
      'Geography': 'Countries, cities, and landmarks',
      'Movies & TV': 'Films, television, and entertainment',
      'Food & Drink': 'Cuisines, dishes, and beverages',
      'Technology': 'Computers, gadgets, and innovation'
    };
    
    // Count questions for this category
    const questionCount = sampleQuestions.filter(q => q.category === categoryName).length;
    
    return {
      id: categoryName,
      name: categoryName,
      icon: iconMap[categoryName] || '❓',
      description: descriptionMap[categoryName] || 'General knowledge questions',
      color: colorMap[categoryName] || '#8B5CF6',
      questions: questionCount
    };
  });


  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedTurnDuration, setSelectedTurnDuration] = useState<number>(60); // Default 60 seconds

  // Timer duration options (in seconds)
  const turnDurationOptions = [
    { value: 30, label: '30 seconds', description: 'Quick rounds' },
    { value: 45, label: '45 seconds', description: 'Fast-paced' },
    { value: 60, label: '1 minute', description: 'Standard' },
    { value: 90, label: '1.5 minutes', description: 'Relaxed' },
    { value: 120, label: '2 minutes', description: 'Leisurely' }
  ];

  useEffect(() => {
    if (error) {
      logger.error('Multiplayer error:', error);
      clearError();
    }
  }, [error, clearError]);

  const handleCategorySelect = (category: Category) => {
    setCategory(category.id);
    setSelectedQuestionId(null);
    setQuestions([]);
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestionId(questionId);
    
    // Update selected questions - only one question
    const selectedQuestion = sampleQuestions.find(q => 
      q.category === selectedCategory && q.id === questionId
    );
    
    if (selectedQuestion) {
      setQuestions([selectedQuestion] as any); // Type assertion for now
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedCategory) {
      logger.error('No category selected');
      return;
    }

    if (selectedQuestions.length === 0) {
      logger.error('No questions selected');
      return;
    }

    // Filter out invalid questions instead of rejecting all
    const validQuestions = (selectedQuestions as any[]).filter(q => {
      const isValid = q && 
        q.title && 
        q.title.trim() !== '' && 
        q.answers && 
        Array.isArray(q.answers) && 
        q.answers.length > 0 &&
        q.answers.some((a: any) => a && a.text && a.text.trim() !== '');
      
      return isValid;
    });

    if (validQuestions.length === 0) {
      logger.error('❌ No valid questions found after filtering');
      return;
    }

    try {
      // Ensure user is authenticated before creating room
      await authService.ensureAuthenticated();
      
      // Convert GameQuestion to Question format for multiplayer service
      const convertedQuestions: any[] = validQuestions.map((gameQuestion: any) => {
        return {
          id: gameQuestion.id,
          text: gameQuestion.title, // Use title as text
          answers: gameQuestion.answers.map((answer: any) => answer.text), // Convert QuestionAnswer[] to string[]
          category: gameQuestion.category,
          difficulty: gameQuestion.difficulty
        };
      });
      
      const roomCode = await createRoom(selectedCategory, convertedQuestions);
      (navigation as any).navigate('RoomLobby', { 
        roomCode, 
        turnDuration: selectedTurnDuration 
      });
    } catch (error) {
      // Error is handled by the context
    }
  };


  const handleLeaveRoom = async () => {
    try {
      // Clean up any existing room session
      await leaveRoom();
      
      // Reset all multiplayer state
      resetAll();
      
      // Clean up listeners and connections
      cleanup();
      
      // Navigate back to main menu
      navigation.goBack();
    } catch (error) {
      logger.error('Error leaving room:', error);
      // Even if there's an error, still clean up and go back
      resetAll();
      cleanup();
      navigation.goBack();
    }
  };

  const currentQuestions = selectedCategory ? sampleQuestions.filter(q => q.category === selectedCategory) : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
          accessibilityLabel="Leave room and end session"
        >
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Room</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Category</Text>
          <View style={styles.carouselContainer}>
            <CategoryCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              showInstructions={true}
              instructionsText="Swipe to browse categories • Tap to select"
              cardWidth={RESPONSIVE.width.maxMd}
              cardHeight={RESPONSIVE.height.card}
              showQuestionCount={true}
              buttonText="🎯 Select"
            />
          </View>
        </View>

        {/* Question Selection */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a Question</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the question you want to use for your game
            </Text>
            <View style={styles.questionList}>
              {currentQuestions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.questionCard,
                    selectedQuestionId === question.id && styles.questionCardSelected
                  ]}
                  onPress={() => handleQuestionSelect(question.id)}
                  accessibilityLabel={`Select question: ${question.title}`}
                  accessibilityState={{ selected: selectedQuestionId === question.id }}
                >
                  <View style={styles.questionHeader}>
                    <Text style={[
                      styles.questionText,
                      selectedQuestionId === question.id && styles.questionTextSelected
                    ]}>
                      {question.title}
                    </Text>
                    <View style={[
                      styles.checkbox,
                      selectedQuestionId === question.id && styles.checkboxSelected
                    ]}>
                      {selectedQuestionId === question.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Timer Duration Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Turn Duration</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how long each player has to answer
          </Text>
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

        {/* Create Room Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedCategory || selectedQuestions.length === 0 || loading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateRoom}
            disabled={!selectedCategory || selectedQuestions.length === 0 || loading}
            accessibilityLabel="Create room with selected category and question"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Room</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  leaveButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.error || '#FF4444',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  carouselContainer: {
    height: RESPONSIVE.height.card,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  questionList: {
    gap: SPACING.md,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  questionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  questionTextSelected: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  buttonContainer: {
    paddingVertical: SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.white,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  durationButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
  },
  durationButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  durationButtonTextSelected: {
    color: COLORS.white,
  },
});

export default CreateRoomScreen;

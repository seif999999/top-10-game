import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { RESPONSIVE } from '../utils/responsive';
import { Question } from '../../backend/services/multiplayerService';
import { AuthService } from '../../backend/services/authService';
import { sampleQuestions } from '../../backend/data/sampleQuestions';
import { gameQuestionToRoomQuestion } from '../../backend/services/questionsService';
import CategoryCarousel, { Category } from '../components/CategoryCarousel';
import type { LegacyQuestion } from '../../shared/types/game';
import type { RootStackParamList } from '../../shared/types/navigation';
import useAppTranslation from '../../hooks/useTranslation';
import { useAudio } from '../contexts/AudioContext';

type SampleQuestion = typeof sampleQuestions[number];

interface CreateRoomScreenProps {}

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const { t, isRTL } = useAppTranslation('screens');
  const { playButtonClick } = useAudio();

  // Get unique categories from sample questions
  const availableCategories = [...new Set(sampleQuestions.map(q => q.category))];
  
  // Get categories dynamically from sample questions
  const categories: Category[] = availableCategories.map(categoryName => {
    const iconMap: { [key: string]: string } = {
      'Sports': '⚽',
      'Movies': '🎬',
      'Music': '🎵',
      'Science': '🔬',
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
  const turnDurationOptions = [30, 45, 60, 90, 120];
  const getDurationLabel = (v: number) => {
    switch (v) {
      case 30: return t('screens:multiplayer.createRoomScreen.duration30');
      case 45: return t('screens:multiplayer.createRoomScreen.duration45');
      case 60: return t('screens:multiplayer.createRoomScreen.duration60');
      case 90: return t('screens:multiplayer.createRoomScreen.duration90');
      case 120: return t('screens:multiplayer.createRoomScreen.duration120');
      default: return String(v);
    }
  };

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
      setQuestions([gameQuestionToRoomQuestion(selectedQuestion)]);
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
    // Check if it's a LegacyQuestion (answers is string[]) vs Question (answers is Answer[])
    // Cast to union type to allow proper type narrowing
    const questionsArray = selectedQuestions as Array<Question | LegacyQuestion>;
    const validQuestions = questionsArray.filter((question): question is Question => {
      if (!Array.isArray(question.answers) || question.answers.length === 0) {
        return false;
      }
      const firstAnswer = question.answers[0];
      if (typeof firstAnswer === 'string') {
        return false;
      }
      return question.answers.every(
        (a) =>
          typeof a === 'object' &&
          a !== null &&
          'text' in a &&
          typeof (a as { text: string }).text === 'string' &&
          (a as { text: string }).text.trim() !== ''
      );
    });

    if (validQuestions.length === 0) {
      logger.error('❌ No valid questions found after filtering');
      return;
    }

    try {
      void playButtonClick();
      // Ensure user is authenticated before creating room
      await authService.ensureAuthenticated();
      
      // Convert GameQuestion to Question format for multiplayer service
      const roomCode = await createRoom(selectedCategory, validQuestions);
      navigation.navigate('RoomLobby', { 
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
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
          accessibilityLabel={t('screens:multiplayer.createRoomScreen.leaveRoom')}
        >
          <Text style={styles.leaveButtonText}>{t('screens:multiplayer.createRoomScreen.leaveRoom')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('screens:multiplayer.createRoom')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('screens:multiplayer.createRoomScreen.chooseCategory')}</Text>
          <View style={styles.carouselContainer}>
            <CategoryCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              showInstructions={true}
              instructionsText={t('screens:multiplayer.createRoomScreen.carouselInstructions')}
              cardWidth={RESPONSIVE.width.maxMd}
              cardHeight={RESPONSIVE.height.card}
              showQuestionCount={true}
              buttonText={t('screens:multiplayer.createRoomScreen.selectButton')}
            />
          </View>
        </View>

        {/* Question Selection */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('screens:multiplayer.createRoomScreen.selectQuestion')}</Text>
            <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
              {t('screens:multiplayer.createRoomScreen.selectQuestionSubtitle')}
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
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('screens:multiplayer.createRoomScreen.turnDuration')}</Text>
          <Text style={[styles.sectionSubtitle, isRTL && styles.rtlText]}>
            {t('screens:multiplayer.createRoomScreen.turnDurationSubtitle')}
          </Text>
          <View style={[styles.durationRow, isRTL && styles.rtlRow]}>
            {turnDurationOptions.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.durationButton,
                  selectedTurnDuration === value && styles.durationButtonSelected
                ]}
                onPress={() => setSelectedTurnDuration(value)}
                accessibilityLabel={getDurationLabel(value)}
                accessibilityState={{ selected: selectedTurnDuration === value }}
              >
                <Text style={[
                  styles.durationButtonText,
                  selectedTurnDuration === value && styles.durationButtonTextSelected,
                  isRTL && styles.rtlText
                ]}>
                  {value}
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
            accessibilityLabel={t('screens:multiplayer.createRoomScreen.createRoomButton')}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.createButtonText}>{t('screens:multiplayer.createRoomScreen.createRoomButton')}</Text>
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
    backgroundColor: '#1a1a2e',
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
    fontSize: 24,
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
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default CreateRoomScreen;

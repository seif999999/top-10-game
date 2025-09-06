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
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';
import { Question } from '../services/multiplayerService';
import { AuthService } from '../services/authService';
import { sampleQuestions } from '../data/sampleQuestions';

const { width } = Dimensions.get('window');

interface CreateRoomScreenProps {}

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = () => {
  const navigation = useNavigation();
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
  const categories = availableCategories.map(categoryName => {
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
    
    return {
      id: categoryName,
      name: categoryName,
      icon: iconMap[categoryName] || '❓'
    };
  });


  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    if (error) {
      console.error('Multiplayer error:', error);
      clearError();
    }
  }, [error, clearError]);

  const handleCategorySelect = (categoryId: string) => {
    setCategory(categoryId);
    setSelectedQuestionIds([]);
    setQuestions([]);
  };

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      const newSelection = prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId];
      
      // Update selected questions
      const selectedQuestions = sampleQuestions.filter(q => 
        q.category === selectedCategory && newSelection.includes(q.id)
      );
      setQuestions(selectedQuestions as any); // Type assertion for now
      
      return newSelection;
    });
  };

  const handleCreateRoom = async () => {
    if (!selectedCategory) {
      console.error('No category selected');
      return;
    }

    if (selectedQuestions.length === 0) {
      console.error('No questions selected');
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
      console.error('❌ No valid questions found after filtering');
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
      (navigation as any).navigate('RoomLobby', { roomCode });
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
      console.error('Error leaving room:', error);
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
      <View style={styles.header}>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Choose a Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected
                ]}
                onPress={() => handleCategorySelect(category.id)}
                accessibilityLabel={`Select ${category.name} category`}
                accessibilityState={{ selected: selectedCategory === category.id }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Question Selection */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Select Questions ({selectedQuestions.length} selected)</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the questions you want to include in your game
            </Text>
            <View style={styles.questionList}>
              {currentQuestions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.questionCard,
                    selectedQuestionIds.includes(question.id) && styles.questionCardSelected
                  ]}
                  onPress={() => handleQuestionToggle(question.id)}
                  accessibilityLabel={`Select question: ${question.title}`}
                  accessibilityState={{ selected: selectedQuestionIds.includes(question.id) }}
                >
                  <View style={styles.questionHeader}>
                    <Text style={[
                      styles.questionText,
                      selectedQuestionIds.includes(question.id) && styles.questionTextSelected
                    ]}>
                      {question.title}
                    </Text>
                    <View style={[
                      styles.checkbox,
                      selectedQuestionIds.includes(question.id) && styles.checkboxSelected
                    ]}>
                      {selectedQuestionIds.includes(question.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.questionDifficulty}>
                    {question.difficulty.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


        {/* Create Room Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              (!selectedCategory || selectedQuestions.length === 0 || loading) && styles.createButtonDisabled
            ]}
            onPress={handleCreateRoom}
            disabled={!selectedCategory || selectedQuestions.length === 0 || loading}
            accessibilityLabel="Create room with selected category and questions"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.createButtonText}>Create Room</Text>
                <Text style={styles.createButtonSubtext}>
                  {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                </Text>
              </>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: COLORS.primary,
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
  questionDifficulty: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600' as const,
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
    marginBottom: SPACING.xs,
  },
  createButtonSubtext: {
    fontSize: 14,
    color: COLORS.white + 'CC',
  },
});

export default CreateRoomScreen;

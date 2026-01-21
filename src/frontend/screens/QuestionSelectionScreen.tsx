import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { QuestionSelectionScreenProps } from '../../shared/types/navigation';
import type { GameQuestion } from '../../shared/types';
import { getQuestionsByCategory } from '../../backend/services/questionsService';
import { TeamSetupConfig } from '../../shared/types/teams';

const QuestionSelectionScreen: React.FC<QuestionSelectionScreenProps> = ({ navigation, route }) => {
  const { categoryName, gameMode, teamConfig: passedTeamConfig } = route.params;
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  logger.log('🎯 QuestionSelectionScreen loaded with params:', route.params);
  logger.log('🎯 Category name:', categoryName);
  logger.log('🎯 Team config passed:', passedTeamConfig);

  useEffect(() => {
    loadQuestions();
  }, [categoryName]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const categoryQuestions = await getQuestionsByCategory(categoryName);
      setQuestions(categoryQuestions);
    } catch (error) {
      logger.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = async (question: GameQuestion) => {
    logger.log('🎯 Question selected:', question.title);
    
    if (gameMode === 'multiplayer') {
      // ✅ SECURITY: For multiplayer, generate secure room ID and navigate to GameScreen
      const { generateSecureId } = await import('../../backend/utils/secureRandom');
      const roomId = await generateSecureId('room');
      navigation.navigate('GameScreen', {
        roomId,
        categoryId: categoryName,
        categoryName: categoryName,
        selectedQuestion: question,
        isMultiplayer: true
      });
    } else {
      // For single player - check if teamConfig was passed from category screen
      if (passedTeamConfig && passedTeamConfig.numberOfTeams > 1) {
        // Use the team config from category selection
        navigation.navigate('GameScreen', {
          roomId: 'single-player',
          categoryId: categoryName,
          categoryName: categoryName,
          selectedQuestion: question,
          isMultiplayer: false,
          teamConfig: passedTeamConfig
        });
      } else {
        // Regular single player mode
        navigation.navigate('GameScreen', {
          roomId: 'single-player',
          categoryId: categoryName,
          categoryName: categoryName,
          selectedQuestion: question,
          isMultiplayer: false
        });
      }
    }
  };


  const handleBackToCategories = () => {
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  if (loading) {
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
        <View style={[styles.header, { paddingTop: insets.top * 0.5 }]}>
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
      <View style={[styles.header, { paddingTop: insets.top * 0.5 }]}>
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
        {/* Questions List */}
        <View style={styles.questionsList}>
          {questions.map((item, index) => (
            <TouchableOpacity 
              key={item.id || item.title}
              style={styles.questionCard} 
              onPress={() => handleQuestionSelect(item)}
              activeOpacity={0.8}
            >
              <View style={styles.questionCardContent}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text style={styles.questionText}>{item.title}</Text>
              </View>
              <Text style={styles.questionArrow}>→</Text>
            </TouchableOpacity>
          ))}
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
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  sectionLabelContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textAlign: 'left',
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default QuestionSelectionScreen;

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
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS, COMPONENT_STYLES } from '../design-system';
import { QuestionSelectionScreenProps } from '../types/navigation';
import { getQuestionsByCategory } from '../services/questionsService';
import { FEATURES } from '../config/featureFlags';
import TeamSetupModal from '../components/TeamSetupModal';
import { TeamSetupConfig } from '../types/teams';

const QuestionSelectionScreen: React.FC<QuestionSelectionScreenProps> = ({ navigation, route }) => {
  const { categoryName, gameMode } = route.params;
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  
  console.log('🎯 QuestionSelectionScreen loaded with params:', route.params);
  console.log('🎯 Category name:', categoryName);

  useEffect(() => {
    loadQuestions();
  }, [categoryName]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const categoryQuestions = getQuestionsByCategory(categoryName);
      setQuestions(categoryQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (question: any) => {
    console.log('🎯 Question selected:', question.title);
    
    if (gameMode === 'multiplayer') {
      // For multiplayer, generate room ID and navigate to GameScreen
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      navigation.navigate('GameScreen', {
        roomId,
        categoryId: categoryName,
        categoryName: categoryName,
        selectedQuestion: question,
        isMultiplayer: true
      });
    } else {
      // For single player - check if teams are enabled
      if (FEATURES.teamsEnabled) {
        setSelectedQuestion(question);
        setShowTeamSetup(true);
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

  const handleTeamSetupStart = (config: TeamSetupConfig) => {
    try {
      console.log('🎮 Starting team game with config:', config);
      
      if (!selectedQuestion) {
        Alert.alert('Error', 'No question selected');
        return;
      }

      // Navigate to GameScreen with team configuration
      navigation.navigate('GameScreen', {
        roomId: 'single-player',
        categoryId: categoryName,
        categoryName: categoryName,
        selectedQuestion: selectedQuestion,
        isMultiplayer: false,
        teamConfig: config
      });
      
      // Close the modal
      setShowTeamSetup(false);
    } catch (error) {
      console.error('Error starting team game:', error);
      Alert.alert('Error', 'Failed to start team game. Please try again.');
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
    
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  if (loading) {
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

  const renderQuestionItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity 
      style={styles.questionCard} 
      onPress={() => handleQuestionSelect(item)}
    >
      <View style={styles.questionContent}>
        <Text style={styles.questionTitle}>{item.title}</Text>
        <Text style={styles.questionSubtitle}>
          {item.answers?.length || 0} answers • Tap to play
        </Text>
      </View>
      <View style={styles.questionArrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: SPACING.md }]}>
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
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <View style={styles.questionsList}>
          {questions.map((item, index) => (
            <View key={item.id || item.title}>
              {renderQuestionItem({ item, index })}
              {index < questions.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Team Setup Modal */}
      <TeamSetupModal
        visible={showTeamSetup}
        onClose={() => setShowTeamSetup(false)}
        onStartGame={handleTeamSetupStart}
      />
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
    fontWeight: '700'
  },
  placeholder: {
    width: 60
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  categoryInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 16
  },
  questionsList: {
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
  arrowText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700'
  },
  separator: {
    height: SPACING.md
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
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default QuestionSelectionScreen;

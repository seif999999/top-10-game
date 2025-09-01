import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { QuestionSelectionScreenProps } from '../types/navigation';
import { getQuestionsByCategory } from '../services/questionsService';
import { FEATURES } from '../config/featureFlags';
import TeamSetupModal from '../components/TeamSetupModal';
import { TeamSetupConfig } from '../types/teams';

const QuestionSelectionScreen: React.FC<QuestionSelectionScreenProps> = ({ navigation, route }) => {
  const { categoryName, gameMode } = route.params;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
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
          <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose a Question</Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Question</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <FlatList
          data={questions}
          renderItem={renderQuestionItem}
          keyExtractor={(item) => item.id || item.title}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  backButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.card
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
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
    borderColor: 'transparent'
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

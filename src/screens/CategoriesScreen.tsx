import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import CategoryCard from '../components/CategoryCard';
import { Category } from '../types';
import { COLORS, SPACING } from '../utils/constants';
import { CategoriesScreenProps } from '../types/navigation';
import { getCategories, getQuestionStats, getQuestionsByCategory } from '../services/questionsService';

const { width } = Dimensions.get('window');

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<{[key: string]: number}>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryQuestions, setCategoryQuestions] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoryNames = getCategories();
      const stats = getQuestionStats();
      
      const categoriesWithStats: Category[] = categoryNames.map((name, index) => ({
        id: (index + 1).toString(),
        name,
        description: `Top 10 ${name.toLowerCase()} questions`
      }));
      
      setCategories(categoriesWithStats);
      
      // Create stats mapping
      const statsMap: {[key: string]: number} = {};
      categoriesWithStats.forEach(cat => {
        const categoryQuestions = stats.difficultyBreakdown ? 
          Object.values(stats.difficultyBreakdown).reduce((sum: number, count: any) => sum + (count as number), 0) : 0;
        statsMap[cat.name] = categoryQuestions;
      });
      setCategoryStats(statsMap);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    if (expandedCategory === category.id) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category.id);
      // Load questions for this category if not already loaded
      if (!categoryQuestions[category.name]) {
        const questions = getQuestionsByCategory(category.name);
        setCategoryQuestions(prev => ({
          ...prev,
          [category.name]: questions.slice(0, 5) // Show first 5 questions
        }));
      }
    }
  };

  const handleStartGame = (category: Category) => {
    console.log('🎮 Starting game for category:', category.name);
    console.log('🎮 Navigating to QuestionSelection with params:', {
      categoryName: category.name
    });
    
    try {
      navigation.navigate('QuestionSelection', {
        categoryName: category.name,
        gameMode: 'single'
      });
      console.log('✅ Navigation successful');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  const handleQuestionSelect = (category: Category, question: any) => {
    navigation.navigate('QuestionSelection', {
      categoryName: category.name,
      gameMode: 'single'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Text style={styles.backButtonArrow}>‹</Text>
          </View>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSubtitle}>Choose your game</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Game Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>🎯 How to Play</Text>
          <View style={styles.instructionsGrid}>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>📝</Text>
              <Text style={styles.instructionTitle}>Read Carefully</Text>
              <Text style={styles.instructionText}>Read the question and think about the top 10 answers</Text>
            </View>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>✍️</Text>
              <Text style={styles.instructionTitle}>Type Answers</Text>
              <Text style={styles.instructionText}>Submit multiple answers - the more the better!</Text>
            </View>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>🏆</Text>
              <Text style={styles.instructionTitle}>Score Points</Text>
              <Text style={styles.instructionText}>Closer to #1 = more points. Time matters too!</Text>
            </View>
            <View style={styles.instructionCard}>
              <Text style={styles.instructionIcon}>⏱️</Text>
              <Text style={styles.instructionTitle}>Beat the Clock</Text>
              <Text style={styles.instructionText}>You have 30-90 seconds per question</Text>
            </View>
          </View>
        </View>

        {/* Categories List */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Available Categories</Text>
          <Text style={styles.sectionSubtitle}>Tap any category to see all questions</Text>
          
          {categories.map((item) => (
            <View key={item.id} style={styles.categoryContainer}>
              <CategoryCard 
                category={item} 
                onPress={() => handleStartGame(item)}
                isExpanded={expandedCategory === item.id}
              />
              
              {expandedCategory === item.id && (
                <View style={styles.questionsContainer}>
                  <View style={styles.questionsHeader}>
                    <Text style={styles.questionsTitle}>Select a Question:</Text>
                    <Text style={styles.questionsCount}>
                      {categoryQuestions[item.name]?.length || 0} questions available
                    </Text>
                  </View>
                  
                  {categoryQuestions[item.name]?.map((question, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.questionItem}
                      onPress={() => handleQuestionSelect(item, question)}
                    >
                      <View style={styles.questionContent}>
                        <Text style={styles.questionNumber}>{index + 1}</Text>
                        <View style={styles.questionTextContainer}>
                          <Text style={styles.questionText}>
                            {question.title}
                          </Text>
                          <Text style={styles.questionDifficulty}>
                            {question.difficulty} • {question.answers?.length || 0} answers
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.playIcon}>▶️</Text>
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity 
                    style={styles.startGameButton}
                    onPress={() => handleStartGame(item)}
                  >
                    <Text style={styles.startGameIcon}>🎮</Text>
                    <Text style={styles.startGameButtonText}>Play All Questions</Text>
                    <Text style={styles.startGameSubtext}>Full category challenge</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📚</Text>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>❓</Text>
              <Text style={styles.statNumber}>
                {Object.values(categoryStats).reduce((sum, count) => sum + count, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Questions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 16,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
     backButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     borderRadius: 25,
     backgroundColor: 'rgba(139, 92, 246, 0.08)',
     borderWidth: 1.5,
     borderColor: 'rgba(139, 92, 246, 0.3)',
     shadowColor: '#8B5CF6',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
     backButtonIcon: {
     width: 24,
     height: 24,
     borderRadius: 12,
     backgroundColor: 'rgba(139, 92, 246, 0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: SPACING.xs,
   },
   backButtonArrow: {
     color: '#8B5CF6',
     fontSize: 18,
     fontWeight: '700',
     lineHeight: 20,
   },
   backButtonText: {
     color: '#8B5CF6',
     fontSize: 14,
     fontWeight: '600',
     letterSpacing: 0.3,
   },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2
  },
  scrollView: {
    flex: 1
  },
  instructionsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.lg
  },
  instructionsTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.lg
  },
  instructionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md
  },
  instructionCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  instructionIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm
  },
  instructionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center'
  },
  instructionText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16
  },
  categoriesSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg
  },
  categoryContainer: {
    marginBottom: SPACING.lg
  },
  questionsContainer: {
    backgroundColor: COLORS.card,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.xs,
    padding: SPACING.lg,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  questionsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  questionsCount: {
    color: COLORS.muted,
    fontSize: 12
  },
  questionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  questionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  questionNumber: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: SPACING.md,
    minWidth: 20
  },
  questionTextContainer: {
    flex: 1
  },
  questionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2
  },
  questionDifficulty: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '500'
  },
  playIcon: {
    fontSize: 16
  },
  startGameButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  startGameIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2
  },
  startGameSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center'
  },
  placeholder: {
    width: 40, // Adjust as needed for spacing
  }
});

export default CategoriesScreen;



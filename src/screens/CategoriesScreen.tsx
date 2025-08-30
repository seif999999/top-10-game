import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions, Alert } from 'react-native';
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
    navigation.navigate('GameLobby', {
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const handleQuestionSelect = (category: Category, question: any) => {
    navigation.navigate('GameLobby', {
      categoryId: category.id,
      categoryName: category.name,
      selectedQuestion: question
    });
  };

  const handleHelp = () => {
    Alert.alert(
      '🎯 How to Play TOP 10',
      'Game Rules:\n\n1. Choose a category and question\n2. Type your answers in the input field\n3. Submit multiple answers - find all 10 correct ones!\n4. Scoring: Rank 1 = 1 point, Rank 10 = 10 points\n5. No time pressure - take your time!\n6. Game ends when you find all 10 correct answers\n7. Each question is scored independently\n\nGood luck! 🏆',
      [{ text: 'OK' }]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Categories</Text>
          <Text style={styles.headerSubtitle}>Choose your challenge</Text>
        </View>
        <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
          <Text style={styles.helpIcon}>❓</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Categories List */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Available Categories</Text>
          <Text style={styles.sectionSubtitle}>Tap to expand and see questions</Text>
          
          {categories.map((item) => (
            <View key={item.id} style={styles.categoryContainer}>
              <CategoryCard 
                category={item} 
                onPress={() => handleCategoryPress(item)}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600'
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
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  helpIcon: {
    fontSize: 18
  },
  scrollView: {
    flex: 1
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
  }
});

export default CategoriesScreen;



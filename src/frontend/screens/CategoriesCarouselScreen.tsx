import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Dimensions,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { CategoriesScreenProps } from '../../shared/types/navigation';
import { getQuestionsByCategory } from '../../backend/services/questionsService';

const { width, height } = Dimensions.get('window');

const categories = [
  {
    id: 'Sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Popular games, athletes, and sporting events',
    gradient: ['#FF6B6B', '#FF8787'],
    questionCount: 12,
  },
  {
    id: 'Movies',
    name: 'Movies',
    icon: '🎬',
    description: 'Films, actors, directors, and cinema history',
    gradient: ['#4ECDC4', '#44A8A0'],
    questionCount: 15,
  },
  {
    id: 'Music',
    name: 'Music',
    icon: '🎵',
    description: 'Artists, songs, albums, and music trivia',
    gradient: ['#45B7D1', '#3498DB'],
    questionCount: 14,
  },
  {
    id: 'Science',
    name: 'Science',
    icon: '🔬',
    description: 'Scientific discoveries, concepts, and innovations',
    gradient: ['#DDA0DD', '#BA68C8'],
    questionCount: 10,
  },
  {
    id: 'History',
    name: 'History',
    icon: '📚',
    description: 'Historical events, figures, and civilizations',
    gradient: ['#FFEAA7', '#FDCB6E'],
    questionCount: 13,
  },
  {
    id: 'Geography',
    name: 'Geography',
    icon: '🌍',
    description: 'Countries, cities, landmarks, and capitals',
    gradient: ['#96CEB4', '#74B396'],
    questionCount: 16,
  },
  {
    id: 'Food',
    name: 'Food & Drink',
    icon: '🍕',
    description: 'Cuisine, restaurants, recipes, and beverages',
    gradient: ['#FFB347', '#FF9F00'],
    questionCount: 11,
  },
  {
    id: 'Technology',
    name: 'Technology',
    icon: '💻',
    description: 'Tech companies, innovations, and digital trends',
    gradient: ['#87CEEB', '#5DADE2'],
    questionCount: 14,
  },
];

const CategoriesCarouselScreen: React.FC<CategoriesScreenProps> = ({ navigation, route }) => {
  const { gameMode } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});
  const insets = useSafeAreaInsets();
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;

  // Only apply new design for single player mode
  const isSinglePlayer = gameMode === 'single';

  // Load question counts for all categories
  useEffect(() => {
    const loadQuestionCounts = async () => {
      const counts: { [key: string]: number } = {};
      for (const category of categories) {
        try {
          const questions = await getQuestionsByCategory(category.name);
          counts[category.name] = questions.length;
        } catch (error) {
          logger.error(`Error loading questions for ${category.name}:`, error);
          counts[category.name] = category.questionCount; // Fallback to default
        }
      }
      setQuestionCounts(counts);
    };
    
    if (isSinglePlayer) {
      loadQuestionCounts();
    }
  }, [isSinglePlayer]);

  // Update animation when currentIndex changes
  useEffect(() => {
    // Smooth transition animation - fade in the new card
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

  const handleBackToHome = () => {
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

  const handleContinue = () => {
    const currentCategory = categories[currentIndex];
    logger.log('🎯 Continue pressed with category:', currentCategory.name);
    
    navigation.navigate('QuestionSelection', {
      categoryName: currentCategory.name,
      gameMode: gameMode
    });
  };

  const handlePreviousCategory = () => {
    if (currentIndex > 0) {
      // Button press animation
      Animated.sequence([
        Animated.timing(leftButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(leftButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNextCategory = () => {
    if (currentIndex < categories.length - 1) {
      // Button press animation
      Animated.sequence([
        Animated.timing(rightButtonScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rightButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      setCurrentIndex(currentIndex + 1);
    }
  };

  // For single player mode, use new carousel design
  if (isSinglePlayer) {
    const currentCategory = categories[currentIndex];
    const cardHeight = 400;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        {/* Dark Purple Gradient Background */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f1e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <Text style={styles.backButtonArrow}>←</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Select Category</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Carousel Container */}
        <View style={styles.carouselWrapper}>
          {/* Left Navigation Button */}
          <View style={styles.navButtonContainer}>
            {currentIndex > 0 && (
              <Animated.View style={{ transform: [{ scale: leftButtonScale }] }}>
                <TouchableOpacity
                  onPress={handlePreviousCategory}
                  style={styles.navButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonChevron}>{'<'}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Current Card - Always Centered */}
          <Animated.View
            style={[
              styles.currentCard,
              {
                opacity: cardOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={currentCategory.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCardGradient}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardContentInner}>
                  <Text style={styles.categoryIcon}>{currentCategory.icon}</Text>
                  <Text style={styles.categoryName}>{currentCategory.name}</Text>
                  <Text style={styles.categoryDescription}>{currentCategory.description}</Text>
                </View>
                <View style={styles.questionCountBadge}>
                  <Text style={styles.questionCountText}>
                    {questionCounts[currentCategory.name] || currentCategory.questionCount} Questions
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Right Navigation Button */}
          <View style={styles.navButtonContainer}>
            {currentIndex < categories.length - 1 && (
              <Animated.View style={{ transform: [{ scale: rightButtonScale }] }}>
                <TouchableOpacity
                  onPress={handleNextCategory}
                  style={styles.navButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonChevron}>{'>'}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <View style={[styles.continueButtonContainer, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity
            onPress={handleContinue}
            style={styles.continueButton}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Text style={styles.continueButtonArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // For multiplayer mode, keep existing design (fallback)
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
            <Text style={styles.backButtonArrow}>←</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderText}>Multiplayer category selection</Text>
      </View>
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
    paddingHorizontal: SPACING.md,
    minHeight: 56,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backButtonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600' as const,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carouselWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  navButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonChevron: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  currentCard: {
    width: '75%',
    maxWidth: 400,
    height: 400,
    marginHorizontal: SPACING.md,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  categoryCardGradient: {
    width: '100%',
    height: '100%',
    padding: SPACING.xl * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContentInner: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  categoryIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    textAlign: 'center',
  },
  questionCountBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  questionCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#0A0A0A',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueButtonArrow: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: SPACING.sm,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.text,
    fontSize: 16,
  },
});

export default CategoriesCarouselScreen;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, ANIMATIONS } from '../design-system';
import useAppTranslation, { useTranslationHelpers } from '../../hooks/useTranslation';
import i18n from '../../config/i18n';
import { logger } from '../../backend/utils/logger';
import { getQuestionsByCategory } from '../../backend/services/questionsService';
import { ROUND_TIMER_OPTIONS } from '../../shared/types/teams';
import type { RootStackParamList } from '../../shared/types/navigation';
import CustomQuestionService from '../../backend/services/customQuestionService';
import { getCategories } from '../../backend/services/questionsService';

const { width, height } = Dimensions.get('window');

// Import category images
const categoryImages: { [key: string]: any } = {
  'Random': require('../assets/images/random.webp'),
  'Sports': require('../assets/images/sports.jpeg'),
  'Movies': require('../assets/images/movies.jpg'),
  'Music': require('../assets/images/music.webp'),
  'Science': require('../assets/images/science.jpg'),
  'Geography': require('../assets/images/geography.jpg'),
  'Food': require('../assets/images/food.webp'),
  'Technology': require('../assets/images/technology.jpg'),
  'Masry': require('../assets/images/egypt.jpg'),
  'Custom': require('../assets/images/createyourown.jpg'),
};

const categories = [
  {
    id: 'Random',
    name: 'Random',
    icon: '🎲',
    description: 'Surprise me! Pick a random category and question',
    gradient: ['#059669', '#10B981'],
    questionCount: 0,
    isRandom: true,
  },
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
  {
    id: 'Masry',
    name: 'Masry',
    icon: '🇪🇬',
    description: 'Egyptian culture, food, movies, music, and more',
    gradient: ['#C41E3A', '#000000'],
    questionCount: 20,
  },
  {
    id: 'General Knowledge',
    name: 'General Knowledge',
    icon: '🧠',
    description: 'Famous brands, countries, celebrities, and more',
    gradient: ['#9333EA', '#7C3AED'],
    questionCount: 50,
  },
  {
    id: 'Custom',
    name: 'Create Your Own',
    icon: '✏️',
    description: 'Play your saved custom questions',
    gradient: ['#5B21B6', '#7C3AED'],
    questionCount: 0,
  },
];

interface MultiplayerCategoryScreenProps {}

const MultiplayerCategoryScreen: React.FC<MultiplayerCategoryScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, isRTL } = useAppTranslation('screens');
  const { translateCategory } = useTranslationHelpers();
  const insets = useSafeAreaInsets();
  const { 
    setCategory, 
    error,
    clearError,
    leaveRoom,
    resetAll,
    cleanup
  } = useMultiplayer();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});
  const [roundTimer, setRoundTimer] = useState(60);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0.7)).current;
  const backgroundScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (error) {
      logger.error('Multiplayer error:', error);
      clearError();
    }
  }, [error, clearError]);

  // Load question counts for all categories
  useEffect(() => {
    const loadQuestionCounts = async () => {
      const counts: { [key: string]: number } = {};
      let totalQuestions = 0;
      
      for (const category of categories) {
        try {
          // Skip Random category - we'll calculate its total later
          if (category.id === 'Random') {
            continue;
          }
          // Handle Custom category separately
          if (category.id === 'Custom') {
            const customQuestionService = CustomQuestionService.getInstance();
            const customQuestions = await customQuestionService.getAllCustomQuestions();
            counts[category.name] = customQuestions.length;
          } else {
            const questions = await getQuestionsByCategory(category.name);
            counts[category.name] = questions.length;
            totalQuestions += questions.length;
          }
        } catch (error) {
          logger.error(`Error loading questions for ${category.name}:`, error);
          counts[category.name] = category.questionCount; // Fallback to default
          if (category.id !== 'Custom') {
            totalQuestions += category.questionCount;
          }
        }
      }
      
      // Set the total for Random category
      counts['Random'] = totalQuestions;
      setQuestionCounts(counts);
    };
    
    loadQuestionCounts();
  }, []);

  // Update animation when currentIndex changes
  useEffect(() => {
    // Smooth transition animation - fade in the new card
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Reset card scale and overlay opacity when category changes
    if (categoryImages[categories[currentIndex]?.id]) {
      cardScale.setValue(1);
      overlayOpacity.setValue(0.7);
      backgroundScale.setValue(1);
    }
  }, [currentIndex]);

  // Press animation handlers for image-based cards
  const handleCardPressIn = useCallback(() => {
    if (categoryImages[categories[currentIndex]?.id]) {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1.02,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 1.05,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIndex, cardScale, overlayOpacity, backgroundScale]);

  const handleCardPressOut = useCallback(() => {
    if (categoryImages[categories[currentIndex]?.id]) {
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIndex, cardScale, overlayOpacity, backgroundScale]);

  const handleBackToMenu = async () => {
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
    
    try {
      // Clean up any existing room session
      await leaveRoom();
      
      // Reset all multiplayer state
      resetAll();
      
      // Clean up listeners and connections
      cleanup();
      
      // Navigate back to multiplayer menu
      navigation.goBack();
    } catch (error) {
      logger.error('Error leaving room:', error);
      // Even if there's an error, still clean up and go back
      resetAll();
      cleanup();
      navigation.goBack();
    }
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

  const handleCategorySelect = async () => {
    const currentCategory = categories[currentIndex];
    
    // Handle Random category - pick random category and question
    if (currentCategory.id === 'Random') {
      if (isLoadingRandom) return;
      setIsLoadingRandom(true);
      
      try {
        // Get all categories except 'Custom' and 'Random'
        const allCategories = getCategories().filter(cat => cat !== 'Custom');
        
        if (allCategories.length === 0) {
          setIsLoadingRandom(false);
          return;
        }
        
        // Pick a random category
        const randomCategoryIndex = Math.floor(Math.random() * allCategories.length);
        const randomCategory = allCategories[randomCategoryIndex];
        
        // Set the random category in multiplayer context
        setCategory(randomCategory);
        
        // Navigate to MultiplayerQuestions with the random category
        navigation.navigate('MultiplayerQuestions', { 
          categoryName: randomCategory 
        });
      } catch (error) {
        logger.error('Error loading random game:', error);
      } finally {
        setIsLoadingRandom(false);
      }
      return;
    }
    
    setCategory(currentCategory.id);
    
    // Use category id for Custom category (questionsService expects 'Custom')
    const categoryNameForNav = currentCategory.id === 'Custom' ? 'Custom' : currentCategory.name;
    
    // Navigate to MultiplayerQuestions with the selected category
    navigation.navigate('MultiplayerQuestions', { 
      categoryName: categoryNameForNav 
    });
  };

  const handleContinue = () => {
    handleCategorySelect();
  };

  const currentCategory = categories[currentIndex];

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
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
            <Text style={styles.backButtonArrow}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('gameSetup.title')}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Scroll hint - scrolls away when user scrolls down */}
        <Text style={styles.scrollDownHint}>{t('gameSetup.scrollDown')}</Text>
        {/* Category Label */}
        <View style={styles.categoryLabelContainer}>
          <Text style={styles.settingLabel}>{t('gameSetup.category')}</Text>
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
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={handleCardPressIn}
              onPressOut={handleCardPressOut}
              disabled={!categoryImages[categories[currentIndex]?.id]}
            >
            <Animated.View
              style={[
                styles.currentCard,
                {
                  opacity: cardOpacity,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              {categoryImages[currentCategory.id] ? (
                // Category with image background
                <View style={styles.categoryCardGradient}>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        transform: [{ scale: backgroundScale }],
                      },
                    ]}
                  >
                    <ImageBackground
                      source={categoryImages[currentCategory.id]}
                      style={StyleSheet.absoluteFill}
                      imageStyle={styles.categoryImageStyle}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  
                  {/* Dark gradient overlay */}
                  <Animated.View style={[styles.categoryOverlay, { opacity: overlayOpacity }]}>
                    <LinearGradient
                      colors={['rgba(0, 0, 0, 0.65)', 'rgba(0, 0, 0, 0.80)', 'rgba(0, 0, 0, 0.70)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                  
                  {/* Text overlay */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardContentInner}>
                      <Text style={styles.egyptCategoryName}>
                        {translateCategory(currentCategory.id.toLowerCase())}
                      </Text>
                      <Text style={styles.egyptCategoryDescription}>
                        {i18n.t(`descriptions.${currentCategory.id.toLowerCase()}`, { ns: 'categories' })}
                      </Text>
                    </View>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.egyptQuestionCountText}>
                        {t('gameSetup.questionsCount', { count: questionCounts[currentCategory.name] ?? currentCategory.questionCount })}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Regular category with gradient
                <LinearGradient
                  colors={currentCategory.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryCardGradient}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardContentInner}>
                      <Text style={styles.categoryIcon}>{currentCategory.icon}</Text>
                      <Text style={styles.categoryName}>
                        {translateCategory(currentCategory.id.toLowerCase())}
                      </Text>
                      <Text style={styles.categoryDescription}>
                        {i18n.t(`descriptions.${currentCategory.id.toLowerCase()}`, { ns: 'categories' })}
                      </Text>
                    </View>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.questionCountText}>
                        {t('gameSetup.questionsCount', { count: questionCounts[currentCategory.name] ?? currentCategory.questionCount })}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              )}
            </Animated.View>
          </TouchableOpacity>

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

        {/* Game Settings Section - Timer Only */}
        <View style={styles.settingsSection}>
          {/* Turn Duration */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('gameSetup.turnDuration')}</Text>
            <View style={styles.timerContainer}>
              {ROUND_TIMER_OPTIONS.map((timer) => (
                <TouchableOpacity
                  key={timer}
                  onPress={() => setRoundTimer(timer)}
                  style={[
                    styles.timerButton,
                    roundTimer === timer && styles.timerButtonActive
                  ]}
                >
                  <Text style={[
                    styles.timerButtonText,
                    roundTimer === timer && styles.timerButtonTextActive
                  ]}>
                    {timer === 0 ? '∞' : `${timer}s`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Continue Button - Inside ScrollView so it stays in content flow */}
        <View style={[styles.continueButtonContainer, { paddingBottom: insets.bottom + SPACING.xl }]}>
          <TouchableOpacity
            onPress={handleContinue}
            style={[styles.continueButton, isLoadingRandom && styles.continueButtonDisabled]}
            activeOpacity={0.9}
            disabled={isLoadingRandom}
          >
            <LinearGradient
              colors={categories[currentIndex].id === 'Random' ? ['#059669', '#047857'] : ['#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                {isLoadingRandom ? t('gameSetup.loading') : (categories[currentIndex].id === 'Random' ? t('gameSetup.startRandomGame') : t('gameSetup.continue'))}
              </Text>
              <Text style={styles.continueButtonArrow}>
                {categories[currentIndex].id === 'Random' ? '🎲' : (isRTL ? '←' : '→')}
              </Text>
            </LinearGradient>
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
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollDownHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  carouselWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
    minHeight: 400,
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
    borderRadius: 24,
    overflow: 'hidden',
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
  // Category image styles
  categoryImageStyle: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  egyptCategoryName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  egyptCategoryDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  egyptQuestionCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  continueButtonContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
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
  continueButtonDisabled: {
    opacity: 0.7,
  },
  settingsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.xl,
  },
  categoryLabelContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    marginBottom: SPACING.lg,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  timerContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  timerButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 70,
    alignItems: 'center',
  },
  timerButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timerButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default MultiplayerCategoryScreen;

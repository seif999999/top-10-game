import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import { getQuestionsByCategory, getRandomQuestion, getCategories } from '../../backend/services/questionsService';
import { ROUND_TIMER_OPTIONS } from '../../shared/types/teams';
import type { RootStackParamList } from '../../shared/types/navigation';
import type { GameQuestion } from '../../shared/types';
import type { LegacyQuestion } from '../../shared/types/game';
import CustomQuestionService from '../../backend/services/customQuestionService';
import ThemedAlert from '../utils/themedAlert';
import { CATEGORY_CAROUSEL } from '../constants/categoryCarousel';
import { categoryImages, CategoryImagePreloader } from '../utils/categoryImages';

const { CARD_WIDTH, CARD_HEIGHT, NAV_BUTTON_SIZE } = CATEGORY_CAROUSEL;

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
    setQuestions,
    createRoom,
    loading: multiplayerLoading,
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
      clearError(); // Errors logged server-side only
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
    
    // Handle Random category - pick one random question immediately and create room
    if (currentCategory.id === 'Random') {
      if (isLoadingRandom || multiplayerLoading) return;
      setIsLoadingRandom(true);
      try {
        const question: GameQuestion = await getRandomQuestion();
        if (!question?.title || !question?.answers?.length) {
          setIsLoadingRandom(false);
          return;
        }
        const toLegacy = (q: GameQuestion): LegacyQuestion => ({
          id: q.id,
          text: q.title,
          answers: q.answers.map(a => a.text),
          category: q.category,
          difficulty: q.difficulty,
        });
        const legacyQuestion = toLegacy(question);
        setCategory(question.category);
        setQuestions([legacyQuestion]);
        const roomCode = await createRoom(question.category, [legacyQuestion]);
        await new Promise(r => setTimeout(r, 500));
        navigation.replace('RoomLobby', { roomCode });
      } catch (error) {
        clearError(); // Errors logged server-side only
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
      <CategoryImagePreloader />

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
        {/* Category Label */}
        <View style={styles.categoryLabelContainer}>
          <Text style={styles.settingLabel}>{t('gameSetup.category')}</Text>
        </View>

        {/* Carousel Container - full width, card centered between visible nav buttons */}
        <View style={styles.carouselWrapper}>
          {/* Left Navigation Button - always takes space so card stays centered */}
          <View style={styles.navButtonContainer}>
            {currentIndex > 0 ? (
              <Animated.View style={{ transform: [{ scale: leftButtonScale }] }}>
                <TouchableOpacity
                  onPress={handlePreviousCategory}
                  style={styles.navButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonChevron}>{isRTL ? '>' : '<'}</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.navButtonPlaceholder} />
            )}
          </View>

          {/* Card container - flex to center card between nav buttons */}
          <View style={styles.categoryCardContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={handleCardPressIn}
              onPressOut={handleCardPressOut}
              disabled={!categoryImages[categories[currentIndex]?.id]}
            >
            <Animated.View
              style={[
                styles.currentCard,
                styles.currentCardDimensions,
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
          </View>

          {/* Right Navigation Button - always takes space so card stays centered */}
          <View style={styles.navButtonContainer}>
            {currentIndex < categories.length - 1 ? (
              <Animated.View style={{ transform: [{ scale: rightButtonScale }] }}>
                <TouchableOpacity
                  onPress={handleNextCategory}
                  style={styles.navButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonChevron}>{isRTL ? '<' : '>'}</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.navButtonPlaceholder} />
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
            style={[styles.continueButton, (isLoadingRandom || multiplayerLoading) && styles.continueButtonDisabled]}
            activeOpacity={0.9}
            disabled={isLoadingRandom || multiplayerLoading}
          >
            <LinearGradient
              colors={categories[currentIndex].id === 'Random' ? ['#059669', '#047857'] : ['#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                {(isLoadingRandom || multiplayerLoading) ? t('gameSetup.loading') : (categories[currentIndex].id === 'Random' ? t('gameSetup.startRandomGame') : t('gameSetup.continue'))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  carouselWrapper: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xl,
    minHeight: CARD_HEIGHT + SPACING.xl * 2,
  },
  categoryCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  navButtonContainer: {
    width: NAV_BUTTON_SIZE,
    minWidth: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    width: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
  },
  navButton: {
    width: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
    borderRadius: NAV_BUTTON_SIZE / 2,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  navButtonChevron: {
    color: COLORS.text,
    fontSize: CATEGORY_CAROUSEL.NAV_CHEVRON_FONT_SIZE,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  currentCard: {
    borderRadius: CATEGORY_CAROUSEL.CARD_BORDER_RADIUS,
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
  currentCardDimensions: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  categoryCardGradient: {
    width: '100%',
    height: '100%',
    padding: SPACING.xl * 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: CATEGORY_CAROUSEL.CARD_BORDER_RADIUS,
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
    borderRadius: CATEGORY_CAROUSEL.CARD_BORDER_RADIUS,
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

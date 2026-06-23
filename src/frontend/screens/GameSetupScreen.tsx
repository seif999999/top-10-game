import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { CategoriesScreenProps } from '../../shared/types/navigation';
import { getQuestionsByCategory } from '../../backend/services/questionsService';
import { TeamSetupConfig, ROUND_TIMER_OPTIONS, TEAM_COLORS } from '../../shared/types/teams';
import CustomQuestionService from '../../backend/services/customQuestionService';
import { getCategories } from '../../backend/services/questionsService';
import { InputValidator } from '../../backend/utils/inputValidator';
import useAppTranslation from '../../hooks/useTranslation';
import HowToPlayHelpButton from '../components/HowToPlayHelpButton';

import { CATEGORY_CAROUSEL } from '../constants/categoryCarousel';
import { categoryImages, CategoryImagePreloader } from '../utils/categoryImages';

const { CARD_WIDTH, CARD_HEIGHT, NAV_BUTTON_SIZE } = CATEGORY_CAROUSEL;

const categories = [
  {
    id: 'Random',
    name: 'Random',
    icon: '🎲',
    translationKey: 'random',
    gradient: ['#059669', '#10B981'],
    questionCount: 0,
    isRandom: true,
  },
  {
    id: 'Sports',
    name: 'Sports',
    icon: '⚽',
    translationKey: 'sports',
    gradient: ['#FF6B6B', '#FF8787'],
    questionCount: 12,
  },
  {
    id: 'Movies',
    name: 'Movies',
    icon: '🎬',
    translationKey: 'movies',
    gradient: ['#4ECDC4', '#44A8A0'],
    questionCount: 15,
  },
  {
    id: 'Music',
    name: 'Music',
    icon: '🎵',
    translationKey: 'music',
    gradient: ['#45B7D1', '#3498DB'],
    questionCount: 14,
  },
  {
    id: 'Science',
    name: 'Science',
    icon: '🔬',
    translationKey: 'science',
    gradient: ['#DDA0DD', '#BA68C8'],
    questionCount: 10,
  },
  {
    id: 'Geography',
    name: 'Geography',
    icon: '🌍',
    translationKey: 'geography',
    gradient: ['#96CEB4', '#74B396'],
    questionCount: 16,
  },
  {
    id: 'Food',
    name: 'Food & Drink',
    icon: '🍕',
    translationKey: 'food',
    gradient: ['#FFB347', '#FF9F00'],
    questionCount: 11,
  },
  {
    id: 'Technology',
    name: 'Technology',
    icon: '💻',
    translationKey: 'technology',
    gradient: ['#87CEEB', '#5DADE2'],
    questionCount: 14,
  },
  {
    id: 'Masry',
    name: 'Masry',
    icon: '🇪🇬',
    translationKey: 'masry',
    gradient: ['#C41E3A', '#000000'],
    questionCount: 20,
  },
  {
    id: 'General Knowledge',
    name: 'General Knowledge',
    icon: '🧠',
    translationKey: 'generalKnowledge',
    gradient: ['#9333EA', '#7C3AED'],
    questionCount: 50,
  },
  {
    id: 'Custom',
    name: 'Create Your Own',
    icon: '✏️',
    translationKey: 'custom',
    gradient: ['#5B21B6', '#7C3AED'],
    questionCount: 0,
  },
];

const GameSetupScreen: React.FC<CategoriesScreenProps> = ({ navigation, route }) => {
  const { gameMode } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});
  const insets = useSafeAreaInsets();
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const { t: tCategories } = useAppTranslation('categories');
  
  // Team and timer settings
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['', '', '', '']); // Up to 4 teams; placeholder shows "Team 1", etc.
  const [roundTimer, setRoundTimer] = useState<number | null>(null);
  const [durationError, setDurationError] = useState<string>('');
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  
  // Refs for scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const timerSectionRef = useRef<View>(null);
  const [timerSectionY, setTimerSectionY] = useState(0);
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const leftButtonScale = useRef(new Animated.Value(1)).current;
  const rightButtonScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0.7)).current;
  const backgroundScale = useRef(new Animated.Value(1)).current;

  // Only apply new design for single player mode
  const isSinglePlayer = gameMode === 'single';

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

  const handleBackToHome = useCallback(() => {
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
  }, [backButtonScale, navigation]);

  const headerStyle = useMemo(
    () => [styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow],
    [insets.top, isRTL]
  );

  const handleNumberOfTeamsChange = (value: number) => {
    const clampedValue = Math.max(1, Math.min(4, value));
    setNumberOfTeams(clampedValue);
    // Ensure we have enough slots; new slots start empty so placeholder shows
    const newTeamNames = [...teamNames];
    for (let i = teamNames.length; i < clampedValue; i++) {
      newTeamNames.push('');
    }
    setTeamNames(newTeamNames);
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  const handleContinue = async () => {
    const currentCategory = categories[currentIndex];
    logger.log('🎯 Continue pressed with category:', currentCategory.name);
    
    // Validate turn duration is selected
    if (roundTimer === null) {
      setDurationError(tScreens('screens:gameSetup.selectDuration'));
      // Scroll to timer section - scroll lower to show the buttons themselves
      setTimeout(() => {
        if (timerSectionY > 0) {
          // Scroll to show the buttons, not just the label (add offset to go lower)
          scrollViewRef.current?.scrollTo({ y: timerSectionY + 50, animated: true });
        } else {
          // Fallback: scroll to a calculated position (approximately where timer buttons are)
          scrollViewRef.current?.scrollTo({ y: 700, animated: true });
        }
      }, 100);
      return;
    }
    
    // Clear error if validation passes
    setDurationError('');
    
    // Handle Random category - pick random category and question, go directly to game
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
        
        // Get questions from that category
        const questions = await getQuestionsByCategory(randomCategory);
        
        if (questions.length === 0) {
          setIsLoadingRandom(false);
          return;
        }
        
        // Pick a random question
        const randomQuestionIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomQuestionIndex];
        
        // Build team config; sanitize and use placeholder when user left field empty
        const resolvedNames = teamNames.slice(0, numberOfTeams).map((name, i) => {
          const trimmed = (name || '').trim();
          const sanitized = trimmed ? InputValidator.sanitizeText(trimmed, 30) : '';
          return sanitized || tScreens('screens:gameSetup.teamPlaceholder', { number: i + 1 });
        });
        const teamConfig: TeamSetupConfig = numberOfTeams > 1 ? {
          numberOfTeams,
          teamNames: resolvedNames,
          roundTimer: roundTimer!,
          maxRounds: undefined,
          isHostedLocal: true,
        } : {
          numberOfTeams: 1,
          teamNames: ['Player'],
          roundTimer: roundTimer!,
          maxRounds: undefined,
          isHostedLocal: true,
        };
        
        // Navigate directly to game screen
        navigation.navigate('GameScreen', {
          roomId: 'single-player',
          categoryId: randomCategory,
          categoryName: randomCategory,
          selectedQuestion: randomQuestion,
          isMultiplayer: false,
          teamConfig: teamConfig
        });
      } catch (error) {
        logger.error('Error loading random game:', error);
      } finally {
        setIsLoadingRandom(false);
      }
      return;
    }
    
    // Use category id for Custom category (questionsService expects 'Custom')
    const categoryNameForNav = currentCategory.id === 'Custom' ? 'Custom' : currentCategory.name;
    
    // If teams mode is enabled (numberOfTeams > 1), create team config
    if (numberOfTeams > 1) {
      // Sanitize team names; use placeholder when user left field empty
      const validTeamNames = teamNames.slice(0, numberOfTeams).map((name, i) => {
        const trimmed = (name || '').trim();
        const sanitized = trimmed ? InputValidator.sanitizeText(trimmed, 30) : '';
        return sanitized || tScreens('screens:gameSetup.teamPlaceholder', { number: i + 1 });
      });

      const teamConfig: TeamSetupConfig = {
        numberOfTeams,
        teamNames: validTeamNames,
        roundTimer: roundTimer!,
        maxRounds: undefined,
        isHostedLocal: true,
      };

      // Navigate directly to GameScreen with team config (skip question selection for now)
      // Or navigate to QuestionSelection with teamConfig param
      navigation.navigate('QuestionSelection', {
        categoryName: categoryNameForNav,
        gameMode: gameMode,
        teamConfig: teamConfig
      });
    } else {
      // Single player mode - no teams, but still need timer
      navigation.navigate('QuestionSelection', {
        categoryName: categoryNameForNav,
        gameMode: gameMode,
        teamConfig: {
          numberOfTeams: 1,
          teamNames: ['Player'],
          roundTimer: roundTimer!,
          maxRounds: undefined,
          isHostedLocal: true,
        }
      });
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

  // For single player mode, use new carousel design
  if (isSinglePlayer) {
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
        <View style={headerStyle}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <Text style={styles.backButtonArrow}>{isRTL ? '→' : '←'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{tScreens('screens:gameSetup.title')}</Text>
          </View>
          <HowToPlayHelpButton mode="singlePlayer" />
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Scroll hint - single player only; multiplayer has minimal content */}
          {isSinglePlayer && (
            <Text style={styles.scrollDownHint}>{tScreens('screens:gameSetup.scrollDown')}</Text>
          )}
          {/* Category Label */}
          <View style={styles.categoryLabelContainer}>
            <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>{tScreens('screens:gameSetup.category')}</Text>
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
                      <Text style={styles.egyptCategoryName}>{(tCategories as (key: string) => string)(currentCategory.translationKey)}</Text>
                      <Text style={styles.egyptCategoryDescription}>{(tCategories as (key: string) => string)(`descriptions.${currentCategory.translationKey}`)}</Text>
                    </View>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.egyptQuestionCountText}>
                        {tScreens('screens:gameSetup.questionsCount', { count: questionCounts[currentCategory.name] || currentCategory.questionCount })}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Custom category with gradient (no image)
                <LinearGradient
                  colors={currentCategory.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryCardGradient}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardContentInner}>
                      <Text style={styles.categoryIcon}>{currentCategory.icon}</Text>
                      <Text style={styles.categoryName}>{(tCategories as (key: string) => string)(currentCategory.translationKey)}</Text>
                      <Text style={styles.categoryDescription}>{(tCategories as (key: string) => string)(`descriptions.${currentCategory.translationKey}`)}</Text>
                    </View>
                    <View style={styles.questionCountBadge}>
                      <Text style={styles.questionCountText}>
                        {tScreens('screens:gameSetup.questionsCount', { count: questionCounts[currentCategory.name] || currentCategory.questionCount })}
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

          {/* Game Settings Section */}
          <View style={styles.settingsSection}>
            {/* Number of Teams */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>{tScreens('screens:gameSetup.numberOfTeams')}</Text>
              <View style={styles.teamCountContainer}>
                {[2, 3, 4].map((count) => (
                  <TouchableOpacity
                    key={count}
                    onPress={() => handleNumberOfTeamsChange(count)}
                    style={[
                      styles.teamCountButton,
                      numberOfTeams === count && styles.teamCountButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.teamCountButtonText,
                      numberOfTeams === count && styles.teamCountButtonTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Team Names (show for all teams, including single team) */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>{tScreens('screens:gameSetup.teamNames')}</Text>
              <View style={styles.teamNamesContainer}>
                {teamNames.slice(0, numberOfTeams).map((name, index) => (
                  <View key={index} style={styles.teamNameRow}>
                    <View
                      style={[
                        styles.teamColorIndicator,
                        { backgroundColor: TEAM_COLORS[index] },
                      ]}
                    />
                    <TextInput
                      style={[styles.teamNameInput, isRTL && styles.rtlText]}
                      value={name}
                      onChangeText={(text) => handleTeamNameChange(index, text)}
                      placeholder={tScreens('screens:gameSetup.teamPlaceholder', { number: index + 1 })}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Turn Duration */}
            <View 
              style={styles.settingRow} 
              ref={timerSectionRef}
              onLayout={(event) => {
                const { y } = event.nativeEvent.layout;
                setTimerSectionY(y);
              }}
            >
              <Text style={[styles.settingLabel, isRTL && styles.rtlText]}>{tScreens('screens:gameSetup.turnDuration')}</Text>
              {durationError ? (
                <Text style={styles.errorText}>{durationError}</Text>
              ) : null}
              <View style={styles.timerContainer}>
                {ROUND_TIMER_OPTIONS.map((timer) => (
                  <TouchableOpacity
                    key={timer}
                    onPress={() => {
                      setRoundTimer(timer);
                      setDurationError(''); // Clear error when user selects
                    }}
                    style={[
                      styles.timerButton,
                      roundTimer === timer && styles.timerButtonActive,
                      durationError ? styles.timerButtonError : null
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

          {/* Continue Button - Inside ScrollView so it stays in content flow, no keyboard shift */}
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
                  {isLoadingRandom ? tScreens('screens:gameSetup.loading') : (categories[currentIndex].id === 'Random' ? tScreens('screens:gameSetup.startRandomGame') : tScreens('screens:gameSetup.continue'))}
                </Text>
                <Text style={styles.continueButtonArrow}>
                  {categories[currentIndex].id === 'Random' ? '🎲' : (isRTL ? '←' : '→')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
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
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
            <Text style={styles.backButtonArrow}>{isRTL ? '→' : '←'}</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{tScreens('screens:gameSetup.categoriesTitle')}</Text>
        </View>
        <HowToPlayHelpButton mode="multiplayer" />
      </View>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderText}>{tScreens('screens:gameSetup.multiplayerCategorySelection')}</Text>
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
  keyboardAvoidingWrapper: {
    flex: 1,
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
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.text,
    fontSize: 16,
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
  teamCountContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  teamCountButton: {
    width: 60,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCountButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  teamCountButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  teamCountButtonTextActive: {
    color: '#FFFFFF',
  },
  teamNamesContainer: {
    gap: SPACING.sm,
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  teamColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  teamNameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 48,
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
  timerButtonError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default GameSetupScreen;

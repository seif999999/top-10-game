import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  TextInput,
  ScrollView
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

const { width } = Dimensions.get('window');

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
  {
    id: 'Masry',
    name: 'Masry',
    icon: '🇪🇬',
    description: 'Egyptian culture, food, movies, music, and more',
    gradient: ['#C41E3A', '#000000'],
    questionCount: 20,
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

const GameSetupScreen: React.FC<CategoriesScreenProps> = ({ navigation, route }) => {
  const { gameMode } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionCounts, setQuestionCounts] = useState<{ [key: string]: number }>({});
  const insets = useSafeAreaInsets();
  
  // Team and timer settings
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4']);
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

  const handleNumberOfTeamsChange = (value: number) => {
    const clampedValue = Math.max(1, Math.min(4, value));
    setNumberOfTeams(clampedValue);
    // Ensure we have enough team names
    const newTeamNames = [...teamNames];
    for (let i = teamNames.length; i < clampedValue; i++) {
      newTeamNames.push(`Team ${i + 1}`);
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
      setDurationError('Please select a turn duration');
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
        
        // Build team config
        const teamConfig: TeamSetupConfig = numberOfTeams > 1 ? {
          numberOfTeams,
          teamNames: teamNames.slice(0, numberOfTeams).filter(name => name.trim() !== ''),
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
      const validTeamNames = teamNames.slice(0, numberOfTeams).filter(name => name.trim() !== '');
      if (validTeamNames.length !== numberOfTeams) {
        logger.error('❌ Invalid team names');
        return;
      }

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
        <View style={[styles.header, { paddingTop: insets.top * 0.5 }]}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <Text style={styles.backButtonArrow}>←</Text>
            </TouchableOpacity>
          </Animated.View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Game Setup</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Label */}
          <View style={styles.categoryLabelContainer}>
            <Text style={styles.settingLabel}>Category</Text>
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

          {/* Game Settings Section */}
          <View style={styles.settingsSection}>
            {/* Number of Teams */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Number of Teams</Text>
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
              <Text style={styles.settingLabel}>Team Names</Text>
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
                      style={styles.teamNameInput}
                      value={name}
                      onChangeText={(text) => handleTeamNameChange(index, text)}
                      placeholder={`Team ${index + 1}`}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
              <Text style={styles.settingLabel}>Turn Duration</Text>
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
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.continueButtonContainer, { paddingBottom: insets.bottom + SPACING.md }]}>
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
                {isLoadingRandom ? 'Loading...' : (categories[currentIndex].id === 'Random' ? 'Start Random Game' : 'Continue')}
              </Text>
              <Text style={styles.continueButtonArrow}>
                {categories[currentIndex].id === 'Random' ? '🎲' : '→'}
              </Text>
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
    borderTopWidth: 0.5,
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
});

export default GameSetupScreen;

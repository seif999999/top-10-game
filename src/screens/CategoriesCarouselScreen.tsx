import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  FlatList,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../design-system';
import { RESPONSIVE } from '../utils/responsive';
import { logger } from '../utils/logger';
import { CategoriesScreenProps } from '../types/navigation';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.98, RESPONSIVE.width.maxMd);
const CARD_SPACING = 16;

const categories = [
  {
    id: 'Sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Athletics, games, and competitions',
    color: '#FF6B6B',
    questions: 10
  },
  {
    id: 'Movies',
    name: 'Movies & TV',
    icon: '🎬',
    description: 'Films, television, and entertainment',
    color: '#4ECDC4',
    questions: 10
  },
  {
    id: 'Music',
    name: 'Music',
    icon: '🎵',
    description: 'Songs, artists, and musical genres',
    color: '#45B7D1',
    questions: 10
  },
  {
    id: 'Geography',
    name: 'Geography',
    icon: '🌍',
    description: 'Countries, cities, and landmarks',
    color: '#96CEB4',
    questions: 10
  },
  {
    id: 'History',
    name: 'History',
    icon: '📚',
    description: 'Historical events and figures',
    color: '#FFEAA7',
    questions: 10
  },
  {
    id: 'Science',
    name: 'Science',
    icon: '🔬',
    description: 'Scientific discoveries and facts',
    color: '#DDA0DD',
    questions: 10
  },
  {
    id: 'Food',
    name: 'Food & Drink',
    icon: '🍕',
    description: 'Cuisines, dishes, and beverages',
    color: '#FFB347',
    questions: 10
  },
  {
    id: 'Technology',
    name: 'Technology',
    icon: '💻',
    description: 'Computers, gadgets, and innovation',
    color: '#87CEEB',
    questions: 10
  }
];

const CategoriesCarouselScreen: React.FC<CategoriesScreenProps> = ({ navigation, route }) => {
  const { gameMode } = route.params;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const handleBackToHome = () => {
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
    
    navigation.goBack();
  };

  const handleCategoryPress = (category: typeof categories[0]) => {
    setSelectedCategory(category.id);
    
    logger.log('🎯 Category pressed:', category.name);
    logger.log('🎯 Game mode:', gameMode);
    
    if (gameMode === 'multiplayer') {
      // For multiplayer, navigate to MultiplayerRoom with the selected category
      logger.log('🎯 Navigating to MultiplayerRoom with category:', category.name);
      
      navigation.navigate('CreateRoom' as never);
    } else {
      // For single player, continue to QuestionSelection
      logger.log('🎯 Navigating to QuestionSelection with params:', {
        categoryName: category.name
      });
      
      navigation.navigate('QuestionSelection', {
        categoryName: category.name,
        gameMode: gameMode
      });
    }
  };

  const renderCategoryCard = ({ item, index }: { item: typeof categories[0]; index: number }) => {
    const isSelected = selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { 
            backgroundColor: item.color,
            borderWidth: isSelected ? 3 : 0,
            borderColor: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
          }
        ]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
          <View style={styles.questionCount}>
            <Text style={styles.questionCountText}>{item.questions} Questions</Text>
          </View>
        </View>
        
        {/* Play Button */}
        <View style={styles.playButton}>
          <Text style={styles.playButtonText}>
            {gameMode === 'single' ? '🎯 Select' : '🎯 Select'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
            <View style={styles.backButtonIcon}>
              <Text style={styles.backButtonArrow}>‹</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Categories Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
          bounces={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Swipe to browse categories • Tap to start playing
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
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
    fontWeight: 'bold' as const,
    lineHeight: 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 0,
    alignItems: 'center',
    paddingTop: 0,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: Math.min(height * 0.6, RESPONSIVE.height.card + 20),
    borderRadius: 28,
    padding: SPACING.xl + SPACING.md,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 72,
    marginBottom: SPACING.lg + SPACING.sm,
  },
  categoryName: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: SPACING.md + SPACING.sm,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.lg + SPACING.sm,
  },
  questionCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 24,
  },
  questionCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl + SPACING.sm,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  instructions: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export default CategoriesCarouselScreen;

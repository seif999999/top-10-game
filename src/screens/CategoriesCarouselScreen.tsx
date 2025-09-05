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
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../utils/constants';
import { CategoriesScreenProps } from '../types/navigation';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = 20;

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
    
    console.log('🎯 Category pressed:', category.name);
    console.log('🎯 Game mode:', gameMode);
    
    if (gameMode === 'multiplayer') {
      // For multiplayer, navigate to MultiplayerRoom with the selected category
      console.log('🎯 Navigating to MultiplayerRoom with category:', category.name);
      
      navigation.navigate('CreateRoom' as never);
    } else {
      // For single player, continue to QuestionSelection
      console.log('🎯 Navigating to QuestionSelection with params:', {
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
            transform: [{ scale: isSelected ? 1.05 : 1 }]
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
            <View style={styles.backButtonIcon}>
              <Text style={styles.backButtonArrow}>‹</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Category</Text>
          <Text style={styles.headerSubtitle}>
            {gameMode === 'single' ? 'Single Player' : 'Multiplayer'} Mode
          </Text>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: SPACING.sm,
    top: SPACING.md,
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
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: height * 0.6,
    borderRadius: 24,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  categoryName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  questionCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  questionCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  instructions: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export default CategoriesCarouselScreen;

import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  FlatList
} from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
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

  const handleCategoryPress = (category: typeof categories[0]) => {
    setSelectedCategory(category.id);
    
    console.log('🎯 Category pressed:', category.name);
    console.log('🎯 Game mode:', gameMode);
    
    if (gameMode === 'multiplayer') {
      // This shouldn't happen anymore with the new Sporcle flow
      // Categories are now selected inline in the MultiplayerRoomScreen
      console.warn('🚨 Unexpected multiplayer navigation to Categories screen');
      navigation.goBack();
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
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
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

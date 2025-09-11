import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Dimensions
} from 'react-native';
import { COLORS, SPACING } from '../design-system';
import { RESPONSIVE } from '../utils/responsive';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.8, RESPONSIVE.width.maxMd);
const CARD_SPACING = 20;

/**
 * Represents a category item in the carousel
 */
export interface Category {
  /** Unique identifier for the category */
  id: string;
  /** Display name of the category */
  name: string;
  /** Emoji icon for the category */
  icon: string;
  /** Description text shown on the card */
  description: string;
  /** Background color for the category card */
  color: string;
  /** Number of questions available in this category */
  questions: number;
}

/**
 * Props for the CategoryCarousel component
 */
export interface CategoryCarouselProps {
  /** Array of category objects to display in the carousel */
  categories: Category[];
  /** Currently selected category ID */
  selectedCategory?: string | null;
  /** Callback function called when a category is selected */
  onCategorySelect: (category: Category) => void;
  /** Whether to show instructions text below the carousel */
  showInstructions?: boolean;
  /** Custom text for instructions */
  instructionsText?: string;
  /** Width of each category card */
  cardWidth?: number;
  /** Height of each category card */
  cardHeight?: number;
  /** Whether to show question count on each card */
  showQuestionCount?: boolean;
  /** Text for the select button */
  buttonText?: string;
  /** Additional styles for the container */
  style?: any;
  /** Additional styles for the FlatList content container */
  contentContainerStyle?: any;
}

/**
 * A reusable horizontal carousel component for displaying categories
 * 
 * Features:
 * - Horizontal scrolling with snap-to-interval behavior
 * - Visual selection feedback with scaling and border effects
 * - Configurable card dimensions and styling
 * - Optional instructions text
 * - Accessibility support
 * 
 * @param props - CategoryCarouselProps
 * @returns JSX.Element
 */
const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  showInstructions = true,
  instructionsText = "Swipe to browse categories • Tap to select",
  cardWidth = CARD_WIDTH,
  cardHeight = height * 0.6,
  showQuestionCount = true,
  buttonText = "🎯 Select",
  style,
  contentContainerStyle
}) => {
  const flatListRef = useRef<FlatList>(null);

  const renderCategoryCard = ({ item, index }: { item: Category; index: number }) => {
    const isSelected = selectedCategory === item.id;
    
    const handlePress = () => {
      onCategorySelect(item);
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { 
            backgroundColor: item.color,
            width: cardWidth,
            height: cardHeight,
            borderWidth: isSelected ? 3 : 0,
            borderColor: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel={`Select ${item.name} category`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.cardContent}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
          {showQuestionCount && (
            <View style={styles.questionCount}>
              <Text style={styles.questionCountText}>{item.questions} Questions</Text>
            </View>
          )}
        </View>
        
        {/* Select Button */}
        <View style={styles.selectButton}>
          <Text style={styles.selectButtonText}>{buttonText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Categories Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={[styles.carouselContent, contentContainerStyle]}
          ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
          bounces={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
        />
      </View>

      {/* Instructions */}
      {showInstructions && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            {instructionsText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  categoryCard: {
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
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
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

export default CategoryCarousel;

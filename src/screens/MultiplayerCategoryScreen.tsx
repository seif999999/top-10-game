import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../design-system';
import { RESPONSIVE } from '../utils/responsive';
import { sampleQuestions } from '../data/sampleQuestions';
import CategoryCarousel, { Category } from '../components/CategoryCarousel';

interface MultiplayerCategoryScreenProps {}

const MultiplayerCategoryScreen: React.FC<MultiplayerCategoryScreenProps> = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { 
    selectedCategory, 
    setCategory, 
    loading, 
    error,
    clearError,
    leaveRoom,
    resetAll,
    cleanup
  } = useMultiplayer();

  // Get unique categories from sample questions
  const availableCategories = [...new Set(sampleQuestions.map(q => q.category))];
  
  // Get categories dynamically from sample questions
  const categories: Category[] = availableCategories.map(categoryName => {
    const iconMap: { [key: string]: string } = {
      'Sports': '⚽',
      'Movies': '🎬',
      'Music': '🎵',
      'Science': '🔬',
      'History': '📚',
      'Geography': '🌍',
      'Movies & TV': '📺',
      'Food & Drink': '🍕',
      'Technology': '💻'
    };
    
    const colorMap: { [key: string]: string } = {
      'Sports': '#FF6B6B',
      'Movies': '#4ECDC4',
      'Music': '#45B7D1',
      'Science': '#DDA0DD',
      'History': '#FFEAA7',
      'Geography': '#96CEB4',
      'Movies & TV': '#4ECDC4',
      'Food & Drink': '#FFB347',
      'Technology': '#87CEEB'
    };
    
    const descriptionMap: { [key: string]: string } = {
      'Sports': 'Athletics, games, and competitions',
      'Movies': 'Films, television, and entertainment',
      'Music': 'Songs, artists, and musical genres',
      'Science': 'Scientific discoveries and facts',
      'History': 'Historical events and figures',
      'Geography': 'Countries, cities, and landmarks',
      'Movies & TV': 'Films, television, and entertainment',
      'Food & Drink': 'Cuisines, dishes, and beverages',
      'Technology': 'Computers, gadgets, and innovation'
    };
    
    // Count questions for this category
    const questionCount = sampleQuestions.filter(q => q.category === categoryName).length;
    
    return {
      id: categoryName,
      name: categoryName,
      icon: iconMap[categoryName] || '❓',
      description: descriptionMap[categoryName] || 'General knowledge questions',
      color: colorMap[categoryName] || '#8B5CF6',
      questions: questionCount
    };
  });

  useEffect(() => {
    if (error) {
      console.error('Multiplayer error:', error);
      clearError();
    }
  }, [error, clearError]);

  const handleCategorySelect = (category: Category) => {
    setCategory(category.id);
    // Navigate to questions screen
    (navigation as any).navigate('MultiplayerQuestions', { 
      categoryName: category.id 
    });
  };

  const handleBackToMenu = async () => {
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
      console.error('Error leaving room:', error);
      // Even if there's an error, still clean up and go back
      resetAll();
      cleanup();
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: SPACING.md }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToMenu}
          accessibilityLabel="Back to multiplayer menu"
          accessibilityRole="button"
          accessibilityHint="Returns to the multiplayer menu screen"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Category</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Category</Text>
          <Text style={styles.sectionSubtitle}>
            Choose the category for your multiplayer game
          </Text>
          <View style={styles.carouselContainer}>
            <CategoryCarousel
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              showInstructions={true}
              instructionsText="Swipe to browse categories • Tap to select"
              cardWidth={RESPONSIVE.width.maxMd}
              cardHeight={RESPONSIVE.height.card}
              showQuestionCount={true}
              buttonText="🎯 Select"
              accessibilityLabel="Category selection carousel"
              accessibilityHint="Swipe left or right to browse categories, then tap to select one"
            />
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  placeholder: {
    width: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.md,
  },
  carouselContainer: {
    height: RESPONSIVE.height.card,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
});

export default MultiplayerCategoryScreen;

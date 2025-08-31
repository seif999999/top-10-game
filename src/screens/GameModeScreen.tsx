import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { GameModeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const GameModeScreen: React.FC<GameModeScreenProps> = ({ navigation, route }) => {
  const { categoryId, categoryName, selectedQuestion } = route.params;
  const { user } = useAuth();

  console.log('🎮 GameModeScreen loaded with params:', route.params);

  const handleSinglePlayer = () => {
    console.log('🎮 Single player button pressed!');
    // Navigate to single-player game
    navigation.navigate('GameScreen', {
      roomId: 'single-player',
      categoryId: categoryName, // Use categoryName instead of categoryId for single-player
      categoryName,
      selectedQuestion
    });
  };

  const handleMultiplayer = () => {
    console.log('🎮 Multiplayer button pressed!');
    // Generate a unique room ID for multiplayer
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🎮 Navigating to multiplayer game with roomId:', roomId);
    // Navigate to multiplayer game
    navigation.navigate('GameScreen', {
      roomId,
      categoryId: categoryName, // Use categoryName instead of categoryId for multiplayer
      categoryName,
      selectedQuestion,
      isMultiplayer: true
    });
  };

  const handleBackToCategories = () => {
    navigation.navigate('Categories');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Game Mode</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            {selectedQuestion ? 'Custom Question' : 'Random Questions'}
          </Text>
        </View>

        <View style={styles.modeOptions}>
          {/* Single Player Option */}
          <TouchableOpacity style={styles.modeCard} onPress={handleSinglePlayer}>
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>🎮</Text>
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Single Player</Text>
              <Text style={styles.modeDescription}>
                Play alone and challenge yourself to find all the top answers!
              </Text>
              <View style={styles.modeFeatures}>
                <Text style={styles.feature}>• Play at your own pace</Text>
                <Text style={styles.feature}>• No internet required</Text>
                <Text style={styles.feature}>• Practice and improve</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Multiplayer Option */}
          <TouchableOpacity style={styles.modeCard} onPress={handleMultiplayer}>
            <View style={[styles.modeIcon, styles.multiplayerIcon]}>
              <Text style={styles.modeIconText}>👥</Text>
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Multiplayer</Text>
              <Text style={styles.modeDescription}>
                Compete with friends in real-time and see who gets the highest score!
              </Text>
              <View style={styles.modeFeatures}>
                <Text style={styles.feature}>• Real-time competition</Text>
                <Text style={styles.feature}>• Live leaderboard</Text>
                <Text style={styles.feature}>• Internet connection required</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How to Play</Text>
          <Text style={styles.infoText}>
            • Read the question carefully{'\n'}
            • Type your answers and submit{'\n'}
            • The closer you are to #1, the more points you get{'\n'}
            • Find all 10 correct answers to complete each question
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  backButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.card
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700'
  },
  placeholder: {
    width: 60
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  categoryInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 16
  },
  modeOptions: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl
  },
  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg
  },
  multiplayerIcon: {
    backgroundColor: '#8B5CF6'
  },
  modeIconText: {
    fontSize: 24
  },
  modeContent: {
    flex: 1
  },
  modeTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.sm
  },
  modeDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md
  },
  modeFeatures: {
    gap: SPACING.xs
  },
  feature: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 16
  },
  infoSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md
  },
  infoText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20
  }
});

export default GameModeScreen;

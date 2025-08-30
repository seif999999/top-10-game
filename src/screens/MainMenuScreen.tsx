import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { MainMenuScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ navigation }) => {
  const handleSinglePlayer = () => {
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  const handleMultiplayer = () => {
    navigation.navigate('Categories', { gameMode: 'multiplayer' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TOP 10</Text>
          <Text style={styles.subtitle}>Trivia Challenge</Text>
        </View>

        {/* Game Mode Selection */}
        <View style={styles.modeSelection}>
          <Text style={styles.modeTitle}>Choose Your Game Mode</Text>
          
          {/* Single Player Card */}
          <TouchableOpacity style={styles.modeCard} onPress={handleSinglePlayer}>
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>🎮</Text>
            </View>
            <Text style={styles.modeName}>Single Player</Text>
            <Text style={styles.modeDescription}>
              Play solo and challenge yourself to find all the top answers
            </Text>
          </TouchableOpacity>

          {/* Multiplayer Card */}
          <TouchableOpacity style={styles.modeCard} onPress={handleMultiplayer}>
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>👥</Text>
            </View>
            <Text style={styles.modeName}>Multiplayer</Text>
            <Text style={styles.modeDescription}>
              Compete with friends in real-time multiplayer matches
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Test your knowledge with the most popular trivia game!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xl * 2,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.muted,
    fontWeight: '500',
  },
  modeSelection: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  modeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modeIconText: {
    fontSize: 36,
  },
  modeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modeDescription: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

export default MainMenuScreen;

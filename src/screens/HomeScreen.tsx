import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import AvatarIcon from '../components/AvatarIcon';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleProfileNavigation = () => {
    navigation.navigate('Profile');
  };

  const handleSinglePlayer = () => {
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  const handleMultiplayer = () => {
    navigation.navigate('MultiplayerMenu');
  };



  const handleHowToPlay = () => {
    Alert.alert(
      '❓ How to Play',
      '🎯 OBJECTIVE: Guess the top 10 answers to each question\n\n🏆 SCORING: The closer your answer is to position 10, the more points you get\n\n✍️ SUBMIT: Type your answer and submit - you can only submit one answer in your turn\n\n🎮 PROGRESS: Find all 10 correct answers to complete each question\n\n🏁 WIN: Player with the most points wins!',
      [{ text: 'Got it! 🎮' }]
    );
  };

  const handleCreateYourOwn = () => {
    navigation.navigate('CreateCustomQuestion');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Profile and Rules Buttons */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <AvatarIcon 
            user={user} 
            size={48} 
            showBorder={false}
            backgroundColor={COLORS.primary}
            textColor={COLORS.background}
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleHowToPlay} style={styles.rulesButton}>
          <Text style={styles.rulesButtonText}>❓</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoTop}>TOP</Text>
            <Text style={styles.logoNumber}>10</Text>
          </View>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.displayName || 'Player'} 👋
          </Text>
          <Text style={styles.heroSubtitle}>Test your knowledge and compete for the top spot!</Text>
        </View>

        {/* Game Mode Buttons */}
        <View style={styles.gameModeSection}>
          <TouchableOpacity style={styles.singlePlayerCard} onPress={handleSinglePlayer}>
            <View style={styles.gameModeContent}>
              <Text style={styles.gameModeIcon}>🎯</Text>
              <View style={styles.gameModeText}>
                <Text style={styles.gameModeTitle}>Single Player</Text>
                <Text style={styles.gameModeSubtitle}>Play with friends offline and be the host</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.multiplayerCard} onPress={handleMultiplayer}>
            <View style={styles.gameModeContent}>
              <Text style={styles.gameModeIcon}>👥</Text>
              <View style={styles.gameModeText}>
                <Text style={styles.gameModeTitle}>Multiplayer</Text>
                <Text style={styles.gameModeSubtitle}>Create and join rooms using the code</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.singleSecondaryCard} onPress={handleCreateYourOwn}>
            <View style={styles.secondaryActionContent}>
              <Text style={styles.secondaryActionIcon}>✏️</Text>
              <View style={styles.secondaryActionText}>
                <Text style={styles.secondaryActionTitle}>Create Your Own</Text>
                <Text style={styles.secondaryActionSubtitle}>Create your own questions with your own answers</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  rulesButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rulesButtonText: {
    fontSize: 22,
  },
  mainContent: {
    flex: 1,
    paddingTop: 100, // Space for header
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoTop: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: -6,
  },
  logoNumber: {
    color: COLORS.text,
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  welcomeText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.8,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: width * 0.8,
  },
  gameModeSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  singlePlayerCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  multiplayerCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gameModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameModeIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  gameModeText: {
    flex: 1,
  },
  gameModeTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  gameModeSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  singleSecondaryCard: {
    backgroundColor: '#5B21B6',
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#4C1D95',
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  secondaryActionText: {
    flex: 1,
  },
  secondaryActionIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  secondaryActionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  secondaryActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;



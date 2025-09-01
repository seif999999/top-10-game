import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);

  const handleProfileNavigation = () => {
    navigation.navigate('Profile');
  };

  const handleStartPlaying = () => {
    navigation.navigate('MainMenu');
  };

  const handleLeaderboard = () => {
    Alert.alert('Leaderboard', 'Global leaderboard will be available soon!');
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Simulate spinning animation
    setTimeout(() => {
      setIsSpinning(false);
      const categories = ['Sports', 'Movies & TV', 'Music', 'History', 'Science', 'Geography'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      Alert.alert(
        '🎯 Random Category Selected!',
        `You got: ${randomCategory}\n\nWould you like to play this category?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Play Now', 
            onPress: () => {
              // Navigate to game with random category
              navigation.navigate('Categories', { gameMode: 'single' });
            }
          }
        ]
      );
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Profile Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTop}>TOP</Text>
          <Text style={styles.logoNumber}>10</Text>
        </View>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Player'}!
        </Text>
        <Text style={styles.heroSubtitle}>Test your knowledge and compete for the top spot!</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.startPlayingCard} onPress={handleStartPlaying}>
            <Text style={styles.startPlayingIcon}>🎮</Text>
            <Text style={styles.startPlayingTitle}>Start Playing</Text>
            <Text style={styles.startPlayingSubtitle}>Choose Game Mode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.leaderboardCard} onPress={handleLeaderboard}>
            <Text style={styles.leaderboardIcon}>🏆</Text>
            <Text style={styles.leaderboardTitle}>Leaderboard</Text>
            <Text style={styles.leaderboardSubtitle}>Global Rankings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spin Wheel Section */}
      <View style={styles.spinWheelSection}>
        <TouchableOpacity 
          style={[styles.spinWheelCard, isSpinning && styles.spinning]} 
          onPress={handleSpinWheel}
          disabled={isSpinning}
        >
          <View style={styles.spinWheelContent}>
            <Text style={[styles.spinWheelIcon, isSpinning && styles.spinningIcon]}>🎡</Text>
            <View style={styles.spinWheelText}>
              <Text style={styles.spinWheelTitle}>{isSpinning ? 'Spinning...' : 'Spin the Wheel'}</Text>
              <Text style={styles.spinWheelSubtitle}>Get a random category to play!</Text>
            </View>
          </View>
        </TouchableOpacity>
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
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    zIndex: 1,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profileButtonText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: '700',
  },
  welcomeText: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
    marginBottom: SPACING.lg,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoTop: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: -8,
  },
  logoNumber: {
    color: COLORS.text,
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
  },
  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  startPlayingCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startPlayingIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  startPlayingTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  startPlayingSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  leaderboardCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leaderboardIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  leaderboardTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  leaderboardSubtitle: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  spinWheelSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  spinWheelCard: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  spinning: {
    opacity: 0.8,
  },
  spinWheelContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinWheelIcon: {
    fontSize: 48,
    marginRight: SPACING.lg,
  },
  spinningIcon: {
    transform: [{ rotate: '360deg' }],
  },
  spinWheelText: {
    flex: 1,
  },
  spinWheelTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  spinWheelSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default HomeScreen;



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
  const [isSpinning, setIsSpinning] = useState(false);
  const insets = useSafeAreaInsets();

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

        {/* Primary Action - Start Playing */}
        <View style={styles.primaryActionSection}>
          <TouchableOpacity style={styles.primaryActionCard} onPress={handleStartPlaying}>
            <View style={styles.primaryActionContent}>
              <Text style={styles.primaryActionIcon}>🎮</Text>
              <View style={styles.primaryActionText}>
                <Text style={styles.primaryActionTitle}>Start Playing</Text>
                <Text style={styles.primaryActionSubtitle}>Choose your game mode and category</Text>
              </View>
              <Text style={styles.primaryActionArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions Grid */}
        <View style={styles.secondaryActionsSection}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryActionCard} onPress={handleCreateYourOwn}>
              <Text style={styles.secondaryActionIcon}>✏️</Text>
              <Text style={styles.secondaryActionTitle}>Create Your Own</Text>
              <Text style={styles.secondaryActionSubtitle}>Custom Questions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionCard} onPress={handleLeaderboard}>
              <Text style={styles.secondaryActionIcon}>🏆</Text>
              <Text style={styles.secondaryActionTitle}>Leaderboard</Text>
              <Text style={styles.secondaryActionSubtitle}>Global Rankings</Text>
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
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#374151',
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
  primaryActionSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  primaryActionCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionIcon: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  primaryActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryActionArrow: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  secondaryActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  secondaryActionCard: {
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
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  secondaryActionIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  secondaryActionTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  secondaryActionSubtitle: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  spinWheelSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
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
    fontSize: 40,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  spinWheelSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default HomeScreen;



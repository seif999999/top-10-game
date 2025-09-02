import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Alert, Animated } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Animation values for floating elements
  const floatingAnim1 = useRef(new Animated.Value(0)).current;
  const floatingAnim2 = useRef(new Animated.Value(0)).current;
  const floatingAnim3 = useRef(new Animated.Value(0)).current;
  const floatingAnim4 = useRef(new Animated.Value(0)).current;
  const floatingAnim5 = useRef(new Animated.Value(0)).current;
  const floatingAnim6 = useRef(new Animated.Value(0)).current;
  const floatingAnim7 = useRef(new Animated.Value(0)).current;
  const floatingAnim8 = useRef(new Animated.Value(0)).current;
  const floatingAnim9 = useRef(new Animated.Value(0)).current;
  const floatingAnim10 = useRef(new Animated.Value(0)).current;
  const floatingAnim11 = useRef(new Animated.Value(0)).current;
  const floatingAnim12 = useRef(new Animated.Value(0)).current;
  const floatingAnim13 = useRef(new Animated.Value(0)).current;
  const floatingAnim14 = useRef(new Animated.Value(0)).current;
  const floatingAnim15 = useRef(new Animated.Value(0)).current;
  const floatingAnim16 = useRef(new Animated.Value(0)).current;
  const floatingAnim17 = useRef(new Animated.Value(0)).current;
  const floatingAnim18 = useRef(new Animated.Value(0)).current;
  const floatingAnim19 = useRef(new Animated.Value(0)).current;
  const floatingAnim20 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation for decorative elements
    const createFloatingAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start floating animations
    createFloatingAnimation(floatingAnim1, 3000).start();
    createFloatingAnimation(floatingAnim2, 4000).start();
    createFloatingAnimation(floatingAnim3, 5000).start();
    createFloatingAnimation(floatingAnim4, 3500).start();
    createFloatingAnimation(floatingAnim5, 4500).start();
    createFloatingAnimation(floatingAnim6, 5500).start();
    createFloatingAnimation(floatingAnim7, 3200).start();
    createFloatingAnimation(floatingAnim8, 4200).start();
    createFloatingAnimation(floatingAnim9, 5200).start();
    createFloatingAnimation(floatingAnim10, 2800).start();
    createFloatingAnimation(floatingAnim11, 3800).start();
    createFloatingAnimation(floatingAnim12, 4800).start();
    createFloatingAnimation(floatingAnim13, 3300).start();
    createFloatingAnimation(floatingAnim14, 4300).start();
    createFloatingAnimation(floatingAnim15, 5300).start();
    createFloatingAnimation(floatingAnim16, 2900).start();
    createFloatingAnimation(floatingAnim17, 3900).start();
    createFloatingAnimation(floatingAnim18, 4900).start();
    createFloatingAnimation(floatingAnim19, 3400).start();
    createFloatingAnimation(floatingAnim20, 4400).start();

    // Pulse animation for main logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Elements */}
      <View style={styles.backgroundDecorations}>
        {/* Floating decorative circles */}
        <Animated.View 
          style={[
            styles.floatingCircle1,
            {
              transform: [
                {
                  translateY: floatingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle2,
            {
              transform: [
                {
                  translateY: floatingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle3,
            {
              transform: [
                {
                  translateY: floatingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle4,
            {
              transform: [
                {
                  translateY: floatingAnim4.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -18],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle5,
            {
              transform: [
                {
                  translateY: floatingAnim5.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -22],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle6,
            {
              transform: [
                {
                  translateY: floatingAnim6.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -16],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle7,
            {
              transform: [
                {
                  translateY: floatingAnim7.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle8,
            {
              transform: [
                {
                  translateY: floatingAnim8.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -14],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle9,
            {
              transform: [
                {
                  translateY: floatingAnim9.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -19],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle10,
            {
              transform: [
                {
                  translateY: floatingAnim10.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle11,
            {
              transform: [
                {
                  translateY: floatingAnim11.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -17],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle12,
            {
              transform: [
                {
                  translateY: floatingAnim12.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -14],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle13,
            {
              transform: [
                {
                  translateY: floatingAnim13.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -21],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle14,
            {
              transform: [
                {
                  translateY: floatingAnim14.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -13],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle15,
            {
              transform: [
                {
                  translateY: floatingAnim15.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -18],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle16,
            {
              transform: [
                {
                  translateY: floatingAnim16.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -16],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle17,
            {
              transform: [
                {
                  translateY: floatingAnim17.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -14],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle18,
            {
              transform: [
                {
                  translateY: floatingAnim18.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle19,
            {
              transform: [
                {
                  translateY: floatingAnim19.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingCircle20,
            {
              transform: [
                {
                  translateY: floatingAnim20.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15],
                  }),
                },
              ],
            },
          ]}
        />
      </View>

      {/* Header with Profile and Rules Buttons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleHowToPlay} style={styles.rulesButton}>
          <Text style={styles.rulesButtonText}>❓</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoTop}>TOP</Text>
          <Text style={styles.logoNumber}>10</Text>
        </Animated.View>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Player'} 👋
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
  backgroundDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  floatingCircle1: {
    position: 'absolute',
    top: height * 0.08,
    right: width * 0.05,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',
  },
  floatingCircle2: {
    position: 'absolute',
    top: height * 0.35,
    left: width * 0.08,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',
  },
  floatingCircle3: {
    position: 'absolute',
    top: height * 0.65,
    right: width * 0.05,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',
  },
  floatingCircle4: {
    position: 'absolute',
    top: height * 0.20,
    left: width * 0.25,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',
  },
  floatingCircle5: {
    position: 'absolute',
    top: height * 0.55,
    left: width * 0.35,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',
  },
  floatingCircle6: {
    position: 'absolute',
    top: height * 0.85,
    left: width * 0.12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle7: {
    position: 'absolute',
    top: height * 0.42,
    right: width * 0.25,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle8: {
    position: 'absolute',
    top: height * 0.65,
    left: width * 0.50,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle9: {
    position: 'absolute',
    top: height * 0.82,
    right: width * 0.25,
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle10: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.45,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle11: {
    position: 'absolute',
    top: height * 0.48,
    right: width * 0.35,
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle12: {
    position: 'absolute',
    top: height * 0.75,
    left: width * 0.60,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle13: {
    position: 'absolute',
    top: height * 0.30,
    right: width * 0.45,
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle14: {
    position: 'absolute',
    top: height * 0.68,
    left: width * 0.18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle15: {
    position: 'absolute',
    top: height * 0.90,
    right: width * 0.60,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle16: {
    position: 'absolute',
    top: height * 0.12,
    right: width * 0.30,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle17: {
    position: 'absolute',
    top: height * 0.58,
    left: width * 0.22,
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle18: {
    position: 'absolute',
    top: height * 0.75,
    right: width * 0.45,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle19: {
    position: 'absolute',
    top: height * 0.38,
    left: width * 0.55,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

  },
  floatingCircle20: {
    position: 'absolute',
    top: height * 0.58,
    right: width * 0.20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(91, 33, 182, 0.3)',

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
    paddingTop: SPACING.lg,
    zIndex: 10,
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
  rulesButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 24,
  },
  welcomeText: {
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: 'bold',
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
    zIndex: 5,
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
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  quickActionsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    zIndex: 5,
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
    zIndex: 5,
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



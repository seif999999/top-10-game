import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ScrollView, Animated, PanResponder, Easing, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { HomeScreenProps } from '../../shared/types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import AvatarIcon from '../components/AvatarIcon';
import HowToPlayModal from '../components/HowToPlayModal';
import DailyRewardModal from '../components/DailyRewardModal';
import { getStreakInfo, StreakInfo } from '../../backend/services/dailyRewardService';

const { width, height } = Dimensions.get('window');

// Safely load coin image with fallback
let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch (e) {
  // Image not found, will use emoji fallback
  coinImageSource = null;
}

// Swipeable Card Component
interface SwipeableCardProps {
  onSwipeComplete: () => void;
  onPress: () => void;
  children: React.ReactNode;
  cardStyle?: any;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ onSwipeComplete, onPress, children, cardStyle }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const hasNavigated = useRef(false);

  const SWIPE_THRESHOLD = 100;
  const VELOCITY_THRESHOLD = 500;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only start if it's clearly a horizontal gesture
        return Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes - prioritize over ScrollView
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const hasEnoughMovement = Math.abs(gestureState.dx) > 10;
        return isHorizontal && hasEnoughMovement;
      },
      onPanResponderTerminationRequest: () => false, // Don't allow ScrollView to take over
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.setOffset({ x: (pan.x as any)._value, y: 0 });
        pan.setValue({ x: 0, y: 0 });
        // Slight scale up on grab
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }).start();
      },
      onPanResponderTerminate: () => {
        // If gesture is terminated, reset to center
        isDragging.current = false;
        pan.flattenOffset();
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
        ]).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update position
        pan.setValue({ x: gestureState.dx, y: 0 });
        
        // Rotate based on drag distance (max 15 degrees)
        const rotation = gestureState.dx / 10;
        rotate.setValue(Math.max(-15, Math.min(15, rotation)));
        
        // Fade out based on distance
        const distance = Math.abs(gestureState.dx);
        const fadeValue = Math.max(0.5, 1 - distance / 300);
        opacity.setValue(fadeValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        pan.flattenOffset();
        
        const offsetX = gestureState.dx;
        const velocityX = gestureState.vx;
        const shouldSwipe = Math.abs(offsetX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;
        
        if (shouldSwipe && !hasNavigated.current) {
          hasNavigated.current = true;
          // Animate card off screen
          const exitX = offsetX > 0 ? width + 100 : -width - 100;
          
          Animated.parallel([
            Animated.timing(pan, {
              toValue: { x: exitX, y: 0 },
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: offsetX > 0 ? 15 : -15,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Navigate after animation completes
            onSwipeComplete();
          });
        } else {
          // Return to center
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handlePress = () => {
    if (!isDragging.current && !hasNavigated.current) {
      onPress();
    }
  };

  return (
    <Animated.View
      style={[
        cardStyle,
        {
          transform: [
            { translateX: pan.x },
            { 
              rotate: rotate.interpolate({
                inputRange: [-15, 0, 15],
                outputRange: ['-15deg', '0deg', '15deg'],
              })
            },
            { scale },
          ],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handlePress}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, getUserProfileWithAvatar } = useAuth();
  const { playButtonClick, isMusicEnabled, playBackgroundMusic, stopBackgroundMusic } = useAudio();
  const insets = useSafeAreaInsets();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [displayedCoins, setDisplayedCoins] = useState(user?.coins ?? 0);

  // Start background music when on home screen (if enabled)
  useEffect(() => {
    if (isMusicEnabled) {
      playBackgroundMusic();
    }
    
    // Stop music when leaving home screen
    return () => {
      stopBackgroundMusic();
    };
  }, [isMusicEnabled]);

  // Load streak info on mount and when user changes
  useEffect(() => {
    const loadStreakInfo = async () => {
      if (user?.id) {
        const info = await getStreakInfo(user.id);
        setStreakInfo(info);
        // Auto-show modal if reward is available (can claim)
        if (info.canClaim) {
          setShowDailyReward(true);
        }
      }
    };
    loadStreakInfo();
  }, [user?.id]);

  // Update displayed coins when user changes
  useEffect(() => {
    setDisplayedCoins(user?.coins ?? 0);
  }, [user?.coins]);

  const handleRewardClaimed = async (reward: number) => {
    // Update displayed coins immediately for smooth UX
    setDisplayedCoins(prev => prev + reward);
    // Refresh user profile to get updated coins from server
    if (getUserProfileWithAvatar) {
      await getUserProfileWithAvatar();
    }
    // Update streak info
    if (user?.id) {
      const info = await getStreakInfo(user.id);
      setStreakInfo(info);
    }
  };

  const handleProfileNavigation = () => {
    playButtonClick();
    navigation.navigate('Profile');
  };

  const handleSinglePlayer = () => {
    playButtonClick();
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  const handleMultiplayer = () => {
    playButtonClick();
    navigation.navigate('MultiplayerMenu');
  };

  const handleHowToPlay = () => {
    playButtonClick();
    setShowHowToPlay(true);
  };

  const handleCreateYourOwn = () => {
    playButtonClick();
    navigation.navigate('CreateCustomQuestion');
  };
  
  const handleDailyRewardOpen = () => {
    playButtonClick();
    setShowDailyReward(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        directionalLockEnabled={true}
      >
        {/* Header with Profile, Coins, and Rules Buttons */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <AvatarIcon 
            user={user} 
            size={44} 
            showBorder={false}
            backgroundColor={COLORS.primary}
            textColor={COLORS.background}
          />
        </TouchableOpacity>
        
        {/* Right side - Coins, Daily Reward & Help */}
        <View style={styles.headerRight}>
          {/* Daily Reward Button */}
          <TouchableOpacity 
            onPress={handleDailyRewardOpen} 
            style={[styles.dailyRewardButton, streakInfo?.canClaim && styles.dailyRewardButtonActive]}
          >
            <Text style={styles.dailyRewardIcon}>🎁</Text>
            {streakInfo?.canClaim && (
              <View style={styles.dailyRewardBadge}>
                <Text style={styles.dailyRewardBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Coin Display */}
          <View style={styles.coinDisplay}>
            {/* Coin Icon */}
            <View style={styles.coinIconContainer}>
              {coinImageSource ? (
                <Image
                  source={coinImageSource}
                  style={styles.coinImage}
                  resizeMode="contain"
                  onError={() => {
                    // Silently fallback - error already handled
                  }}
                />
              ) : (
                <Text style={styles.coinIcon}>🪙</Text>
              )}
            </View>
            {/* Coin Balance */}
            <Text style={styles.coinBalance}>
              {displayedCoins.toLocaleString()}
            </Text>
          </View>

          {/* Help Button */}
          <TouchableOpacity onPress={handleHowToPlay} style={styles.rulesButton}>
            <Text style={styles.rulesButtonText}>❓</Text>
          </TouchableOpacity>
        </View>
      </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            {/* Subtle glow behind logo - no visible circles */}
            <View style={styles.logoSubtleGlow} />
            
            <View style={styles.logoTextWrapper}>
              <Text style={styles.logoTop}>TOP</Text>
              <Text style={styles.logoNumber}>10</Text>
            </View>
          </View>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.displayName || 'Player'} 👋
          </Text>
          <Text style={styles.heroSubtitle}>Choose your game mode to start playing</Text>
        </View>

        {/* Game Mode Cards */}
        <View style={styles.gameModeSection}>
          {/* Single Player Card */}
          <SwipeableCard
            onSwipeComplete={handleSinglePlayer}
            onPress={handleSinglePlayer}
            cardStyle={styles.gameModeCard}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Glassmorphism overlay */}
              <View style={styles.cardGlassOverlay} />
              
              <View style={styles.gameModeContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.gameModeIcon}>🎯</Text>
                </View>
                <View style={styles.gameModeText}>
                  <Text style={styles.gameModeTitle}>Single Player</Text>
                  <Text style={styles.gameModeSubtitle}>Play with friends offline and be the host</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </SwipeableCard>

          {/* Multiplayer Card */}
          <SwipeableCard
            onSwipeComplete={handleMultiplayer}
            onPress={handleMultiplayer}
            cardStyle={styles.gameModeCard}
          >
            <LinearGradient
              colors={['#7C3AED', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardGlassOverlay} />
              
              <View style={styles.gameModeContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.gameModeIcon}>👥</Text>
                </View>
                <View style={styles.gameModeText}>
                  <Text style={styles.gameModeTitle}>Multiplayer</Text>
                  <Text style={styles.gameModeSubtitle}>Create and join rooms using the code</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </SwipeableCard>

          {/* Create Your Own Card */}
          <SwipeableCard
            onSwipeComplete={handleCreateYourOwn}
            onPress={handleCreateYourOwn}
            cardStyle={styles.gameModeCard}
          >
            <LinearGradient
              colors={['#5B21B6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardGlassOverlay} />
              
              <View style={styles.gameModeContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.gameModeIcon}>✏️</Text>
                </View>
                <View style={styles.gameModeText}>
                  <Text style={styles.gameModeTitle}>Create Your Own</Text>
                  <Text style={styles.gameModeSubtitle}>Create your own questions with your own answers</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </View>
            </LinearGradient>
          </SwipeableCard>
        </View>
      </ScrollView>

      {/* How to Play Modal */}
      <HowToPlayModal
        visible={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Daily Reward Modal */}
      {user?.id && (
        <DailyRewardModal
          visible={showDailyReward}
          onClose={() => setShowDailyReward(false)}
          userId={user.id}
          onRewardClaimed={handleRewardClaimed}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    zIndex: 10,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyRewardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    position: 'relative',
  },
  dailyRewardButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  dailyRewardIcon: {
    fontSize: 22,
  },
  dailyRewardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  dailyRewardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // Gold with transparency
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginRight: SPACING.sm,
  },
  coinIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  coinImage: {
    width: 24,
    height: 24,
  },
  coinIcon: {
    fontSize: 20,
  },
  coinBalance: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 30,
  },
  rulesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 20,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
    height: 200,
    width: '100%',
  },
  logoSubtleGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    transform: [{ translateX: -120 }, { translateY: -120 }],
    opacity: 0.5,
  },
  logoTextWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    position: 'relative',
  },
  logoTop: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 4,
  },
  logoNumber: {
    fontSize: 90,
    fontWeight: '900',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: '#8B5CF6',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    includeFontPadding: false,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: width * 0.8,
  },
  gameModeSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  gameModeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  cardGradient: {
    padding: SPACING.lg,
    borderRadius: 24,
    position: 'relative',
  },
  cardGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  gameModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  gameModeIcon: {
    fontSize: 36,
  },
  gameModeText: {
    flex: 1,
  },
  gameModeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameModeSubtitle: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 14,
    lineHeight: 20,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginLeft: SPACING.md,
  },
});

export default HomeScreen;



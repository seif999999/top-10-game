import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Animated, PanResponder, Easing, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { HomeScreenProps } from '../../shared/types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import useAppTranslation from '../../hooks/useTranslation';
import AvatarIcon from '../components/AvatarIcon';
import CoinDisplay from '../components/CoinDisplay';
import BannerAd from '../components/ads/BannerAd';
import DailyRewardModal from '../components/DailyRewardModal';
import { SinglePlayerIcon, MultiplayerIcon, CreateIcon } from '../components/GameIcons';
import { getStreakInfo, StreakInfo } from '../../backend/services/dailyRewardService';
import { missionService } from '../../backend/services/missionService';

const { width, height } = Dimensions.get('window');

let shopIconSource: any = null;
try {
  shopIconSource = require('../assets/icons/shop.png');
} catch {
  shopIconSource = null;
}

let medalIconSource: any = null;
try {
  medalIconSource = require('../assets/icons/medal.png');
} catch {
  medalIconSource = null;
}

const homeBackgroundImage = require('../assets/images/home-background.png');

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
  const panOffsetX = useRef(0);

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
        pan.setOffset({ x: panOffsetX.current, y: 0 });
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
        ]).start(() => {
          panOffsetX.current = 0;
        });
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
          ]).start(() => {
            panOffsetX.current = 0;
          });
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
  const { user, getUserProfileWithAvatar, welcomeCoinsMessage, clearWelcomeCoinsMessage } = useAuth();
  const { playButtonClick, isMusicEnabled, isInitialized, playBackgroundMusic, stopBackgroundMusic } = useAudio();
  const { t, isRTL } = useAppTranslation('screens');
  /** Screens namespace t with string keys (keys exist in locales/en/screens.json; generated types may be stale). */
  const tScreens = t as (key: string, options?: Record<string, unknown>) => string;
  const insets = useSafeAreaInsets();
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [unclaimedMissionsCount, setUnclaimedMissionsCount] = useState(0);

  // Refresh unclaimed missions count when Home is focused (e.g. after returning from Missions)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        if (!user?.id) return;
        const count = await missionService.getUnclaimedRewardCount(user.id);
        if (!cancelled) setUnclaimedMissionsCount(count);
      };
      load();
      return () => { cancelled = true; };
    }, [user?.id])
  );

  // Start background music when on home screen (if enabled, after prefs loaded)
  useEffect(() => {
    if (isInitialized && isMusicEnabled) {
      playBackgroundMusic();
    }
    
    // Stop music when leaving home screen
    return () => {
      stopBackgroundMusic();
    };
  }, [isInitialized, isMusicEnabled]);

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

  // Show one-time welcome coins message after sign-up
  useEffect(() => {
    if (!welcomeCoinsMessage || !clearWelcomeCoinsMessage) return;
    Alert.alert(
      'Welcome!',
      welcomeCoinsMessage,
      [{ text: 'OK', onPress: clearWelcomeCoinsMessage }]
    );
  }, [welcomeCoinsMessage, clearWelcomeCoinsMessage]);

  const handleRewardClaimed = async (reward: number) => {
    if (getUserProfileWithAvatar) {
      await getUserProfileWithAvatar();
    }
    // Update streak info
    if (user?.id) {
      const info = await getStreakInfo(user.id);
      setStreakInfo(info);
    }
  };

  const handleProfileNavigation = useCallback(() => {
    playButtonClick();
    navigation.navigate('Profile');
  }, [playButtonClick, navigation]);

  const handleSinglePlayer = useCallback(() => {
    playButtonClick();
    navigation.navigate('Categories', { gameMode: 'single' });
  }, [playButtonClick, navigation]);

  const handleMultiplayer = useCallback(() => {
    playButtonClick();
    navigation.navigate('MultiplayerMenu');
  }, [playButtonClick, navigation]);

  const handleCreateYourOwn = useCallback(() => {
    playButtonClick();
    navigation.navigate('CustomQuestionSlots');
  }, [playButtonClick, navigation]);

  const handleDailyRewardOpen = useCallback(() => {
    playButtonClick();
    setShowDailyReward(true);
  }, [playButtonClick]);

  const handleMissions = useCallback(() => {
    playButtonClick();
    navigation.navigate('Missions');
  }, [playButtonClick, navigation]);

  const handleShopPress = useCallback(() => {
    playButtonClick();
    navigation.navigate('Shop');
  }, [playButtonClick, navigation]);

  const headerStyle = useMemo(
    () => [
      styles.header,
      {
        paddingTop: Math.max(SPACING.xs, insets.top * 0.5),
        paddingRight: isRTL ? SPACING.lg : Math.max(SPACING.lg, insets.right + SPACING.xs),
        paddingLeft: isRTL ? Math.max(SPACING.lg, insets.left + SPACING.xs) : SPACING.lg,
      },
      isRTL && styles.rtlRow,
    ],
    [insets.top, insets.right, insets.left, isRTL]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-screen background image - reimplemented to fill entire screen */}
      <View style={styles.backgroundImageWrapper} pointerEvents="none">
        <Image
          source={homeBackgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.mainContent}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          directionalLockEnabled={true}
        >
        {/* Header with Profile, Coins, and Rules Buttons */}
        <View style={headerStyle}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <AvatarIcon 
            user={user} 
            size={44} 
            showBorder={false}
            backgroundColor={COLORS.primary}
            textColor={COLORS.background}
          />
        </TouchableOpacity>
        
        {/* Missions, Daily Reward, Coins in same row; Shop below coins */}
        <View style={styles.headerRight}>
          <View style={styles.headerRightTopRow}>
            <TouchableOpacity 
              onPress={handleMissions} 
              style={styles.missionsButton}
            >
              <Text style={styles.missionsIcon}>🎯</Text>
              {unclaimedMissionsCount > 0 && (
                <View style={styles.missionsBadge}>
                  <Text style={styles.missionsBadgeText}>
                    {unclaimedMissionsCount > 9 ? '9+' : String(unclaimedMissionsCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDailyRewardOpen} 
              style={[styles.dailyRewardButton, streakInfo?.canClaim && styles.dailyRewardButtonActive]}
            >
              {medalIconSource ? (
                <Image source={medalIconSource} style={styles.dailyRewardIconImage} resizeMode="contain" />
              ) : (
                <Text style={styles.dailyRewardIcon}>🎁</Text>
              )}
              {streakInfo?.canClaim && (
                <View style={styles.dailyRewardBadge}>
                  <Text style={styles.dailyRewardBadgeText}>!</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.coinDisplayInHeader} pointerEvents="box-none">
              <CoinDisplay size="small" showShopButton style={styles.coinDisplay} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.headerShopButton}
            onPress={handleShopPress}
            activeOpacity={0.7}
          >
            {shopIconSource ? (
              <Image source={shopIconSource} style={styles.headerShopIcon} resizeMode="contain" />
            ) : (
              <Text style={styles.headerShopButtonText}>🛍️</Text>
            )}
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
            {tScreens('home.welcomeBack', { name: user?.displayName || tScreens('profile.user') })}
          </Text>
          <Text style={styles.heroSubtitle}>{tScreens('home.chooseGameMode')}</Text>
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
              
              <View style={[styles.gameModeContent, isRTL && styles.rtlRow]}>
                <View style={[styles.iconContainer, isRTL && { marginRight: 0, marginLeft: SPACING.lg }]}>
                  <SinglePlayerIcon size={48} primaryColor="#FFFFFF" secondaryColor="#E9D5FF" accentColor="#60A5FA" />
                </View>
                <View style={styles.gameModeText}>
                  <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{tScreens('home.singlePlayer')}</Text>
                  <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{tScreens('home.singlePlayerDesc')}</Text>
                </View>
                <Text style={styles.arrow}>{isRTL ? '←' : '→'}</Text>
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
              
              <View style={[styles.gameModeContent, isRTL && styles.rtlRow]}>
                <View style={[styles.iconContainer, isRTL && { marginRight: 0, marginLeft: SPACING.lg }]}>
                  <MultiplayerIcon size={48} primaryColor="#FFFFFF" secondaryColor="#E9D5FF" accentColor="#60A5FA" />
                </View>
                <View style={styles.gameModeText}>
                  <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{tScreens('home.multiplayer')}</Text>
                  <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{tScreens('home.multiplayerDesc')}</Text>
                </View>
                <Text style={styles.arrow}>{isRTL ? '←' : '→'}</Text>
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
              
              <View style={[styles.gameModeContent, isRTL && styles.rtlRow]}>
                <View style={[styles.iconContainer, isRTL && { marginRight: 0, marginLeft: SPACING.lg }]}>
                  <CreateIcon size={48} primaryColor="#FFFFFF" secondaryColor="#E9D5FF" accentColor="#FBBF24" />
                </View>
                <View style={styles.gameModeText}>
                  <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{tScreens('home.createYourOwn')}</Text>
                  <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{tScreens('home.createYourOwnDesc')}</Text>
                </View>
                <Text style={styles.arrow}>{isRTL ? '←' : '→'}</Text>
              </View>
            </LinearGradient>
          </SwipeableCard>
        </View>
        </ScrollView>
        <BannerAd position="bottom" />
      </View>

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
  backgroundImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width,
    height,
    zIndex: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    zIndex: 0,
  },
  mainContent: {
    flex: 1,
    zIndex: 1,
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
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
    zIndex: 10,
  },
  headerShopButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShopIcon: {
    width: 28,
    height: 28,
  },
  headerShopButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  headerRightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  coinDisplayInHeader: {
    marginLeft: SPACING.sm,
  },
  missionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  missionsIcon: {
    fontSize: 22,
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
  dailyRewardIconImage: {
    width: 24,
    height: 24,
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
  missionsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  missionsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    alignItems: 'center' as const,
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
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



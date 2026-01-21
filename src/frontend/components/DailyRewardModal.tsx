import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../design-system';
import { getStreakInfo, claimDailyReward, StreakInfo, DailyRewardResult } from '../../backend/services/dailyRewardService';
import { useAudio } from '../contexts/AudioContext';
import { logger } from '../../backend/utils/logger';

// Load coin image
let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch (e) {
  coinImageSource = null;
}

const { width } = Dimensions.get('window');

interface DailyRewardModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onRewardClaimed?: (reward: number, newCoinTotal: number) => void;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  visible,
  onClose,
  userId,
  onRewardClaimed,
}) => {
  const { playButtonClick, playSuccess } = useAudio();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<DailyRewardResult | null>(null);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const coinBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      loadStreakInfo();
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      setClaimResult(null);
    }
  }, [visible]);

  const loadStreakInfo = async () => {
    try {
      setLoading(true);
      const info = await getStreakInfo(userId);
      setStreakInfo(info);
    } catch (error) {
      logger.error('Error loading streak info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!streakInfo?.canClaim || claiming) return;
    
    playButtonClick();
    
    try {
      setClaiming(true);
      const result = await claimDailyReward(userId);
      setClaimResult(result);
      
      if (result.success) {
        playSuccess(); // Play success sound when reward is claimed
        
        // Coin bounce animation
        Animated.sequence([
          Animated.timing(coinBounce, {
            toValue: 1.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(coinBounce, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }),
        ]).start();
        
        // Notify parent
        if (onRewardClaimed) {
          // We don't have the new total here, so we just pass the reward
          onRewardClaimed(result.reward, 0);
        }
        
        // Update local streak info
        setStreakInfo({
          ...streakInfo,
          canClaim: false,
          currentStreak: result.currentStreak,
          currentWeek: result.currentWeek,
        });
      }
    } catch (error) {
      logger.error('Error claiming daily reward:', error);
    } finally {
      setClaiming(false);
    }
  };

  const renderDayIndicators = () => {
    const days = [];
    const currentDay = claimResult?.currentStreak ?? streakInfo?.currentStreak ?? 0;
    
    for (let i = 1; i <= 7; i++) {
      const isCompleted = i <= currentDay;
      const isCurrent = i === currentDay && !streakInfo?.canClaim;
      
      days.push(
        <View key={i} style={styles.dayContainer}>
          <View style={[
            styles.dayCircle,
            isCompleted && styles.dayCircleCompleted,
            isCurrent && styles.dayCircleCurrent,
          ]}>
            {isCompleted ? (
              <Text style={styles.dayCheckmark}>✓</Text>
            ) : (
              <Text style={[styles.dayNumber, isCompleted && styles.dayNumberCompleted]}>
                {i}
              </Text>
            )}
          </View>
          <Text style={styles.dayLabel}>Day {i}</Text>
        </View>
      );
    }
    
    return days;
  };

  const currentWeek = claimResult?.currentWeek ?? streakInfo?.currentWeek ?? 1;
  const reward = claimResult?.reward ?? streakInfo?.nextReward ?? 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f1e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => { playButtonClick(); onClose(); }}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Daily Reward</Text>
              <Text style={styles.weekBadge}>Week {currentWeek}</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <>
                {/* Streak Progress */}
                <View style={styles.streakContainer}>
                  <View style={styles.daysRow}>
                    {renderDayIndicators()}
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${((claimResult?.currentStreak ?? streakInfo?.currentStreak ?? 0) / 7) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>

                {/* Reward Display */}
                <Animated.View 
                  style={[
                    styles.rewardContainer,
                    { transform: [{ scale: coinBounce }] }
                  ]}
                >
                  <View style={styles.coinIconContainer}>
                    {coinImageSource ? (
                      <Image
                        source={coinImageSource}
                        style={styles.coinImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <LinearGradient
                        colors={['#FFD700', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.coinIconFallback}
                      >
                        <Text style={styles.coinEmoji}>🪙</Text>
                      </LinearGradient>
                    )}
                  </View>
                  <Text style={styles.rewardAmount}>+{reward}</Text>
                  <Text style={styles.rewardLabel}>
                    {currentWeek > 1 ? `${Math.pow(2, currentWeek - 1)}x Week Bonus!` : 'Coins'}
                  </Text>
                </Animated.View>

                {/* Streak Warning */}
                {streakInfo?.streakWillBreak && !claimResult && (
                  <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                      ⚠️ Your streak was broken! Starting fresh from Week 1.
                    </Text>
                  </View>
                )}

                {/* Claim Result Message */}
                {claimResult && (
                  <View style={[
                    styles.resultContainer,
                    claimResult.success ? styles.resultSuccess : styles.resultError
                  ]}>
                    <Text style={styles.resultText}>{claimResult.message}</Text>
                  </View>
                )}

                {/* Claim Button */}
                <TouchableOpacity
                  style={[
                    styles.claimButton,
                    (!streakInfo?.canClaim || claiming) && styles.claimButtonDisabled,
                  ]}
                  onPress={handleClaim}
                  disabled={!streakInfo?.canClaim || claiming}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={streakInfo?.canClaim ? ['#8B5CF6', '#A78BFA'] : ['#4B5563', '#6B7280']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.claimButtonGradient}
                  >
                    {claiming ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.claimButtonText}>
                        {streakInfo?.canClaim ? 'Claim Reward' : 'Already Claimed Today'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Info Text */}
                <Text style={styles.infoText}>
                  Login daily to build your streak! Complete 7 days to advance to the next week with doubled rewards.
                </Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  modalGradient: {
    padding: SPACING.xl,
    paddingTop: SPACING.xl + 10,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 26,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  weekBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: SPACING.md,
  },
  streakContainer: {
    marginBottom: SPACING.xl,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCircleCompleted: {
    backgroundColor: '#8B5CF6',
    borderColor: '#A78BFA',
  },
  dayCircleCurrent: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  dayNumber: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  dayNumberCompleted: {
    color: '#FFFFFF',
  },
  dayCheckmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dayLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  coinIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  coinImage: {
    width: 100,
    height: 100,
  },
  coinIconFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  coinEmoji: {
    fontSize: 40,
  },
  rewardAmount: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: '800',
  },
  rewardLabel: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningText: {
    color: '#FBBF24',
    fontSize: 14,
    textAlign: 'center',
  },
  resultContainer: {
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  resultSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  resultText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  claimButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  claimButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  claimButtonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default DailyRewardModal;

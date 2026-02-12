import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { MissionsScreenProps } from '../../shared/types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import useAppTranslation from '../../hooks/useTranslation';
import { missionService } from '../../backend/services/missionService';
import { MISSION_DEFINITIONS } from '../../backend/services/missionDefinitions';
import { MissionDefinition, MissionProgress, MissionDifficulty, MissionCategory } from '../../shared/types/missions';
import { logger } from '../../backend/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch {
  coinImageSource = null;
}

// Difficulty colors
const DIFFICULTY_COLORS: Record<MissionDifficulty, { bg: string; border: string; text: string; glow: string }> = {
  easy: { bg: '#064E3B', border: '#10B981', text: '#34D399', glow: 'rgba(16, 185, 129, 0.3)' },
  medium: { bg: '#1E3A8A', border: '#3B82F6', text: '#60A5FA', glow: 'rgba(59, 130, 246, 0.3)' },
  hard: { bg: '#581C87', border: '#A855F7', text: '#C084FC', glow: 'rgba(168, 85, 247, 0.3)' },
  legendary: { bg: '#7C2D12', border: '#F59E0B', text: '#FBBF24', glow: 'rgba(245, 158, 11, 0.4)' },
};

// Category icons
const CATEGORY_ICONS: Record<MissionCategory, string> = {
  streak: '🔥',
  score: '🏆',
  games: '🎮',
  accuracy: '🎯',
  speed: '⚡',
  multiplayer: '👥',
  exploration: '🗺️',
  daily: '📅',
  special: '⭐',
};

interface MissionCardProps {
  mission: MissionDefinition;
  progress: MissionProgress;
  index: number;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission, progress, index }) => {
  const { t } = useAppTranslation('screens');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const colors = DIFFICULTY_COLORS[mission.difficulty];
  
  const progressPercent = Math.min(100, (progress.currentValue / mission.targetValue) * 100);
  const isCompleted = progress.isCompleted;
  const missionName = (t as (k: string) => string)(`missions.list.${mission.id}.name`) || mission.name;
  const missionDescription = (t as (k: string) => string)(`missions.list.${mission.id}.description`) || mission.description;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.delay(index * 80),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 800,
      delay: index * 80 + 300,
      useNativeDriver: false,
    }).start();
  }, [index, progressPercent]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.missionCard,
        {
          backgroundColor: isCompleted ? colors.bg : '#1F2937',
          borderColor: isCompleted ? colors.border : '#374151',
          transform: [{ scale: scaleAnim }],
          shadowColor: isCompleted ? colors.glow : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isCompleted ? 0.8 : 0,
          shadowRadius: 12,
        },
      ]}
    >
      {/* Glow effect for completed missions */}
      {isCompleted && (
        <View style={[styles.completedGlow, { backgroundColor: colors.glow }]} />
      )}

      <View style={styles.missionHeader}>
        {/* Icon and Title */}
        <View style={styles.missionTitleRow}>
          <View style={[styles.missionIconContainer, { backgroundColor: colors.bg }]}>
            <Text style={styles.missionIcon}>{mission.icon}</Text>
          </View>
          <View style={styles.missionTitleContainer}>
            <Text style={[styles.missionName, isCompleted && { color: colors.text }]}>
              {missionName}
            </Text>
            <View style={styles.missionMeta}>
              <View style={[styles.difficultyBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Text style={[styles.difficultyText, { color: colors.text }]}>
                  {(t as (k: string) => string)(`missions.${mission.difficulty}`) || mission.difficulty.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[mission.category]}</Text>
            </View>
          </View>
        </View>

        {/* Completion checkmark */}
        {isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: colors.border }]}>
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.missionDescription}>{missionDescription}</Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressWidth,
                backgroundColor: colors.border,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, isCompleted && { color: colors.text }]}>
          {progress.currentValue} / {mission.targetValue}
        </Text>
      </View>

      {/* Reward */}
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardLabel}>Reward:</Text>
        <View style={styles.rewardBadge}>
          {coinImageSource ? (
            <Image source={coinImageSource} style={styles.coinImage} resizeMode="contain" />
          ) : (
            <Text style={styles.coinIcon}>🪙</Text>
          )}
          <Text style={styles.rewardAmount}>{mission.rewardCoins}</Text>
          <Text style={styles.top10CoinLabel}>Top 10</Text>
        </View>
        {mission.isRepeatable && (
          <View style={styles.repeatableBadge}>
            <Text style={styles.repeatableText}>🔄 Repeatable</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

type FilterType = 'all' | 'in_progress' | 'completed' | MissionDifficulty;

const MissionsScreen: React.FC<MissionsScreenProps> = ({ navigation }) => {
  const { t: tScreens, isRTL } = useAppTranslation('screens');
  const { user } = useAuth();
  const { playButtonClick } = useAudio();
  const insets = useSafeAreaInsets();
  
  const [missions, setMissions] = useState<Array<MissionDefinition & { progress: MissionProgress }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [totalCoins, setTotalCoins] = useState(0);

  // Header animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  const loadMissions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const missionsWithProgress = await missionService.getMissionsWithProgress(user.id);
      const userMissions = await missionService.getUserMissions(user.id);
      
      setMissions(missionsWithProgress);
      setTotalCoins(userMissions.totalCoinsEarned);
    } catch (error) {
      logger.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadMissions();
    
    // Entrance animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loadMissions]);

  // Filter missions
  const filteredMissions = missions.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'in_progress') return !m.progress.isCompleted;
    if (filter === 'completed') return m.progress.isCompleted;
    return m.difficulty === filter;
  });

  // Stats
  const completedCount = missions.filter(m => m.progress.isCompleted).length;
  const totalCount = missions.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: tScreens('missions.all'), color: '#6B7280' },
    { key: 'in_progress', label: tScreens('missions.inProgress'), color: '#3B82F6' },
    { key: 'completed', label: tScreens('missions.completed'), color: '#10B981' },
    { key: 'easy', label: tScreens('missions.easy'), color: '#10B981' },
    { key: 'medium', label: tScreens('missions.medium'), color: '#3B82F6' },
    { key: 'hard', label: tScreens('missions.hard'), color: '#A855F7' },
    { key: 'legendary', label: tScreens('missions.legendary'), color: '#F59E0B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F0A1F', '#1A0F2E', '#0D0D1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative orbs */}
      <View style={[styles.decorativeOrb, styles.orbTop]} />
      <View style={[styles.decorativeOrb, styles.orbBottom]} />

      {/* Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            paddingTop: Math.max(SPACING.xs, insets.top * 0.5),
            opacity: headerAnim,
            transform: [{ 
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }],
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => { playButtonClick(); navigation.goBack(); }} 
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>🎯 {tScreens('missions.title', { defaultValue: 'Missions' })}</Text>
        </View>
        
        <View style={styles.placeholder} />
      </Animated.View>

      {/* Stats Card */}
      <Animated.View 
        style={[
          styles.statsCard,
          {
            opacity: statsAnim,
            transform: [{
              scale: statsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }],
          }
        ]}
      >
        <LinearGradient
          colors={['#1F1B2E', '#2D2640']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsGradient}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>{tScreens('missions.completedLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completionPercent}%</Text>
            <Text style={styles.statLabel}>{tScreens('missions.progress')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.coinStatRow}>
              {coinImageSource ? (
                <Image source={coinImageSource} style={styles.coinImageStat} resizeMode="contain" />
              ) : (
                <Text style={styles.coinIcon}>🪙</Text>
              )}
              <Text style={styles.statValue}>{totalCoins}</Text>
              <Text style={styles.top10CoinLabel}>{tScreens('missions.top10Coin')}</Text>
            </View>
            <Text style={styles.statLabel}>{tScreens('missions.earned')}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => { playButtonClick(); setFilter(f.key); }}
              style={[
                styles.filterTab,
                filter === f.key && { backgroundColor: f.color, borderColor: f.color },
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Missions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{tScreens('missions.loading')}</Text>
          </View>
        ) : filteredMissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>{tScreens('missions.noMissions')}</Text>
            <Text style={styles.emptySubtext}>{tScreens('missions.tryFilter')}</Text>
          </View>
        ) : (
          filteredMissions.map((mission, index) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              progress={mission.progress}
              index={index}
            />
          ))
        )}
        
        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1F',
  },
  decorativeOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  orbTop: {
    top: -100,
    right: -100,
    backgroundColor: '#8B5CF6',
  },
  orbBottom: {
    bottom: -150,
    left: -100,
    backgroundColor: '#F59E0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40,
  },
  statsCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  statsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  coinStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinImage: {
    width: 18,
    height: 18,
  },
  coinImageStat: {
    width: 18,
    height: 18,
  },
  top10CoinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  missionCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#374151',
    position: 'relative',
    overflow: 'hidden',
  },
  completedGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  missionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  missionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  missionIcon: {
    fontSize: 24,
  },
  missionTitleContainer: {
    flex: 1,
  },
  missionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  missionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryIcon: {
    fontSize: 14,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  missionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    minWidth: 60,
    textAlign: 'right',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FBBF24',
  },
  repeatableBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  repeatableText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
});

export default MissionsScreen;

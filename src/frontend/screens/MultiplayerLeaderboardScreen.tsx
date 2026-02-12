import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../backend/utils/constants';
import AvatarIcon from '../components/AvatarIcon';
import useAppTranslation from '../../hooks/useTranslation';

interface Player {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  selectedAvatar?: string;
}

interface MultiplayerLeaderboardScreenProps {
  players: Player[];
  onQuit: () => void;
  onCountdownComplete: () => void;
  countdownSeconds?: number;
}

const MultiplayerLeaderboardScreen: React.FC<MultiplayerLeaderboardScreenProps> = ({
  players,
  onQuit,
  onCountdownComplete,
  countdownSeconds = 15,
}) => {
  const { t } = useAppTranslation('screens');
  const { isRTL } = useAppTranslation();
  const [timeRemaining, setTimeRemaining] = useState(countdownSeconds);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Sort players by score (descending) and assign ranks
  const sortedPlayers = [...players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onCountdownComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCountdownComplete]);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '👑';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#94A3B8'; // Gray
    }
  };

  const getPlayerColor = (index: number) => {
    const colors = ['#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4', '#84CC16'];
    return colors[index % colors.length];
  };

  const renderPlayer = ({ item, index }: { item: Player; index: number }) => {
    const isWinner = item.rank === 1;
    const playerColor = getPlayerColor(index);
    
    return (
      <Animated.View
        style={[
          styles.playerRow,
          isWinner && styles.winnerRow,
          isRTL && styles.rtlRow,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
            {getRankIcon(item.rank)}
          </Text>
        </View>
        
        <View style={styles.playerInfo}>
          <AvatarIcon 
            user={{ 
              id: item.playerId, 
              displayName: item.playerName, 
              email: `${item.playerId}@player.local`,
              selectedAvatar: item.selectedAvatar 
            }} 
            size={40} 
            showBorder={true}
            borderColor={playerColor}
          />
          <Text style={[styles.playerName, isWinner && styles.winnerName]}>
            {item.playerName}
          </Text>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, isWinner && styles.winnerScore]}>
            {item.score}
          </Text>
          <Text style={[styles.scoreLabel, isRTL && styles.rtlText]}>{t('multiplayer.leaderboard.pts')}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.leaderboardCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('multiplayer.leaderboard.title')}</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Players List */}
        <FlatList
          data={sortedPlayers}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.playerId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.playersList}
        />

        {/* Countdown Timer */}
        <View style={styles.countdownContainer}>
          <View style={styles.countdownBar}>
            <View
              style={[
                styles.countdownProgress,
                { width: `${(timeRemaining / countdownSeconds) * 100}%` },
              ]}
            />
          </View>
          <Text style={[styles.countdownText, isRTL && styles.rtlText]}>
            {t('multiplayer.leaderboard.returningIn', { seconds: timeRemaining })}
          </Text>
        </View>

        {/* Quit Button */}
        <TouchableOpacity style={styles.quitButton} onPress={onQuit}>
          <Text style={styles.quitButtonText}>{t('multiplayer.leaderboard.quitGame')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    zIndex: 1000,
  },
  leaderboardCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.primary,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    marginTop: SPACING.sm,
  },
  playersList: {
    paddingVertical: SPACING.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
    backgroundColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  winnerRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 24,
    fontWeight: '800',
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  winnerName: {
    color: '#FFD700',
    fontWeight: '800',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  winnerScore: {
    color: '#FFD700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  countdownContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  countdownBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  countdownProgress: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  countdownText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quitButton: {
    marginTop: SPACING.lg,
    backgroundColor: '#EF4444',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    alignItems: 'center',
  },
  quitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rtlText: {
    textAlign: 'right',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
});

export default MultiplayerLeaderboardScreen;

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
}

interface MultiplayerLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentPlayerId?: string;
  maxHeight?: number;
}

const MultiplayerLeaderboard: React.FC<MultiplayerLeaderboardProps> = ({
  leaderboard,
  currentPlayerId,
  maxHeight = 200
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getPlayerDisplayName = (playerName: string, playerId: string) => {
    if (playerId === currentPlayerId) {
      return `${playerName} (You)`;
    }
    return playerName;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>
      <ScrollView 
        style={[styles.leaderboardContainer, { maxHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {leaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No players yet</Text>
          </View>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentPlayer = entry.playerId === currentPlayerId;
            
            return (
              <View 
                key={entry.playerId} 
                style={[
                  styles.leaderboardItem,
                  isCurrentPlayer && styles.currentPlayerItem
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>{getRankIcon(rank)}</Text>
                </View>
                
                <View style={styles.playerInfo}>
                  <Text style={[
                    styles.playerName,
                    isCurrentPlayer && styles.currentPlayerName
                  ]}>
                    {getPlayerDisplayName(entry.playerName, entry.playerId)}
                  </Text>
                </View>
                
                <View style={styles.scoreContainer}>
                  <Text style={[
                    styles.scoreText,
                    isCurrentPlayer && styles.currentPlayerScore
                  ]}>
                    {entry.score} pts
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  leaderboardContainer: {
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 16
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  currentPlayerItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: SPACING.md
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary
  },
  playerInfo: {
    flex: 1,
    marginRight: SPACING.md
  },
  playerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  currentPlayerName: {
    color: COLORS.primary,
    fontWeight: '700'
  },
  scoreContainer: {
    alignItems: 'flex-end'
  },
  scoreText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700'
  },
  currentPlayerScore: {
    color: COLORS.primary,
    fontWeight: '800'
  }
});

export default MultiplayerLeaderboard;

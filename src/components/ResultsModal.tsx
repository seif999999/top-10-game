import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Animated, Dimensions } from 'react-native';
import Button from './Button';
import { COLORS, SPACING } from '../utils/constants';
import { formatScore, formatTimeReadable, calculatePercentage, getPlayerRanking } from '../utils/gameHelpers';

interface GameResults {
  gameId: string;
  category: string;
  players: string[];
  finalScores: { [playerId: string]: number };
  roundResults: any[];
  winner: string;
  totalTime: number;
  averageScore: number;
  bestAnswer?: any;
}

interface ResultsModalProps {
  visible: boolean;
  gameResults: GameResults | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onBackToCategories: () => void;
}

const { width, height } = Dimensions.get('window');

const ResultsModal: React.FC<ResultsModalProps> = ({
  visible,
  gameResults,
  onClose,
  onPlayAgain,
  onBackToCategories
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && gameResults) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Check if celebration should be shown (high score or perfect game)
      const maxScore = Math.max(...Object.values(gameResults.finalScores));
      const totalPossibleScore = gameResults.roundResults.length * 10; // Assuming max 10 points per question
      const scorePercentage = (maxScore / totalPossibleScore) * 100;

      if (scorePercentage >= 70) {
        setTimeout(() => {
          setShowCelebration(true);
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }, 500);
      }
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      confettiAnim.setValue(0);
      setShowCelebration(false);
    }
  }, [visible, gameResults, fadeAnim, scaleAnim, confettiAnim]);

  if (!visible || !gameResults) return null;

  const playerRanking = getPlayerRanking(gameResults.finalScores);
  const totalQuestions = gameResults.roundResults.length;
  const totalAnswers = gameResults.roundResults.reduce((total, round) => {
    return total + (round.playerAnswers?.length || 0);
  }, 0);
  const correctAnswers = gameResults.roundResults.reduce((total, round) => {
    return total + (round.playerAnswers?.filter((answer: any) => answer.isCorrect)?.length || 0);
  }, 0);
  const accuracy = calculatePercentage(correctAnswers, totalAnswers);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Game Complete!</Text>
              <Text style={styles.subtitle}>{gameResults.category}</Text>
            </View>

            {/* Winner Section */}
            <View style={styles.winnerSection}>
              <Text style={styles.winnerLabel}>🏆 Winner</Text>
              <Text style={styles.winnerName}>{gameResults.winner}</Text>
              <Text style={styles.winnerScore}>
                {formatScore(gameResults.finalScores[gameResults.winner])} points
              </Text>
            </View>

            {/* Final Scores */}
            <View style={styles.scoresSection}>
              <Text style={styles.sectionTitle}>Final Scores</Text>
              {playerRanking.map((player, index) => (
                <View key={player.playerId} style={styles.scoreRow}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{player.rank}</Text>
                  </View>
                  <Text style={styles.playerName}>{player.playerId}</Text>
                  <Text style={styles.playerScore}>{formatScore(player.score)}</Text>
                </View>
              ))}
            </View>

            {/* Performance Stats */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Performance Stats</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Time</Text>
                <Text style={styles.statValue}>{formatTimeReadable(gameResults.totalTime)}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Questions Answered</Text>
                <Text style={styles.statValue}>{totalQuestions}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Correct Answers</Text>
                <Text style={styles.statValue}>{correctAnswers}/{totalAnswers}</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Accuracy</Text>
                <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Average Score</Text>
                <Text style={styles.statValue}>{formatScore(Math.round(gameResults.averageScore))}</Text>
              </View>
            </View>

            {/* Best Answer */}
            {gameResults.bestAnswer && (
              <View style={styles.bestAnswerSection}>
                <Text style={styles.sectionTitle}>Best Answer</Text>
                <View style={styles.bestAnswerCard}>
                  <Text style={styles.bestAnswerText}>
                    "{gameResults.bestAnswer.answer}"
                  </Text>
                  <Text style={styles.bestAnswerDetails}>
                    {gameResults.bestAnswer.points} points • {formatTimeReadable(gameResults.bestAnswer.timeTaken)}
                  </Text>
                </View>
              </View>
            )}

            {/* Celebration Animation */}
            {showCelebration && (
              <Animated.View
                style={[
                  styles.celebrationContainer,
                  {
                    opacity: confettiAnim,
                    transform: [
                      {
                        scale: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  }
                ]}
              >
                <Text style={styles.celebrationText}>🎉 Amazing Performance! 🎉</Text>
                <Text style={styles.celebrationSubtext}>You're on fire! 🔥</Text>
              </Animated.View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Play Again"
              onPress={onPlayAgain}
              style={styles.playAgainButton}
            />
            <Button
              title="Back to Categories"
              onPress={onBackToCategories}
              style={styles.backButton}
              variant="secondary"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    width: width - SPACING.lg * 2,
    maxWidth: 500,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
  },
  winnerSection: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    margin: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: SPACING.sm,
  },
  winnerName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  winnerScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
  },
  scoresSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  playerScore: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    margin: SPACING.lg,
    borderRadius: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.muted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bestAnswerSection: {
    padding: SPACING.lg,
  },
  bestAnswerCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  bestAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  bestAnswerDetails: {
    fontSize: 14,
    color: COLORS.muted,
  },
  celebrationContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    margin: SPACING.lg,
  },
  celebrationText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  celebrationSubtext: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  playAgainButton: {
    backgroundColor: COLORS.primary,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});

export default ResultsModal;

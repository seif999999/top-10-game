import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

let coinImageSource: any = null;
try {
  coinImageSource = require('../assets/avatars/coin.png');
} catch {
  coinImageSource = null;
}
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import type { QuestionAnswer } from '../../shared/types';
import type { Answer } from '../../shared/types/game';
import type { Team } from '../../shared/types/teams';
import useAppTranslation from '../../hooks/useTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 420);
const LIST_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.4, 320);

type RankingQuestion = {
  answers: Array<QuestionAnswer | Answer>;
};

interface RankingOverlayProps {
  visible: boolean;
  question: RankingQuestion;
  submittedAnswers: string[];
  onHide?: () => void;
  isGameEnd?: boolean;
  coinsEarned?: number;
  rewardsDoubled?: boolean;
  onWatchAdToDouble?: () => void | Promise<void>;
  adReady?: boolean;
  /** Team mode: teams and answer assignments to show who scored each answer */
  teams?: Team[];
  answerAssignments?: { [answerIndex: number]: { teamId: string; points: number } };
}

const RankingOverlay: React.FC<RankingOverlayProps> = ({
  visible,
  question,
  submittedAnswers,
  onHide,
  isGameEnd = false,
  coinsEarned = 0,
  rewardsDoubled = false,
  onWatchAdToDouble,
  adReady = false,
  teams,
  answerAssignments,
}) => {
  const { t } = useAppTranslation('components');
  const { isRTL } = useAppTranslation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
      if (!isGameEnd) {
        const timer = setTimeout(() => onHide?.(), 2500);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isGameEnd]);

  const hideOverlay = () => onHide?.();

  if (!visible || !question) return null;

  const getAnswerStatus = (answer: QuestionAnswer | Answer) => {
    const isSubmitted = submittedAnswers.some((submitted) => {
      const n = submitted.toLowerCase().trim();
      const a = answer.text.toLowerCase().trim();
      const norm = (answer.normalized || '').toLowerCase().trim();
      if (n === a || n === norm) return true;
      if (answer.aliases?.length) {
        return answer.aliases.some((alias: string) => alias.toLowerCase().trim() === n);
      }
      return false;
    });
    return isSubmitted ? { status: 'correct' as const, color: COLORS.success } : { status: 'incorrect' as const, color: COLORS.error };
  };

  const sortedAnswers = question.answers
    .filter((answer: QuestionAnswer | Answer) => {
      if (isGameEnd) return true;
      return submittedAnswers.some((submitted) => {
        const n = submitted.toLowerCase().trim();
        const a = answer.text.toLowerCase().trim();
        const norm = (answer.normalized || '').toLowerCase().trim();
        if (n === a || n === norm) return true;
        if (answer.aliases?.length) {
          return answer.aliases.some((alias: string) => alias.toLowerCase().trim() === n);
        }
        return false;
      });
    })
    .sort((a: QuestionAnswer | Answer, b: QuestionAnswer | Answer) => a.rank - b.rank);

  const getTeamForAnswer = (answer: QuestionAnswer | Answer) => {
    if (!teams?.length || !answerAssignments) return null;
    const originalIndex = question.answers.findIndex(
      (pa) => pa.rank === answer.rank && pa.text === answer.text
    );
    if (originalIndex === -1) return null;
    const assignment = answerAssignments[originalIndex];
    if (!assignment) return null;
    return teams.find((t) => t.id === assignment.teamId) ?? null;
  };

  const winningTeams = (() => {
    if (!isGameEnd || !teams?.length) return [];
    const maxScore = Math.max(...teams.map((t) => t.score));
    return teams.filter((t) => t.score === maxScore);
  })();

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.cardWrap,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.card}>
          {/* Header - Game complete hero */}
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerEmoji}>🎉</Text>
            <Text style={styles.headerTitle}>
              {isGameEnd
                ? t('rankingOverlay.gameComplete', { defaultValue: 'Game Complete!' })
                : t('rankingOverlay.currentRankings', { defaultValue: 'Current Rankings' })}
            </Text>
            {!isGameEnd && (
              <Text style={styles.headerSubtitle}>{question.title}</Text>
            )}
            {isGameEnd && winningTeams.length > 0 && (
              <View style={styles.winnerSection}>
                <Text style={styles.winnerLabel}>
                  {winningTeams.length === 1
                    ? t('rankingOverlay.winningTeam', { defaultValue: '🏆 Winning team' })
                    : t('rankingOverlay.winningTeams', { defaultValue: '🏆 Winning teams' })}
                </Text>
                <View style={styles.winnerChips}>
                  {winningTeams.map((team) => (
                    <View key={team.id} style={[styles.winnerChip, { backgroundColor: team.color + '44' }]}>
                      <View style={[styles.winnerChipDot, { backgroundColor: team.color }]} />
                      <Text style={styles.winnerChipText}>
                        {team.name} ({team.score})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Answer list */}
          <View style={styles.listWrap}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              {sortedAnswers.map((answer: QuestionAnswer | Answer) => {
                const { color } = getAnswerStatus(answer);
                const team = getTeamForAnswer(answer);
                return (
                  <View key={answer.rank} style={styles.row}>
                    <View style={[styles.rankBadge, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.rankNum, { color }]}>{answer.rank}</Text>
                    </View>
                    <Text style={styles.answerText} numberOfLines={2}>
                      {answer.text}
                    </Text>
                    {team && (
                      <View style={[styles.teamChip, { backgroundColor: team.color + '33' }]}>
                        <View style={[styles.teamChipDot, { backgroundColor: team.color }]} />
                        <Text style={styles.teamChipText} numberOfLines={1}>
                          {team.name}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Footer - Coins + CTA */}
          {isGameEnd && (
            <View style={styles.footer}>
              <View style={styles.coinsRow}>
                <View style={styles.coinsBadge}>
                  {coinImageSource ? (
                    <Image source={coinImageSource} style={styles.coinImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.coinsLabel}>🪙</Text>
                  )}
                  <Text style={styles.coinsValue}>
                    {rewardsDoubled
                      ? t('rankingOverlay.coinsDoubled', { count: coinsEarned * 2 })
                      : t('rankingOverlay.coinsEarned', { count: coinsEarned })}
                  </Text>
                </View>
                {coinsEarned > 0 && !rewardsDoubled && onWatchAdToDouble && (
                  <TouchableOpacity
                    style={[styles.doubleButton, !adReady && styles.doubleButtonDisabled]}
                    onPress={() => onWatchAdToDouble?.()}
                    disabled={!adReady}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.doubleButtonText}>
                      {t('rankingOverlay.watchAdToDouble')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={hideOverlay}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>
                  {t('rankingOverlay.continue', { defaultValue: 'Continue' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
  },
  cardWrap: {
    width: CARD_WIDTH,
    maxWidth: '100%',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },
  header: {
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.whiteAlpha(0.9),
    textAlign: 'center',
  },
  winnerSection: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  winnerLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.whiteAlpha(0.95),
    marginBottom: SPACING.sm,
  },
  winnerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  winnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.whiteAlpha(0.4),
  },
  winnerChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.xs,
  },
  winnerChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  listWrap: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  rankNum: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  answerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  teamChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 10,
    marginLeft: SPACING.sm,
    maxWidth: 100,
  },
  teamChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  teamChipText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text,
  },
  footer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDark,
    gap: SPACING.lg,
  },
  coinsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.successBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSuccess,
  },
  coinImage: {
    width: 24,
    height: 24,
  },
  coinsLabel: {
    fontSize: 20,
  },
  coinsValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.successLight,
  },
  doubleButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    backgroundColor: '#059669',
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  doubleButtonDisabled: {
    opacity: 0.5,
  },
  doubleButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  continueButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.white,
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default RankingOverlay;

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { formatRank, getDifficultyColor } from '../utils/gameHelpers';

interface AnswerFeedbackProps {
  visible: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  pointsEarned?: number;
  rank?: number;
  userAnswer: string;
  onAnimationComplete?: () => void;
}

const { width } = Dimensions.get('window');

const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  visible,
  isCorrect,
  correctAnswer,
  pointsEarned,
  rank,
  userAnswer,
  onAnimationComplete
}) => {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [visible, slideAnim, scaleAnim, opacityAnim, onAnimationComplete]);

  if (!visible) return null;

  const backgroundColor = isCorrect ? '#10B981' : '#EF4444';
  const icon = isCorrect ? '✅' : '❌';
  const statusText = isCorrect ? 'Correct!' : 'Incorrect';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        <View style={styles.answerSection}>
          <Text style={styles.label}>Your Answer:</Text>
          <Text style={styles.userAnswer}>{userAnswer}</Text>
        </View>

        {isCorrect && correctAnswer && (
          <View style={styles.correctAnswerSection}>
            <Text style={styles.label}>Correct Answer:</Text>
            <Text style={styles.correctAnswer}>{correctAnswer}</Text>
          </View>
        )}

        {!isCorrect && correctAnswer && (
          <View style={styles.correctAnswerSection}>
            <Text style={styles.label}>Correct Answer:</Text>
            <Text style={styles.correctAnswer}>{correctAnswer}</Text>
          </View>
        )}

        {isCorrect && rank && (
          <View style={styles.rankSection}>
            <Text style={styles.rankText}>
              That was {formatRank(rank)} on the list!
            </Text>
          </View>
        )}

        {pointsEarned !== undefined && (
          <View style={styles.pointsSection}>
            <Text style={styles.pointsLabel}>
              {isCorrect ? 'Points Earned:' : 'Points:'}
            </Text>
            <Text style={styles.pointsValue}>
              {isCorrect ? `+${pointsEarned}` : '0'}
            </Text>
          </View>
        )}

        {!isCorrect && (
          <View style={styles.encouragementSection}>
            <Text style={styles.encouragementText}>
              Don't worry! Keep trying! 💪
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    margin: SPACING.lg,
    width: width - SPACING.lg * 2,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  answerSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  userAnswer: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
  },
  correctAnswerSection: {
    marginBottom: SPACING.lg,
  },
  correctAnswer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  rankSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    textAlign: 'center',
  },
  pointsSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
  encouragementSection: {
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default AnswerFeedback;

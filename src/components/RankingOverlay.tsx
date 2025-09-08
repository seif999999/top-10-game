import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';

interface RankingOverlayProps {
  visible: boolean;
  question: any;
  submittedAnswers: string[];
  onHide?: () => void;
  isGameEnd?: boolean;
}

const RankingOverlay: React.FC<RankingOverlayProps> = ({
  visible,
  question,
  submittedAnswers,
  onHide,
  isGameEnd = false
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 2.5 seconds (unless it's game end)
      if (!isGameEnd) {
        const timer = setTimeout(() => {
          hideOverlay();
        }, 2500);

        return () => clearTimeout(timer);
      }
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isGameEnd]);

  const hideOverlay = () => {
    if (onHide) {
      onHide();
    }
  };

  if (!visible || !question) return null;



  const getAnswerStatus = (answer: any) => {
    const isSubmitted = submittedAnswers.some(
      submitted => {
        const normalizedSubmitted = submitted.toLowerCase().trim();
        const normalizedAnswer = answer.text.toLowerCase().trim();
        const normalizedAlias = (answer.normalized || '').toLowerCase().trim();
        
        // Check exact match first
        if (normalizedSubmitted === normalizedAnswer) return true;
        if (normalizedSubmitted === normalizedAlias) return true;
        
        // Check aliases
        if (answer.aliases && Array.isArray(answer.aliases)) {
          return answer.aliases.some(alias => 
            alias.toLowerCase().trim() === normalizedSubmitted
          );
        }
        
        return false;
      }
    );
    
    if (isSubmitted) {
      return { status: 'correct', color: '#10B981' }; // Green
    } else {
      return { status: 'incorrect', color: '#EF4444' }; // Red
    }
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
                 <View style={styles.header}>
           <Text style={styles.title}>
             {isGameEnd ? '🎉 Final Rankings' : '📊 Current Rankings'}
           </Text>
           <Text style={styles.subtitle}>
             {isGameEnd ? 'Game Complete!' : question.title}
           </Text>
           {!isGameEnd && (
             <Text style={styles.progressText}>
               Found: {submittedAnswers.length}/10 answers
             </Text>
           )}
         </View>

                                   <View style={styles.rankingsContainer}>
                    {question.answers
                      .filter(answer => {
                        // For game end, show all answers. For regular overlay, only show found answers
                        if (isGameEnd) {
                          return true;
                        }
                        return submittedAnswers.some(
                          submitted => {
                            const normalizedSubmitted = submitted.toLowerCase().trim();
                            const normalizedAnswer = answer.text.toLowerCase().trim();
                            const normalizedAlias = (answer.normalized || '').toLowerCase().trim();
                            
                            // Check exact match first
                            if (normalizedSubmitted === normalizedAnswer) return true;
                            if (normalizedSubmitted === normalizedAlias) return true;
                            
                            // Check aliases
                            if (answer.aliases && Array.isArray(answer.aliases)) {
                              return answer.aliases.some(alias => 
                                alias.toLowerCase().trim() === normalizedSubmitted
                              );
                            }
                            
                            return false;
                          }
                        );
                      })
                      .sort((a, b) => a.rank - b.rank) // Sort by rank
                      .map((answer: any, index: number) => {
                        const { status, color } = getAnswerStatus(answer);
                        
                        return (
                          <View key={answer.rank} style={styles.rankingRow}>
                            <View style={styles.rankContainer}>
                              <Text style={styles.rankNumber}>#{answer.rank}</Text>
                              <Text style={styles.rankPoints}>{answer.points} pts</Text>
                            </View>
                            
                            <View style={[styles.answerContainer, { borderColor: color }]}>
                              <Text style={[styles.answerText, { color }]}>
                                {answer.text}
                              </Text>
                            </View>
                            
                            <View style={styles.statusContainer}>
                              {status === 'correct' ? (
                                <Text style={styles.correctIcon}>✅</Text>
                              ) : (
                                <Text style={styles.incorrectIcon}>❌</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                  </View>

        {isGameEnd && (
          <View style={styles.gameEndActions}>
            <Text style={styles.gameEndText}>
              Tap anywhere to continue
            </Text>
          </View>
        )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#1E1B4B', // Dark purple background
    borderRadius: 16,
    padding: SPACING.xl,
    margin: SPACING.lg,
    maxWidth: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height - 80,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
     header: {
     alignItems: 'center',
     marginBottom: SPACING.md,
   },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B5CF6', // Purple text
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0', // Light text for dark background
    textAlign: 'center',
    lineHeight: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6', // Purple text
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
     rankingsContainer: {
     gap: SPACING.xs,
   },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)', // Light purple background
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)', // Purple border
  },
  rankContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B5CF6', // Purple text
  },
  rankPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA', // Lighter purple for points
    marginTop: 2,
  },
  answerContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#E2E8F0', // Light text for dark background
  },
  statusContainer: {
    width: 40,
    alignItems: 'center',
  },
  correctIcon: {
    fontSize: 20,
  },
  incorrectIcon: {
    fontSize: 20,
  },
  gameEndActions: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  gameEndText: {
    fontSize: 14,
    color: '#A78BFA', // Light purple text
    fontStyle: 'italic',
  },
});

export default RankingOverlay;

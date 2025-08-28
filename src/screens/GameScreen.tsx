import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import Button from '../components/Button';
import AnswerFeedback from '../components/AnswerFeedback';
import ResultsModal from '../components/ResultsModal';
import { COLORS, SPACING } from '../utils/constants';
import { GameScreenProps } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { formatTime } from '../utils/gameHelpers';

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId, categoryId } = route.params;
  const { 
    gameState, 
    currentAnswer, 
    setAnswer, 
    submitAnswer, 
    nextQuestion, 
    getGameResults, 
    getCurrentQuestion, 
    getPlayerScore, 
    getGameProgress: getProgress,
    resetGame
  } = useGame();
  const { user, signOut } = useAuth();

  const [timeLeft, setTimeLeft] = useState(60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);

  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  useEffect(() => {
    if (gameState && gameState.gamePhase === 'question') {
      startTimer();
      startTimeRef.current = Date.now();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState?.currentRound]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeLeft(gameState?.timeRemaining || 60);
    setIsAnswerSubmitted(false);
    setSubmittedAnswers([]);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up, auto-submit
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (!isAnswerSubmitted && currentAnswer.trim()) {
      handleSubmitAnswer();
    } else if (!isAnswerSubmitted) {
      // No answer submitted, move to next question
      handleNextQuestion();
    }
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;
    
    // Check if this answer was already submitted
    if (submittedAnswers.includes(currentAnswer.trim().toLowerCase())) {
      Alert.alert('Duplicate Answer', 'You have already submitted this answer.');
      return;
    }
    
    // Add to submitted answers
    setSubmittedAnswers([...submittedAnswers, currentAnswer.trim().toLowerCase()]);
    
    const timeTaken = gameState?.timeRemaining || 60 - timeLeft;
    submitAnswer('You', currentAnswer, timeLeft);
    
    // Show feedback
    const currentRound = gameState?.rounds[gameState.currentRound - 1];
    if (currentRound && currentRound.playerAnswers.length > 0) {
      const lastAnswer = currentRound.playerAnswers[currentRound.playerAnswers.length - 1];
      setFeedbackData({
        isCorrect: lastAnswer.isCorrect,
        correctAnswer: currentQuestion?.answers[0]?.text,
        pointsEarned: lastAnswer.points,
        rank: lastAnswer.rank,
        userAnswer: currentAnswer
      });
      setShowFeedback(true);
    }
    
    // Clear the input for next answer
    setAnswer('');
  };

  const handleNextQuestion = () => {
    setShowFeedback(false);
    setFeedbackData(null);
    setAnswer('');
    
    if ((gameState?.currentRound || 0) >= (gameState?.totalRounds || 10)) {
      // Game finished
      setShowResults(true);
    } else {
      nextQuestion();
    }
  };

  const handleExitGame = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => {
            resetGame();
            // Go back to the previous screen
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // fallback if no previous screen exists
              navigation.navigate('Categories');
            }
          }
        }
      ]
    );
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    resetGame();
    navigation.navigate('Categories');
  };

  const handleBackToCategories = () => {
    setShowResults(false);
    resetGame();
    navigation.navigate('Categories');
  };

  const handleProfileNavigation = () => {
    navigation.navigate('Profile');
  };



  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      '🎯 How to Play TOP 10',
      '📝 READ: Read the question carefully and think about the top 10 answers\n\n✍️ ANSWER: Type your answer and submit - you can submit multiple answers!\n\n🏆 SCORE: The closer your answer is to #1, the more points you get\n\n⏱️ TIME: You have 30-90 seconds per question\n\n💡 TIP: Think broadly and submit as many relevant answers as possible!\n\nGood luck! 🍀',
      [{ text: 'Got it! 🎮' }]
    );
  };

  const handleShowGameRules = () => {
    Alert.alert(
      '📋 Game Rules',
      '🎯 OBJECTIVE: Guess the top 10 answers to each question\n\n🏆 SCORING:\n• #1 answer = 100 points\n• #2 answer = 90 points\n• #3 answer = 80 points\n• And so on...\n\n⏱️ TIMER: 30-90 seconds per question\n\n✅ MULTIPLE ANSWERS: Submit as many as you can!\n\n🎮 PROGRESS: Complete all questions to see your final score',
      [{ text: 'Understood! 👍' }]
    );
  };

  if (!gameState || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>
            Question {gameState.currentRound}/{gameState.totalRounds}
          </Text>
          <Text style={[
            styles.timer,
            timeLeft <= 10 && styles.timerWarning
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleExitGame}>
          <Text style={styles.exitButton}>Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionHint}>
            Type your answer below. The closer you are to #1, the more points you get!
          </Text>
        </View>

        {/* Answer Section */}
        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <TextInput 
            placeholder="Enter your answer..." 
            placeholderTextColor={COLORS.muted}
            value={currentAnswer} 
            onChangeText={setAnswer}
            style={styles.answerInput}
            editable={true}
          />
           <Button 
             title="Submit Answer" 
             onPress={handleSubmitAnswer}
             disabled={!currentAnswer.trim()}
             style={styles.submitButton}
           />
        </View>

                 {/* Submitted Answers Section */}
         {submittedAnswers.length > 0 && (
           <View style={styles.submittedAnswersSection}>
             <Text style={styles.submittedAnswersTitle}>Your Answers:</Text>
             {submittedAnswers.map((answer, index) => (
               <Text key={index} style={styles.submittedAnswer}>
                 • {answer}
               </Text>
             ))}
           </View>
         )}

         {/* Score Section */}
         <View style={styles.scoreSection}>
           <Text style={styles.scoreTitle}>Your Score: {getPlayerScore('You')}</Text>
         </View>

                 {/* Next Question Button */}
         {timeLeft === 0 && (
           <View style={styles.nextQuestionSection}>
             <Button 
               title={gameState.currentRound >= gameState.totalRounds ? "Finish Game" : "Next Question"}
               onPress={handleNextQuestion}
               style={styles.nextButton}
             />
           </View>
         )}
      </ScrollView>

             {/* Answer Feedback Modal */}
       <AnswerFeedback
         visible={showFeedback}
         isCorrect={feedbackData?.isCorrect || false}
         correctAnswer={feedbackData?.correctAnswer}
         pointsEarned={feedbackData?.pointsEarned}
         rank={feedbackData?.rank}
         userAnswer={feedbackData?.userAnswer || ''}
         onAnimationComplete={() => {
           // Wait 2 seconds before moving to next question
           setTimeout(() => {
             setShowFeedback(false);
             if (timeLeft === 0) {
               handleNextQuestion();
             }
           }, 2000);
         }}
       />

             {/* Results Modal */}
       <ResultsModal
         visible={showResults}
         gameResults={getGameResults()}
         onClose={() => setShowResults(false)}
         onPlayAgain={handlePlayAgain}
         onBackToCategories={handleBackToCategories}
       />


     </SafeAreaView>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  exitButton: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700'
  },
  timer: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  timerWarning: {
    color: '#dc2626',
    fontWeight: '700'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.md
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4
  },
  progressText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  questionSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  questionHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center'
  },
  answerSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md
  },
  answerLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  answerInput: {
    marginBottom: SPACING.sm
  },
  submitButton: {
    marginTop: SPACING.sm
  },
  scoreSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  scoreTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800'
  },
  nextQuestionSection: {
    marginBottom: SPACING.xl
  },
  nextButton: {
    backgroundColor: '#10B981'
  },
  submittedAnswersSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.sm
  },
  submittedAnswersTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm
  },
  submittedAnswer: {
    color: COLORS.text,
    fontSize: 14,
    paddingLeft: SPACING.sm
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm
  },
  profileButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700'
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

});

export default GameScreen;



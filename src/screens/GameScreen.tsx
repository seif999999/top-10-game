import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, Platform } from 'react-native';
import Button from '../components/Button';
import ResultsModal from '../components/ResultsModal';
import { COLORS, SPACING } from '../utils/constants';
import { GameScreenProps } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

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
    isQuestionComplete,
    getCorrectAnswersFound,
    resetGame,
    startGame
  } = useGame();
  const { user, signOut } = useAuth();

  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  const [showQuestionComplete, setShowQuestionComplete] = useState(false);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const currentScore = getPlayerScore('You');
  const correctAnswersFound = getCorrectAnswersFound();
  const questionIsComplete = isQuestionComplete();
  
  // Initialize game if not already started
  useEffect(() => {
    if (!gameState) {
      console.log('🎮 No game state found, starting new game...');
      // Start a new game with the category from route params
      startGame(categoryId || 'Sports', ['You']);
    }
  }, [gameState, categoryId, startGame]);

  // Check if question is complete and show success message
  useEffect(() => {
    if (questionIsComplete && !showQuestionComplete) {
      setShowQuestionComplete(true);
    }
  }, [questionIsComplete, showQuestionComplete]);

  // Helper function to check if answer is a duplicate (including aliases)
  const isDuplicateAnswer = (newAnswer: string): boolean => {
    if (!currentQuestion) return false;
    
    const normalizedNewAnswer = newAnswer.trim().toLowerCase();
    
    // Check against already submitted answers
    for (const submittedAnswer of submittedAnswers) {
      if (submittedAnswer === normalizedNewAnswer) {
        return true;
      }
    }
    
    // Check against correct answers and their aliases to prevent duplicate persons
    for (const correctAnswer of currentQuestion.answers) {
      const normalizedCorrect = correctAnswer.text.toLowerCase();
      const normalizedAliases = correctAnswer.aliases?.map(alias => alias.toLowerCase()) || [];
      
      // Check if this answer matches any already submitted correct answer
      if (normalizedNewAnswer === normalizedCorrect || normalizedAliases.includes(normalizedNewAnswer)) {
        // Check if this person was already submitted
        for (const submittedAnswer of submittedAnswers) {
          if (submittedAnswer === normalizedCorrect || normalizedAliases.includes(submittedAnswer)) {
            return true; // This person was already submitted
          }
        }
      }
    }
    
    return false;
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) return;
    
    // Check if question is already complete
    if (questionIsComplete) {
      Alert.alert('Question Complete', 'You have already found all 10 correct answers for this question!');
      return;
    }
    
    // Check if this answer was already submitted (including aliases)
    if (isDuplicateAnswer(currentAnswer)) {
      Alert.alert('Duplicate Answer', 'You have already submitted this person/answer.');
      return;
    }
    
    // Add to submitted answers
    setSubmittedAnswers([...submittedAnswers, currentAnswer.trim().toLowerCase()]);
    
    submitAnswer('You', currentAnswer);
    
    // Clear the input for next answer
    setAnswer('');
  };

  const handleNextQuestion = () => {
    setShowQuestionComplete(false);
    setAnswer('');
    setSubmittedAnswers([]);
    
    // Always go to next question immediately, no questions asked
    nextQuestion();
  };

  const handleExitGame = () => {
    // Check if running on web first
    if (Platform.OS === 'web') {
      // For web, always navigate to categories
      resetGame();
      navigation.navigate('Categories');
    } else {
      // For mobile, show confirmation dialog
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
              // For mobile, use the same way the back button is used
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
    }
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
      '📝 READ: Read the question carefully and think about the top 10 answers\n\n✍️ ANSWER: Type your answer and submit - you can submit multiple answers!\n\n🏆 SCORE: The closer your answer is to #1, the more points you get\n\n💡 TIP: Think broadly and submit as many relevant answers as possible!\n\nFind all 10 correct answers to complete each question!\n\nGood luck! 🍀',
      [{ text: 'Got it! 🎮' }]
    );
  };

  const handleShowGameRules = () => {
    Alert.alert(
      '📋 Game Rules',
      '🎯 OBJECTIVE: Guess the top 10 answers to each question\n\n🏆 SCORING:\n• #1 answer = 1 point\n• #2 answer = 2 points\n• #3 answer = 3 points\n• And so on...\n\n✅ MULTIPLE ANSWERS: Submit as many as you can!\n\n🎮 PROGRESS: Find all 10 correct answers to complete each question',
      [{ text: 'Understood! ��' }]
    );
  };

  const handleShowAnswerRules = () => {
    Alert.alert(
      '📝 Answer Acceptance Rules',
      '✅ ANSWERS ARE ACCEPTED IF:\n\n• Exact match (perfect spelling)\n• Close match (75%+ similarity)\n• Probable match (65%+ similarity)\n• Close match (55%+ similarity)\n\n💡 TIPS FOR BETTER MATCHING:\n• Don\'t worry about perfect spelling\n• Common typos are usually accepted\n• Articles (the, a, an) are ignored\n• Punctuation is ignored\n• Case doesn\'t matter\n\n🎯 The system is very forgiving for typos!',
      [{ text: 'Got it! 🎮' }]
    );
  };

  if (!gameState || !currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
          <Text style={styles.loadingText}>Game State: {gameState ? 'exists' : 'null'}</Text>
          <Text style={styles.loadingText}>Question: {currentQuestion ? 'exists' : 'null'}</Text>
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
          <Text style={styles.answersProgress}>
            {correctAnswersFound}/10 answers found
          </Text>
        </View>
        <TouchableOpacity onPress={handleExitGame}>
          <Text style={styles.exitButton}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          <Text style={styles.questionHint}>
            Type your answer below. The closer you are to #1, the more points you get!
          </Text>
          <TouchableOpacity onPress={handleShowAnswerRules} style={styles.helpButton}>
            <Text style={styles.helpButtonText}>ℹ️ Answer Rules</Text>
          </TouchableOpacity>
        </View>

        {/* Question Complete Success Message */}
        {showQuestionComplete && (
          <View style={styles.successSection}>
            <Text style={styles.successTitle}>🎉 Question Complete!</Text>
            <Text style={styles.successMessage}>
              You found all 10 correct answers for this question!
            </Text>
            <Button 
              title="Next Question"
              onPress={handleNextQuestion}
              style={styles.nextButton}
            />
          </View>
        )}

        {/* Answer Section - Only show if question is not complete */}
        {!questionIsComplete && (
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
        )}

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
          <Text style={styles.scoreTitle}>Your Score: {currentScore}</Text>
        </View>
      </ScrollView>

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
  answersProgress: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4
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
  successSection: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  successTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  successMessage: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.lg
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
  nextButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'white'
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
  helpButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center'
  },
  helpButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default GameScreen;



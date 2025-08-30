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
    startGame,
    endGame
  } = useGame();
  const { user } = useAuth();

  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  const [showQuestionComplete, setShowQuestionComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();
  const currentScore = getPlayerScore('You');
  const correctAnswersFound = getCorrectAnswersFound();
  const questionIsComplete = isQuestionComplete();
  
  // Get submitted answers for the current round
  const getCurrentRoundAnswers = () => {
    if (!gameState || !gameState.rounds[gameState.currentRound - 1]) return [];
    return gameState.rounds[gameState.currentRound - 1].playerAnswers
      .filter(answer => answer.playerId === 'You')
      .map(answer => answer.answer);
  };
  
  const currentRoundAnswers = getCurrentRoundAnswers();

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
      setTimeout(() => {
        setShowQuestionComplete(false);
      }, 3000);
    }
  }, [questionIsComplete, showQuestionComplete]);

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
            navigation.navigate('Categories');
          }
        }
      ]
    );
  };

  const handleEndGame = () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end the game? You\'ll see your final results.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Game', 
          style: 'destructive', 
          onPress: () => {
            endGame();
            setShowResults(true);
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
      [{ text: 'Understood! 🎮' }]
    );
  };

  const handleShowAnswerRules = () => {
    Alert.alert(
      '📝 Answer Rules',
      '✅ CORRECT: Exact matches get full points\n\n🔍 SIMILAR: Close matches get partial credit\n\n❌ WRONG: Incorrect answers get 0 points\n\n💡 TIP: Try different variations and synonyms!',
      [{ text: 'Got it! ✍️' }]
    );
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    try {
      submitAnswer('You', currentAnswer.trim());
      setSubmittedAnswers(prev => [...prev, currentAnswer.trim()]);
      setAnswer('');
      setIsAnswerSubmitted(true);
      
      setTimeout(() => {
        setIsAnswerSubmitted(false);
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (gameState && gameState.currentRound >= gameState.totalRounds) {
      // Game finished, show results
      setShowResults(true);
    } else {
      nextQuestion();
    }
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
          <Text style={styles.answersProgress}>
            {correctAnswersFound}/10 answers found
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleEndGame} style={styles.endGameButton}>
            <Text style={styles.endGameButtonText}>End Game</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExitGame} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
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

        {/* Results Phase - Show when game is finished */}
        {gameState?.gamePhase === 'finished' && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>🎉 Game Complete!</Text>
            <Text style={styles.resultsSubtitle}>Final Score: {currentScore} points</Text>
            
            {/* Toggle Button for Show/Hide Answers */}
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={() => setShowAnswers(!showAnswers)}
            >
              <Text style={styles.toggleButtonText}>
                {showAnswers ? '🙈 Hide Answers' : '👁️ Show Answers'}
              </Text>
            </TouchableOpacity>

            {/* Answers List - Only show when toggle is on */}
            {showAnswers && currentQuestion && (
              <View style={styles.answersList}>
                <Text style={styles.answersListTitle}>All Correct Answers:</Text>
                {currentQuestion.answers.map((answer, index) => {
                  const isCorrect = currentRoundAnswers.some(submitted => 
                    submitted.toLowerCase().trim() === answer.text.toLowerCase().trim()
                  );
                  
                  return (
                    <View key={index} style={[
                      styles.answerItem,
                      isCorrect ? styles.correctAnswer : styles.missedAnswer
                    ]}>
                      <Text style={styles.answerRank}>#{answer.rank}</Text>
                      <Text style={styles.answerText}>{answer.text}</Text>
                      <Text style={styles.answerPoints}>{answer.points} pts</Text>
                      {isCorrect && <Text style={styles.correctIndicator}>✅</Text>}
                      {!isCorrect && <Text style={styles.missedIndicator}>❌</Text>}
                    </View>
                  );
                })}
              </View>
            )}
            
            {/* Play Again Button */}
            <Button 
              title="🎮 Play Again" 
              onPress={handlePlayAgain}
              style={styles.playAgainButton}
            />
          </View>
        )}

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

        {/* Answer Section - Only show if question is not complete AND game is not finished */}
        {!questionIsComplete && gameState?.gamePhase !== 'finished' && (
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: '#dc2626'
  },
  exitButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  endGameButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: '#3b82f6'
  },
  endGameButtonText: {
    color: '#3b82f6',
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
  },
  resultsSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  resultsSubtitle: {
    color: COLORS.muted,
    fontSize: 18,
    marginBottom: SPACING.lg
  },
  toggleButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center'
  },
  toggleButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600'
  },
  answersList: {
    width: '100%',
    marginTop: SPACING.md,
    gap: SPACING.sm
  },
  answersListTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: SPACING.sm
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.card
  },
  answerRank: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700'
  },
  answerText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500'
  },
  answerPoints: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700'
  },
  correctAnswer: {
    backgroundColor: '#E0F2F7', // Light blue background for correct
    borderColor: '#57B846',
    borderWidth: 1
  },
  missedAnswer: {
    backgroundColor: '#FDECEC', // Light red background for missed
    borderColor: '#DC2626',
    borderWidth: 1
  },
  correctIndicator: {
    color: '#57B846',
    fontSize: 20,
    marginLeft: SPACING.sm
  },
  missedIndicator: {
    color: '#DC2626',
    fontSize: 20,
    marginLeft: SPACING.sm
  },
  playAgainButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary
  }
});

export default GameScreen;



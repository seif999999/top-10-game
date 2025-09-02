import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, Platform, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import ResultsModal from '../components/ResultsModal';
import MultiplayerLeaderboard from '../components/MultiplayerLeaderboard';
import RankingOverlay from '../components/RankingOverlay';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../utils/constants';
import { GameScreenProps } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { QuestionAnswer } from '../types';
import { FEATURES } from '../config/featureFlags';
import HostAssignModal from '../components/HostAssignModal';




const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId, categoryId, isMultiplayer, selectedQuestion, teamConfig } = route.params;
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
    endGame,
    // Team mode functions
    startTeamsGame,
    assignAnswerToTeam,
    endTeamTurn,
    setTeamTimer,
    resetTeamsGame,
    getCurrentTeam,
    getTeamScore,
    getAssignedAnswersCount,
    teamGameState,
    isTeamMode
  } = useGame();
  const { user } = useAuth();
  
  // Multiplayer context
  const {
    state: multiplayerState,
    joinRoom,
    startGame: startMultiplayerGame,
    submitAnswer: submitMultiplayerAnswer,
    nextQuestion: nextMultiplayerQuestion,
    endGame: endMultiplayerGame,
    leaveRoom,
    setCurrentAnswer: setMultiplayerAnswer,
    resetMultiplayer,
    forceDisconnect,
    getPlayerScore: getMultiplayerScore,
    getLeaderboard,
    isQuestionComplete: isMultiplayerQuestionComplete,
    getCorrectAnswersFound: getMultiplayerCorrectAnswersFound
  } = useMultiplayer();

  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  const [showQuestionComplete, setShowQuestionComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showRankingOverlay, setShowRankingOverlay] = useState(false);
  const [showGameEndRanking, setShowGameEndRanking] = useState(false);
  
  // Team mode state
  const [showHostAssignModal, setShowHostAssignModal] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>(-1);
  const [selectedAnswer, setSelectedAnswer] = useState<QuestionAnswer | null>(null);
  
  // Animation values
  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const answerInputGlow = useRef(new Animated.Value(0)).current;
  const [lastAnswerResult, setLastAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
 
  

  // Determine if we're in multiplayer mode
  const isMultiplayerMode = isMultiplayer === true;
  
  // Get current game state based on mode
  const currentQuestion = isMultiplayerMode 
    ? multiplayerState.gameState?.currentQuestion 
    : getCurrentQuestion();
  const progress = isMultiplayerMode 
    ? { current: multiplayerState.gameState?.currentRound || 1, total: multiplayerState.gameState?.totalRounds || 3 }
    : getProgress();
  
  // Progress is now always an object
  const gameProgress = progress;
  const currentScore = isMultiplayerMode 
    ? getMultiplayerScore(multiplayerState.playerId || '')
    : getPlayerScore('You');
  const correctAnswersFound = isMultiplayerMode 
    ? getMultiplayerCorrectAnswersFound()
    : getCorrectAnswersFound();
  const questionIsComplete = isMultiplayerMode 
    ? isMultiplayerQuestionComplete()
    : isQuestionComplete();
  
  // Get submitted answers for the current round
  const getCurrentRoundAnswers = () => {
    if (isMultiplayerMode) {
      return multiplayerState.submittedAnswers || [];
    }
    if (!gameState || !gameState.rounds[gameState.currentRound - 1]) return [];
    const currentRound = gameState.rounds[gameState.currentRound - 1];
    if (!currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) return [];
    return currentRound.playerAnswers
      .filter(answer => answer.playerId === 'You')
      .map(answer => answer.answer);
  };
  
  const currentRoundAnswers = getCurrentRoundAnswers();

  // Initialize game based on mode
  useEffect(() => {
    console.log('🎮 GameScreen useEffect - Debug Info:', {
      isMultiplayerMode,
      roomId,
      categoryId,
      hasGameState: !!gameState,
      hasMultiplayerState: !!multiplayerState.roomId,
      currentGameCategory: gameState?.category
    });
    
    if (isMultiplayerMode) {
      // Initialize multiplayer game
      const shouldStartNewMultiplayerGame = !multiplayerState.roomId || 
        (multiplayerState.gameState && multiplayerState.gameState.categoryId !== categoryId);
      
      if (shouldStartNewMultiplayerGame && roomId !== 'single-player') {
        console.log('🎮 Starting new multiplayer game...');
        console.log('🎮 Previous category:', multiplayerState.gameState?.categoryId);
        console.log('🎮 New category:', categoryId);
        
        // Reset any existing multiplayer game first
        if (multiplayerState.roomId) {
          resetMultiplayer();
        }
        
        const playerName = user?.displayName || user?.email || 'Player';
        const playerId = user?.email || `player_${Date.now()}`;
        joinRoom(roomId, playerId, playerName, categoryId || 'Sports');
      }
    } else {
      // Initialize single-player game
      const shouldStartNewGame = !gameState || gameState.category !== categoryId;
      
      if (shouldStartNewGame) {
                 console.log('🎮 Starting new single-player game...');
         console.log('🎮 Previous category:', gameState?.category);
         console.log('🎮 New category:', categoryId);
         console.log('🎮 Selected question:', selectedQuestion?.title || 'None');
         console.log('🎮 Team config:', teamConfig ? 'YES' : 'NO');
         
         // Reset any existing game first
         if (gameState) {
           resetGame();
           setShowRankingOverlay(false);
           setShowGameEndRanking(false);
         }

         // Check if this is a team mode game
         if (teamConfig) {
           console.log('🎮 Starting team mode game with config:', teamConfig);
           startTeamsGame(categoryId || 'Sports', teamConfig, selectedQuestion);
         } else {
           // Regular single player mode
           startGame(categoryId || 'Sports', ['You'], selectedQuestion);
         }
      }
    }
  }, [isMultiplayerMode, multiplayerState.roomId, gameState, roomId, categoryId, startGame, startTeamsGame, joinRoom, user, resetGame, teamConfig, selectedQuestion]);

  // Team mode timer effect - Only run in single-player mode
  useEffect(() => {
    if (!isMultiplayerMode && isTeamMode && teamGameState && teamGameState.isTurnActive && teamGameState.roundTimerSeconds > 0) {
      const timer = setInterval(() => {
        if (teamGameState.timeRemaining > 0) {
          setTeamTimer(teamGameState.timeRemaining - 1);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMultiplayerMode, isTeamMode, teamGameState, setTeamTimer]);

  // Check if question is complete and show success message
  useEffect(() => {
    if (questionIsComplete && !showQuestionComplete) {
      setShowQuestionComplete(true);
      setTimeout(() => {
        setShowQuestionComplete(false);
      }, 3000);
    }
  }, [questionIsComplete, showQuestionComplete]);

  // Check if game is finished and show results
  useEffect(() => {
    if (gameState?.gamePhase === 'finished' && !showResults) {
      console.log('🎉 Game finished! Showing results...');
      setShowGameEndRanking(true);
      setShowResults(true);
    }
  }, [gameState?.gamePhase, showResults]);

  // Cleanup game state when screen loses focus (user navigates away)
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      console.log('🎮 GameScreen focused');
      
      // Return cleanup function that runs when screen loses focus
      return () => {
        console.log('🎮 GameScreen unfocused - cleaning up single-player game state');
        // Only reset single-player game state, not multiplayer
        if (!isMultiplayerMode) {
          console.log('🎮 Resetting single-player game state on navigation away');
          resetGame();
        }
      };
    }, [isMultiplayerMode, resetGame])
  );

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
                       if (isMultiplayerMode) {
                         leaveRoom();
                         forceDisconnect();
                       } else {
                         resetGame();
                       }
                       navigation.navigate('MainMenu');
                     }
        }
      ]
    );
  };
  
  
  
  

  

const handleEndGame = () => {
  if (Platform.OS === 'web') {
    // Web version
    const confirmed = window.confirm(
      "Are you sure you want to end the game? You'll see your final results."
    );
    if (confirmed) {
      if (isMultiplayerMode) {
        endMultiplayerGame();
      } else {
        endGame();
      }
      setShowResults(true);
    }
  } else {
    // Mobile version
    Alert.alert(
      'End Game',
      "Are you sure you want to end the game? You'll see your final results.",
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Game', 
          style: 'destructive', 
          onPress: () => {
            if (isMultiplayerMode) {
              endMultiplayerGame();
            } else {
              endGame();
            }
            setShowResults(true);
          }
        }
      ]
    );
  }
};


           const handlePlayAgain = () => {
      setShowResults(false);
      setShowGameEndRanking(false);
      if (isMultiplayerMode) {
        forceDisconnect();
      } else {
        resetGame();
      }
      navigation.navigate('MainMenu');
    };

           const handleBackToCategories = () => {
      setShowResults(false);
      setShowGameEndRanking(false);
      if (isMultiplayerMode) {
        forceDisconnect();
      } else {
        resetGame();
      }
      navigation.navigate('MainMenu');
    };

  const handleBackButton = () => {
    console.log('🎮 Back button pressed - resetting single-player game state');
    // Reset single-player game state when back button is pressed
    if (!isMultiplayerMode) {
      resetGame();
    }
    navigation.goBack();
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



    const handleSubmitAnswer = async () => {
    const answerToSubmit = isMultiplayerMode ? multiplayerState.currentAnswer : currentAnswer;
    console.log('🎮 handleSubmitAnswer called:', {
      isMultiplayerMode,
      answerToSubmit,
      multiplayerStateCurrentAnswer: multiplayerState.currentAnswer,
      currentAnswer
    });
    
    if (!answerToSubmit.trim()) {
      console.log('❌ No answer to submit');
      return;
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(submitButtonScale, {
        toValue: 0.95,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(submitButtonScale, {
        toValue: 1,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      })
    ]).start();

    try {
      if (isMultiplayerMode) {
        console.log('📝 Submitting multiplayer answer:', answerToSubmit.trim());
        submitMultiplayerAnswer(answerToSubmit.trim());
        setMultiplayerAnswer('');
      } else {
        console.log('📝 Submitting single-player answer:', answerToSubmit.trim());
        console.log('📝 Before submission - Score:', getPlayerScore('You'));
        submitAnswer('You', answerToSubmit.trim());
        console.log('📝 After submission - Score:', getPlayerScore('You'));
        setAnswer('');
      }
      
      setSubmittedAnswers(prev => [...prev, answerToSubmit.trim()]);
      setIsAnswerSubmitted(true);
      
      // Determine answer result and show feedback
      const isCorrect = checkAnswerCorrectness(answerToSubmit.trim());
      setLastAnswerResult(isCorrect ? 'correct' : 'incorrect');
      
      // Animate answer input based on result
      Animated.timing(answerInputGlow, {
        toValue: isCorrect ? 1 : -1,
        duration: ANIMATIONS.duration.normal,
        useNativeDriver: false,
      }).start();
      
      // Show ranking overlay after correct answer
      if (isCorrect) {
        setShowRankingOverlay(true);
      }
      
      // Reset feedback after delay
      setTimeout(() => {
        setIsAnswerSubmitted(false);
        setLastAnswerResult(null);
        Animated.timing(answerInputGlow, {
          toValue: 0,
          duration: ANIMATIONS.duration.normal,
          useNativeDriver: false,
        }).start();
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    if (isMultiplayerMode) {
      if (multiplayerState.gameState && multiplayerState.gameState.currentRound >= multiplayerState.gameState.totalRounds) {
        // Game finished, show results
        setShowResults(true);
      } else {
        nextMultiplayerQuestion();
      }
    } else {
      if (gameState && gameState.currentRound >= gameState.totalRounds) {
        // Game finished, show results
        setShowResults(true);
      } else {
        nextQuestion();
      }
    }
  };

  // Helper function to check if an answer is correct
  const checkAnswerCorrectness = (answer: string): boolean => {
    if (!currentQuestion?.answers) return false;
    
    const normalizedAnswer = answer.toLowerCase().trim();
    return currentQuestion.answers.some((correctAnswer: any) => 
      correctAnswer.text.toLowerCase().trim() === normalizedAnswer ||
      correctAnswer.normalized?.toLowerCase().trim() === normalizedAnswer ||
      correctAnswer.aliases?.some((alias: string) => alias.toLowerCase().trim() === normalizedAnswer)
    );
  };

  console.log('🎮 GameScreen render state:', {
    isMultiplayerMode,
    gameState: gameState ? 'exists' : 'null',
    multiplayerState: multiplayerState.gameState ? 'exists' : 'null',
    currentQuestion: currentQuestion ? 'exists' : 'null',
    gamePhase: multiplayerState.gameState?.gamePhase,
    currentScore,
    correctAnswersFound,
    gameProgress
  });

  if ((!isMultiplayerMode && (!gameState || !currentQuestion)) || 
      (isMultiplayerMode && (!multiplayerState.gameState || !currentQuestion))) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isMultiplayerMode ? 'Connecting to multiplayer game...' : 'Loading game...'}
          </Text>
          {isMultiplayerMode && (
            <Text style={styles.connectionStatus}>
              Status: {multiplayerState.connectionStatus}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
             {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
           <View style={styles.backButtonIcon}>
             <Text style={styles.backButtonArrow}>‹</Text>
           </View>
           <Text style={styles.backButtonText}>Back</Text>
         </TouchableOpacity>
         

        <View style={styles.headerCenter}>
          {isMultiplayerMode && (
            <Text style={styles.multiplayerIndicator}>
              👥 Multiplayer
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleExitGame} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Multiplayer Leaderboard */}
        {isMultiplayerMode && (
          <>
            <MultiplayerLeaderboard
              leaderboard={getLeaderboard()}
              currentPlayerId={multiplayerState.playerId || ''}
              maxHeight={150}
            />
            
            {/* Start Game Button for Multiplayer */}
            {multiplayerState.gameState?.gamePhase === 'lobby' && (
              <View style={styles.startGameSection}>
                <Text style={styles.startGameTitle}>
                  Waiting for players... ({multiplayerState.gameState?.players?.length || 0} joined)
                </Text>
                <Button 
                  title="🎮 Start Game" 
                  onPress={() => {
                    console.log('🎮 Manual start game pressed');
                    startMultiplayerGame();
                  }}
                  style={styles.startGameButton}
                />
              </View>
            )}
          </>
        )}



        {/* Question Section */}
        {currentQuestion && (
          <View style={styles.questionSection}>
            <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
            <Text style={styles.gameplayHint}>
              {!isMultiplayerMode && isTeamMode 
                ? "🎯 Host assigns answers to teams by tapping them" 
                : "💡 Find the top 10 answers ranked from best to worst"
              }
            </Text>

          </View>
        )}

        {/* Timer - Only show in team mode */}
        {!isMultiplayerMode && isTeamMode && teamGameState && (
          <View style={styles.timerSection}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                {teamGameState.roundTimerSeconds === 0 ? '∞' : `${teamGameState.timeRemaining}s`}
              </Text>
            </View>
          </View>
        )}

        {/* Answer Table - Shows all possible answers with positions */}
        {currentQuestion && currentQuestion.answers && (
          <View style={styles.answerTableSection}>
            <View style={styles.answerTableHeader}>
              <Text style={styles.answerTableTitle}>All Possible Answers</Text>
            </View>
            <View style={styles.answerTableContainer}>
                             {currentQuestion.answers.map((answer: QuestionAnswer, index: number) => {
                 // Determine if this answer should be revealed
                 let isRevealed = false;
                 let assignedTeam = null;
                 let assignedPoints = 0;
                 
                 if (!isMultiplayerMode && isTeamMode) {
                   // In team mode, all answers are always visible to host
                   isRevealed = true;
                   // Check if answer has been assigned to any team
                   const assignment = teamGameState?.answerAssignments?.[index];
                   if (assignment) {
                     assignedTeam = teamGameState?.teams.find(t => t.id === assignment.teamId);
                     assignedPoints = assignment.points;
                   }
                 } else {
                   // Regular mode - check if answer matches submitted answers
                   isRevealed = (getCurrentRoundAnswers() || []).some((submitted: string) => {
                     const normalizedSubmitted = submitted.toLowerCase().trim();
                     return (
                       answer.text.toLowerCase().trim() === normalizedSubmitted ||
                       answer.normalized?.toLowerCase().trim() === normalizedSubmitted ||
                       answer.aliases?.some(alias => alias.toLowerCase().trim() === normalizedSubmitted)
                     );
                   });
                 }
                 
                 return (
                   <TouchableOpacity 
                     key={index} 
                     style={[
                       styles.answerTableRow,
                       assignedTeam && styles.assignedAnswerRow,
                       !isMultiplayerMode && isTeamMode && !assignedTeam && styles.unassignedAnswerRow
                     ]}
                     onPress={() => {
                       // In team mode, allow host to assign unassigned answers
                       if (!isMultiplayerMode && isTeamMode && !assignedTeam) {
                         setSelectedAnswerIndex(index);
                         setSelectedAnswer(answer);
                         setShowHostAssignModal(true);
                       }
                     }}
                     disabled={isMultiplayerMode || (isTeamMode && !!assignedTeam)}
                   >
                     <View style={styles.positionColumn}>
                       <Text style={styles.positionNumber}>{answer.rank}</Text>
                     </View>
                     <View style={styles.answerColumn}>
                       <Text style={styles.answerTableText}>
                         {isRevealed ? answer.text : '🔒'}
                       </Text>
                       {isRevealed && assignedTeam && (
                         <Text style={[styles.teamBadge, { color: assignedTeam.color }]}>
                           {assignedTeam.name} (+{assignedPoints})
                         </Text>
                       )}
                     </View>
                   </TouchableOpacity>
                 );
               })}
            </View>

          </View>
        )}

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
            {showAnswers && currentQuestion && currentQuestion.answers && (
              <View style={styles.answersList}>
                <Text style={styles.answersListTitle}>All Correct Answers:</Text>
                {currentQuestion.answers.map((answer: { text: string; rank: number; points: number }, index: number) => {
                  const isCorrect = (currentRoundAnswers || []).some(submitted => 
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
                      {!isCorrect && <Text style={styles.missedAnswer}>❌</Text>}
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

        {/* Answer Section - Only show if question is not complete AND game is not finished AND not in team mode */}
        {!questionIsComplete && 
         ((isMultiplayerMode && multiplayerState.gameState?.gamePhase !== 'finished') ||
          (!isMultiplayerMode && gameState?.gamePhase !== 'finished')) && 
         !(!isMultiplayerMode && isTeamMode) && (
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Your Answer:</Text>
                         <Animated.View style={[
               styles.answerInputContainer,
               {
                 shadowColor: lastAnswerResult === 'correct' ? COLORS.success : 
                              lastAnswerResult === 'incorrect' ? COLORS.error : COLORS.muted,
                 shadowOpacity: answerInputGlow.interpolate({
                   inputRange: [-1, 0, 1],
                   outputRange: [0.6, 0.1, 0.6]
                 }),
                 shadowRadius: answerInputGlow.interpolate({
                   inputRange: [-1, 0, 1],
                   outputRange: [20, 8, 20]
                 }),
                 borderColor: answerInputGlow.interpolate({
                   inputRange: [-1, 0, 1],
                   outputRange: [COLORS.error, COLORS.muted, COLORS.success]
                 })
               }
             ]}>
               <TextInput 
                 placeholder="Enter your answer..." 
                 placeholderTextColor={COLORS.muted}
                 value={isMultiplayerMode ? multiplayerState.currentAnswer : currentAnswer} 
                 onChangeText={isMultiplayerMode ? setMultiplayerAnswer : setAnswer}
                 style={styles.answerInput}
                 editable={true}
               />
             </Animated.View>
             
             <Animated.View style={{ transform: [{ scale: submitButtonScale }] }}>
               <Button 
                 title="Submit Answer" 
                 onPress={handleSubmitAnswer}
                 disabled={!(isMultiplayerMode ? multiplayerState.currentAnswer : currentAnswer).trim()}
                 style={styles.submitButton}
               />
             </Animated.View>
             
             {/* Answer Feedback Indicator */}
             {lastAnswerResult && (
               <Animated.View 
                 style={[
                   styles.feedbackIndicator,
                   {
                     backgroundColor: lastAnswerResult === 'correct' ? COLORS.successGlow : COLORS.errorGlow,
                     borderColor: lastAnswerResult === 'correct' ? COLORS.success : COLORS.error,
                     opacity: answerInputGlow.interpolate({
                       inputRange: [-1, 0, 1],
                       outputRange: [1, 0, 1]
                     })
                   }
                 ]}
               >
                 <Text style={[
                   styles.feedbackText,
                   { color: lastAnswerResult === 'correct' ? COLORS.success : COLORS.error }
                 ]}>
                   {lastAnswerResult === 'correct' ? '✅ Correct!' : '❌ Try Again!'}
                 </Text>
               </Animated.View>
             )}
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

        {/* Score Section - Only show in multiplayer mode */}
        {isMultiplayerMode && (
          <View style={styles.scoreSection}>
            <Text style={styles.scoreTitle}>Your Score: {currentScore}</Text>
          </View>
        )}
      </ScrollView>

             {/* Results Modal */}
       <ResultsModal
         visible={showResults}
         gameResults={getGameResults()}
         onClose={() => setShowResults(false)}
         onPlayAgain={handlePlayAgain}
         onBackToCategories={handleBackToCategories}
       />
       
       

       {/* Ranking Overlay - Shows after each correct answer */}
       {showRankingOverlay && (
         <TouchableOpacity
           style={styles.fullScreenTouchable}
           activeOpacity={1}
           onPress={() => setShowRankingOverlay(false)}
         >
           <RankingOverlay
             visible={showRankingOverlay}
             question={currentQuestion}
             submittedAnswers={getCurrentRoundAnswers()}
             onHide={() => setShowRankingOverlay(false)}
             isGameEnd={false}
           />
         </TouchableOpacity>
       )}

       {/* Game End Ranking Overlay - Shows at game completion */}
       {showGameEndRanking && (
         <TouchableOpacity
           style={styles.fullScreenTouchable}
           activeOpacity={1}
           onPress={() => setShowGameEndRanking(false)}
         >
           <RankingOverlay
             visible={showGameEndRanking}
             question={currentQuestion}
             submittedAnswers={getCurrentRoundAnswers()}
             onHide={() => setShowGameEndRanking(false)}
             isGameEnd={true}
           />
         </TouchableOpacity>
       )}

               {/* Team Mode UI - Only show in single-player mode */}
        {!isMultiplayerMode && isTeamMode && teamGameState && (
          <>
            {/* Team Leaderboard */}
            <View style={styles.teamLeaderboard}>
              <Text style={styles.leaderboardTitle}>Team Scores</Text>
              <View style={styles.teamsContainer}>
                {teamGameState.teams.map((team, index) => (
                  <View 
                    key={team.id} 
                    style={[
                      styles.teamCard,
                      index === teamGameState.currentTeamIndex && styles.activeTeamCard
                    ]}
                  >
                    <View style={[styles.teamColorIndicator, { backgroundColor: team.color }]} />
                    <Text style={[
                      styles.teamCardName,
                      index === teamGameState.currentTeamIndex && styles.activeTeamText
                    ]}>
                      {team.name}
                    </Text>
                    <Text style={[
                      styles.teamCardScore,
                      index === teamGameState.currentTeamIndex && styles.activeTeamText
                    ]}>
                      {team.score}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Current Team Indicator */}
            <View style={styles.teamIndicator}>
              <Text style={styles.currentTeamLabel}>Current Turn:</Text>
              <View style={[styles.teamColorIndicator, { backgroundColor: getCurrentTeam()?.color }]} />
              <Text style={styles.teamName}>{getCurrentTeam()?.name}</Text>
            </View>



           {/* Turn Controls */}
           <View style={styles.turnControls}>
             <TouchableOpacity style={styles.endTurnButton} onPress={endTeamTurn}>
               <Text style={styles.endTurnButtonText}>End Turn</Text>
             </TouchableOpacity>
           </View>
         </>
       )}

               {/* Host Assign Modal - Only show in single-player mode */}
        {!isMultiplayerMode && selectedAnswer && (
          <HostAssignModal
            visible={showHostAssignModal}
            onClose={() => setShowHostAssignModal(false)}
            onAssign={(teamId, points) => {
              if (selectedAnswerIndex >= 0 && selectedAnswer) {
                const team = teamGameState?.teams.find(t => t.id === teamId);
                console.log(`🎯 Assigning "${selectedAnswer.text}" to ${team?.name} for ${points} points`);
                
                assignAnswerToTeam(selectedAnswerIndex, teamId, points);
                setShowHostAssignModal(false);
                setSelectedAnswerIndex(-1);
                setSelectedAnswer(null);
                
                // Show success feedback
                Alert.alert(
                  '✅ Answer Assigned!',
                  `"${selectedAnswer.text}" assigned to ${team?.name} (+${points} points)`,
                  [{ text: 'OK' }]
                );
              }
            }}
            answer={selectedAnswer}
            answerIndex={selectedAnswerIndex}
            teams={teamGameState?.teams || []}
            currentTeamIndex={teamGameState?.currentTeamIndex || 0}
          />
        )}
     </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A' // Dark blue background like home screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A'
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600'
  },
  connectionStatus: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: SPACING.sm,
    fontWeight: '500'
  },
     header: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     backgroundColor: '#0F172A',
     borderBottomWidth: 1,
     borderBottomColor: '#334155'
   },
   backButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     borderRadius: 25,
     backgroundColor: 'rgba(139, 92, 246, 0.08)',
     borderWidth: 1.5,
     borderColor: 'rgba(139, 92, 246, 0.3)',
     shadowColor: '#8B5CF6',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   backButtonIcon: {
     width: 24,
     height: 24,
     borderRadius: 12,
     backgroundColor: 'rgba(139, 92, 246, 0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: SPACING.xs,
   },
   backButtonArrow: {
     color: '#8B5CF6',
     fontSize: 18,
           fontWeight: '700',
     lineHeight: 20,
   },
   backButtonText: {
     color: '#8B5CF6',
     fontSize: 14,
           fontWeight: '600',
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     letterSpacing: 0.3,
   },
  exitButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#DC2626'
  },
  exitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

     title: {
     color: '#E2E8F0',
     fontSize: 18,
           fontWeight: '700',
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     letterSpacing: 0.5
   },
     answersProgress: {
     color: '#E2E8F0',
     fontSize: 14,
           fontWeight: '600',
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     marginTop: 4,
     letterSpacing: 0.3
   },
  multiplayerIndicator: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: '#0F172A'
  },
  questionSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  questionTitle: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.md,
    textAlign: 'center',
    lineHeight: 28
  },
  questionHint: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  },
  gameplayHint: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  successSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  successTitle: {
    color: '#F1F5F9',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  successMessage: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24
  },
  answerSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#334155'
  },
  answerLabel: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
     answerInputContainer: {
     marginBottom: SPACING.sm,
     borderRadius: 12,
     borderWidth: 2,
     shadowOffset: { width: 0, height: 0 },
     elevation: 8,
   },
   answerInput: {
     backgroundColor: '#1E293B',
     borderRadius: 12,
     borderWidth: 0,
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     color: '#F1F5F9',
     fontSize: 16,
     fontFamily: TYPOGRAPHY.fontFamily.primary,
           fontWeight: '500',
     letterSpacing: 0.3
   },
  submitButton: {
    marginTop: SPACING.sm,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  scoreSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  scoreTitle: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800'
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 12
  },
  submittedAnswersSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#334155'
  },
  submittedAnswersTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  submittedAnswer: {
    color: '#E2E8F0',
    fontSize: 16,
    paddingLeft: SPACING.sm,
    fontWeight: '500'
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpButton: {
    marginTop: SPACING.md,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  helpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },
  resultsSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  resultsTitle: {
    color: '#F1F5F9',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.sm
  },
  resultsSubtitle: {
    color: '#94A3B8',
    fontSize: 20,
    marginBottom: SPACING.lg,
    fontWeight: '600'
  },
  toggleButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700'
  },
  answersList: {
    width: '100%',
    marginTop: SPACING.md,
    gap: SPACING.sm
  },
  answersListTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569'
  },
  answerRank: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800'
  },
  answerText: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: SPACING.md
  },
  answerPoints: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800'
  },
  correctAnswer: {
    backgroundColor: 'rgba(241, 245, 249, 0.1)',
    borderColor: '#475569',
    borderWidth: 1
  },
  missedAnswer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 2
  },
  correctIndicator: {
    color: '#F1F5F9',
    fontSize: 24,
    marginLeft: SPACING.sm
  },
  missedIndicator: {
    color: '#EF4444',
    fontSize: 24,
    marginLeft: SPACING.sm
  },
  playAgainButton: {
    marginTop: SPACING.lg,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  
  startGameSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  startGameTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  startGameButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#7C3AED'
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: SPACING.md
  },

  progressContainer: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#7C3AED',
    width: 80,
    alignItems: 'center'
  },
  progressText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  answerTableSection: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  answerTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '100%'
  },
  answerTableTitle: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '700'
  },
  answerTableCount: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  answerTableContainer: {
    width: '100%',
    gap: SPACING.sm
  },
  answerTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569'
  },
  positionColumn: {
    width: 50,
    alignItems: 'center'
  },
  positionNumber: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '800'
  },
     answerColumn: {
     flex: 1,
     alignItems: 'center'
   },
     answerTableText: {
     color: '#F1F5F9',
     fontSize: 16,
     fontWeight: '600'
   },
   assignedAnswerRow: {
     backgroundColor: '#1F2937',
     borderColor: '#6B7280',
     opacity: 0.8
   },
   unassignedAnswerRow: {
     backgroundColor: '#312E81',
     borderColor: '#8B5CF6',
     borderWidth: 2,
     shadowColor: '#8B5CF6',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 5
   },
   teamBadge: {
     fontSize: 12,
     fontWeight: '600',
     marginTop: 2,
     textAlign: 'center'
   },
     fullScreenTouchable: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     zIndex: 999,
   },
   feedbackIndicator: {
     marginTop: SPACING.md,
     paddingVertical: SPACING.sm,
     paddingHorizontal: SPACING.md,
     borderRadius: 12,
     borderWidth: 2,
     alignItems: 'center',
     justifyContent: 'center',
     shadowOffset: { width: 0, height: 4 },
     shadowRadius: 8,
     elevation: 4,
   },
   feedbackText: {
     fontSize: 16,
           fontWeight: '600',
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     letterSpacing: 0.5,
     textAlign: 'center'
   },
   // Team mode styles
   teamLeaderboard: {
     backgroundColor: '#1E293B',
     borderRadius: 12,
     padding: SPACING.lg,
     marginBottom: SPACING.md,
     borderWidth: 1,
     borderColor: '#475569'
   },
   leaderboardTitle: {
     color: '#F1F5F9',
     fontSize: 18,
     fontWeight: '700',
     textAlign: 'center',
     marginBottom: SPACING.md
   },
   teamsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-around',
   },
   teamCard: {
     alignItems: 'center',
     padding: SPACING.sm,
     borderRadius: 8,
     backgroundColor: '#334155',
     borderWidth: 2,
     borderColor: 'transparent',
     minWidth: 80,
   },
   activeTeamCard: {
     backgroundColor: '#8B5CF6',
     borderColor: '#7C3AED',
   },
   teamCardName: {
     color: '#E2E8F0',
     fontSize: 14,
     fontWeight: '600',
     marginTop: SPACING.xs,
     textAlign: 'center'
   },
   teamCardScore: {
     color: '#94A3B8',
     fontSize: 16,
     fontWeight: '700',
     marginTop: SPACING.xs
   },
   activeTeamText: {
     color: '#FFFFFF',
   },
   teamIndicator: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     backgroundColor: '#1E293B',
     borderRadius: 12,
     marginBottom: SPACING.md,
     borderWidth: 1,
     borderColor: '#475569'
   },
   currentTeamLabel: {
     color: '#94A3B8',
     fontSize: 16,
     fontWeight: '600',
     marginRight: SPACING.sm
   },
   teamColorIndicator: {
     width: 20,
     height: 20,
     borderRadius: 10,
     marginRight: SPACING.sm
   },
   teamName: {
     color: '#F1F5F9',
     fontSize: 18,
     fontWeight: '700',
     marginRight: SPACING.md
   },
   teamScore: {
     color: '#94A3B8',
     fontSize: 16,
     fontWeight: '600'
   },
   timerContainer: {
     alignItems: 'center',
     backgroundColor: '#0F172A',
     borderRadius: 12,
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     borderWidth: 1,
     borderColor: '#334155'
   },
   timerText: {
     color: '#F1F5F9',
     fontSize: 28,
     fontWeight: '800'
   },
   turnControls: {
     flexDirection: 'row',
     justifyContent: 'center',
     gap: SPACING.md,
     marginBottom: SPACING.lg
   },

   endTurnButton: {
     backgroundColor: '#EF4444',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#DC2626'
   },
   endTurnButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600'
   }
});

export default GameScreen;



import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, Platform, Animated, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../components/Button';
import ResultsModal from '../components/ResultsModal';
import MultiplayerLeaderboard from '../components/MultiplayerLeaderboard';
import RankingOverlay from '../components/RankingOverlay';
import MultiplayerLeaderboardScreen from './MultiplayerLeaderboardScreen';
import ToastNotification from '../components/ToastNotification';
import { showCrossPlatformAlert } from '../components/CrossPlatformAlert';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../design-system';
import { GameScreenProps } from '../../shared/types/navigation';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import multiplayerService from '../../backend/services/multiplayerService';
import { QuestionAnswer } from '../../shared/types';
import { FEATURES } from '../../backend/config/featureFlags';
import HostAssignModal from '../components/HostAssignModal';
import { InputValidator } from '../../backend/utils/inputValidator';
import { RateLimitService } from '../../backend/services/rateLimitService';
import { findMatchingAnswer } from '../../backend/services/multiplayerGameFlowV2';
import { logger } from '../../backend/utils/logger';


const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId, categoryId, isMultiplayer, selectedQuestion, teamConfig, customQuestion, isCustomQuestion } = route.params;
  const insets = useSafeAreaInsets();
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
    currentRoom: multiplayerState,
    currentAnswer: multiplayerCurrentAnswer,
    submittedAnswers: multiplayerSubmittedAnswers,
    connectionStatus: multiplayerConnectionStatus,
    hostMigrationNotification,
    systemMessage,
    clearSystemMessage,
    joinRoom,
    startGame: startMultiplayerGame,
    submitAnswers: submitMultiplayerAnswer,
    advanceTurn: advanceMultiplayerTurn,
    skipTurn: skipMultiplayerTurn,
    nextQuestion: nextMultiplayerQuestion,
    endGame: endMultiplayerGame,
    leaveRoom,
    setCurrentAnswer: setMultiplayerAnswer,
    resetAll: resetMultiplayer,
    cleanup: forceDisconnect,
    revealAnswer: revealMultiplayerAnswer,
    isHost: isMultiplayerHost,
    handleHostDisconnection,
    clearHostMigrationNotification,
    terminateGame
  } = useMultiplayer();

  const [showResults, setShowResults] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [submittedAnswers, setSubmittedAnswers] = useState<string[]>([]);
  const [showQuestionComplete, setShowQuestionComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showGameEndRanking, setShowGameEndRanking] = useState(false);
  const [showMultiplayerLeaderboard, setShowMultiplayerLeaderboard] = useState(false);
  
  // Toast notification state
  const [toastNotification, setToastNotification] = useState<{
    visible: boolean;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  // Team mode state
  const [showHostAssignModal, setShowHostAssignModal] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>(-1);
  const [hasSubmittedThisTurn, setHasSubmittedThisTurn] = useState(false);
  
  // Multiplayer timer state
  const [multiplayerTimeRemaining, setMultiplayerTimeRemaining] = useState(60);
  const [serverOffset, setServerOffset] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<QuestionAnswer | null>(null);
  
  // Animation values
  const submitButtonScale = useRef(new Animated.Value(1)).current;
  const answerInputGlow = useRef(new Animated.Value(0)).current;
  const [lastAnswerResult, setLastAnswerResult] = useState<'correct' | 'incorrect' | null>(null);
  
  // Timer animation values
  const timerScale = useRef(new Animated.Value(1)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  const timerFlash = useRef(new Animated.Value(0)).current;
  
  // Track points earned for current answer
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
 
  

  // Determine if we're in multiplayer mode
  const isMultiplayerMode = isMultiplayer === true;
  
  // Get current game state based on mode
  const currentQuestion = isMultiplayerMode 
    ? (multiplayerState?.questions && multiplayerState.questions[multiplayerState.currentQuestionIndex || 0])
    : getCurrentQuestion();
  const progress = isMultiplayerMode 
    ? { current: (multiplayerState?.currentQuestionIndex || 0) + 1, total: multiplayerState?.questions?.length || 3 }
    : getProgress();
  
  // Progress is now always an object
  const gameProgress = progress;
  
  // Multiplayer scoring and state
  const getMultiplayerScore = () => {
    if (!isMultiplayerMode || !multiplayerState || !user?.id) return 0;
    // Use the new V2 scores system
    const score = multiplayerState.scores[user.id] || 0;
    logger.log(`🎯 UI_SCORE_DEBUG: Player ${user.id} score:`, {
      score,
      allScores: multiplayerState.scores,
      isMultiplayerMode,
      hasMultiplayerState: !!multiplayerState
    });
    return score;
  };
  
  const getMultiplayerCorrectAnswers = () => {
    if (!isMultiplayerMode || !multiplayerState) return 0;
    // Count only non-null revealed answers - ensure revealedAnswers is an array
    const revealedAnswers = multiplayerState.revealedAnswers;
    if (!Array.isArray(revealedAnswers)) {
      logger.warn('⚠️ revealedAnswers is not an array:', revealedAnswers);
      return 0;
    }
    return revealedAnswers.filter(ra => ra !== null).length;
  };
  
  const isMultiplayerQuestionComplete = () => {
    if (!isMultiplayerMode || !multiplayerState || !currentQuestion) return false;
    const totalAnswers = currentQuestion.answers?.length || 0;
    // Count only non-null revealed answers - ensure revealedAnswers is an array
    const revealedAnswers = multiplayerState.revealedAnswers;
    if (!Array.isArray(revealedAnswers)) {
      logger.warn('⚠️ revealedAnswers is not an array:', revealedAnswers);
      return false;
    }
    const revealedCount = revealedAnswers.filter(ra => ra !== null).length;
    return revealedCount >= totalAnswers;
  };
  
  const currentScore = isMultiplayerMode ? getMultiplayerScore() : getPlayerScore('You');
  const correctAnswersFound = isMultiplayerMode ? getMultiplayerCorrectAnswers() : getCorrectAnswersFound();
  const questionIsComplete = isMultiplayerMode ? isMultiplayerQuestionComplete() : isQuestionComplete();
  
  // 🎨 UI RENDER STATE DEBUG LOGGING
  logger.log('🎨 UI RENDER STATE:', {
    myScore: multiplayerState?.players?.[user?.id || '']?.score,
    revealedAnswers: multiplayerState?.revealedAnswers,
    totalPlayers: Object.keys(multiplayerState?.players || {}).length,
    currentScore,
    correctAnswersFound,
    questionIsComplete
  });
  
  
  // Get submitted answers for the current round
  const getCurrentRoundAnswers = () => {
    if (isMultiplayerMode) {
      return multiplayerSubmittedAnswers; // Use multiplayer context state
    }
    if (!gameState || !gameState.rounds[gameState.currentRound - 1]) return [];
    const currentRound = gameState.rounds[gameState.currentRound - 1];
    if (!currentRound.playerAnswers || !Array.isArray(currentRound.playerAnswers)) return [];
    return currentRound.playerAnswers
      .filter(answer => answer.playerId === 'You')
      .map(answer => answer.answer);
  };
  
  const currentRoundAnswers = getCurrentRoundAnswers();

  // Memoize the initialization function to prevent unnecessary re-renders
  const initializeGame = useCallback(async () => {
    logger.log('🎮 GameScreen useEffect - Debug Info:', {
      isMultiplayerMode,
      roomId,
      categoryId,
      hasGameState: !!gameState,
      hasMultiplayerState: !!multiplayerState?.roomCode,
      currentGameCategory: gameState?.category,
      multiplayerGamePhase: multiplayerState?.gamePhase,
      multiplayerStatus: multiplayerState?.status
    });
    
    if (isMultiplayerMode) {
      // For multiplayer, we should already be in a room from the lobby
      // Just ensure we're subscribed to the room updates
      if (multiplayerState?.roomCode && multiplayerState.roomCode === roomId) {
        logger.log('🎮 Already in correct multiplayer room:', multiplayerState.roomCode);
        logger.log('🎮 Game phase:', multiplayerState.gamePhase);
        logger.log('🎮 Current question index:', multiplayerState.currentQuestionIndex);
        logger.log('🎮 Questions count:', multiplayerState.questions?.length);
      } else {
        logger.log('🎮 Multiplayer room mismatch or not found');
        logger.log('🎮 Expected room:', roomId);
        logger.log('🎮 Current room:', multiplayerState?.roomCode);
        
        // If we're not in the right room, try to join
        if (roomId && roomId !== 'single-player') {
          const playerName = user?.displayName || user?.email || 'Player';
          const playerId = user?.id || user?.email || `player_${Date.now()}`;
          try {
            await multiplayerService.joinRoom(roomId, playerId, playerName);
            logger.log('✅ Successfully joined multiplayer room');
          } catch (error) {
            logger.error('❌ Failed to join room:', error);
            // Show error to user
            Alert.alert('Connection Error', 'Failed to join the multiplayer room. Please try again.');
          }
        }
      }
    } else {
      // Initialize single-player game
      const shouldStartNewGame = !gameState || gameState.category !== categoryId;
      
      if (shouldStartNewGame) {
        logger.log('🎮 Starting new single-player game...');
        logger.log('🎮 Previous category:', gameState?.category);
        logger.log('🎮 New category:', categoryId);
        logger.log('🎮 Selected question:', selectedQuestion?.text || selectedQuestion?.title || 'None');
        logger.log('🎮 Team config:', teamConfig ? 'YES' : 'NO');
         
         // Reset any existing game first
         if (gameState) {
           resetGame();
           setShowGameEndRanking(false);
         }

         // Check if this is a custom question
         if (isCustomQuestion && customQuestion) {
           logger.log('🎮 Starting custom question game:', customQuestion.question);
           
           // Convert custom question to the format expected by the game
           const convertedQuestion = {
             id: customQuestion.id,
             title: customQuestion.question, // Use 'title' instead of 'text'
             text: customQuestion.question, // Keep both for compatibility
             answers: customQuestion.answers.map((answer: string, index: number) => ({
               text: answer,
               rank: index + 1,
               points: index + 1 // Points increase from 1 to number of answers
             })),
             category: 'Custom',
             difficulty: 'medium'
           };
           
           // Check if this is a team mode custom question
           if (teamConfig) {
             logger.log('🎮 Starting custom question team mode game with config:', teamConfig);
             startTeamsGame('Custom', teamConfig, convertedQuestion);
           } else {
             // Regular single player custom question
             startGame('Sports', ['You'], convertedQuestion);
           }
         } else if (teamConfig) {
           logger.log('🎮 Starting team mode game with config:', teamConfig);
           startTeamsGame(categoryId || 'Sports', teamConfig, selectedQuestion);
         } else {
           // Regular single player mode
           startGame(categoryId || 'Sports', ['You'], selectedQuestion);
         }
      }
    }
  }, [isMultiplayerMode, roomId, categoryId, gameState?.category, multiplayerState?.roomCode, multiplayerState?.gamePhase, multiplayerState?.currentQuestionIndex, multiplayerState?.questions?.length, user?.displayName, user?.email, user?.id, selectedQuestion?.text, selectedQuestion?.title, teamConfig, customQuestion, isCustomQuestion]);

  // Initialize game based on mode
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Sync multiplayer state changes - simplified dependencies
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState) {
      logger.log('🎮 Multiplayer state changed:', {
        gamePhase: multiplayerState.gamePhase,
        status: multiplayerState.status,
        currentQuestionIndex: multiplayerState.currentQuestionIndex,
        questionStartTime: multiplayerState.questionStartTime,
        revealedAnswers: multiplayerState.revealedAnswers?.length || 0
      });
      
      // Handle game phase changes
      if (multiplayerState.gamePhase === 'question' && multiplayerState.turnStartTime) {
        logger.log('🎮 Question phase started');
        // Game is active, show the question
      } else if (multiplayerState.gamePhase === 'answers') {
        logger.log('🎮 Answers phase - showing revealed answers');
        setShowAnswers(true);
      } else if (multiplayerState.gamePhase === 'results') {
        logger.log('🎮 Results phase');
      } else if (multiplayerState.gamePhase === 'finished') {
        logger.log('🎮 Game finished');
        // Check if all 10 answers are revealed before showing leaderboard
        const revealedAnswers = multiplayerState.revealedAnswers;
        const revealedAnswersCount = Array.isArray(revealedAnswers) 
          ? revealedAnswers.filter(ra => ra !== null).length 
          : 0;
        if (revealedAnswersCount >= 10) {
          setShowMultiplayerLeaderboard(true);
          setShowGameEndRanking(false); // Ensure no overlapping modals
          setShowResults(false); // Hide results modal
          setShowAnswers(false); // Hide answers
        }
      }
    }
  }, [isMultiplayerMode, multiplayerState?.gamePhase, multiplayerState?.status, multiplayerState?.turnStartTime, multiplayerState?.revealedAnswers?.length]);

  // Timeout for multiplayer game loading - simplified dependencies
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState?.gamePhase === 'lobby') {
      const timeout = setTimeout(() => {
        logger.log('⏰ Multiplayer game loading timeout - showing error');
        Alert.alert(
          'Game Loading Timeout',
          'The game is taking too long to start. Please try again.',
          [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isMultiplayerMode, multiplayerState?.gamePhase, navigation]);

  // Team mode timer effect - Only run in single-player mode - simplified dependencies
  useEffect(() => {
    if (!isMultiplayerMode && isTeamMode && teamGameState && teamGameState.isTurnActive && teamGameState.roundTimerSeconds > 0) {
      const timer = setInterval(() => {
        if (teamGameState.timeRemaining > 0) {
          setTeamTimer(teamGameState.timeRemaining - 1);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMultiplayerMode, isTeamMode, teamGameState?.isTurnActive, teamGameState?.roundTimerSeconds, teamGameState?.timeRemaining, setTeamTimer]);

  // Multiplayer turn timer effect with V2 server synchronization
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState?.gamePhase === 'question' && multiplayerState.turnStartTime) {
      // Get server offset once
      multiplayerService.getServerOffsetV2().then(offset => {
        setServerOffset(offset);
      });
      
      const timer = setInterval(() => {
        // Calculate time remaining using server offset for turn phase
        const timeRemaining = multiplayerService.calculateTimeRemainingV2(
          multiplayerState.turnStartTime,
          multiplayerState.turnTimeLimit || 60, // Changed to 60 seconds
          serverOffset
        );
        
        // Update the timer state for UI display
        setMultiplayerTimeRemaining(timeRemaining);
        
        if (timeRemaining <= 0) {
          // Turn time's up - automatically advance to next player
          logger.log('⏰ Turn timer expired - advancing to next player');
          if (multiplayerState.currentPlayerId === user?.id && user?.id) {
            // Current player's turn expired, try to advance turn
            multiplayerService.advanceTurnOnTimeoutV2(multiplayerState.roomCode, user.id).catch(error => {
              logger.log('⚠️ Turn advance failed:', error);
              // This is expected - another client may have already advanced the turn
            });
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isMultiplayerMode, multiplayerState?.gamePhase, multiplayerState?.turnStartTime, multiplayerState?.turnTimeLimit, multiplayerState?.currentPlayerId, user?.id, serverOffset]);

  // Timer animation effects
  useEffect(() => {
    if (isMultiplayerMode && multiplayerTimeRemaining <= 10) {
      // Warning animation - gentle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      if (multiplayerTimeRemaining <= 5) {
        // Critical animation - flash effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(timerFlash, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(timerFlash, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      // Reset animations when not in warning state
      timerPulse.setValue(1);
      timerFlash.setValue(0);
    }
  }, [isMultiplayerMode, multiplayerTimeRemaining, timerPulse, timerFlash]);

  // Reset feedback state when question changes
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState?.currentQuestionIndex !== undefined) {
      setPointsEarned(null);
      setLastAnswerResult(null);
      logger.log(`🔄 QUESTION_CHANGE: Reset feedback state for question ${multiplayerState.currentQuestionIndex}`);
    }
  }, [isMultiplayerMode, multiplayerState?.currentQuestionIndex]);

  // Check if question is complete and show success message - simplified dependencies
  useEffect(() => {
    if (questionIsComplete && !showQuestionComplete) {
      setShowQuestionComplete(true);
      setTimeout(() => {
        setShowQuestionComplete(false);
      }, 3000);
    }
  }, [questionIsComplete, showQuestionComplete]);

  // Check if game is finished and show results - simplified dependencies
  useEffect(() => {
    if (gameState?.gamePhase === 'finished' && !showResults) {
      logger.log('🎉 Game finished! Showing results...');
      setShowGameEndRanking(true);
      setShowResults(true);
    }
  }, [gameState?.gamePhase, showResults]);

  // Handle system messages (Sporcle-style notifications)
  useEffect(() => {
    if (isMultiplayerMode && systemMessage.type) {
      logger.log('🔔 SYSTEM_MESSAGE: Received system message:', systemMessage);
      if (systemMessage.type === 'host_migrated') {
        // Show seamless host migration notification (Sporcle-style)
        showToast(
          'success',
          'Host Changed',
          systemMessage.message
        );
        
        // Clear system message after showing toast
        setTimeout(() => {
          clearSystemMessage();
        }, 3000);
      } else if (systemMessage.type === 'room_terminated') {
        // Room terminated - show cross-platform alert and redirect
        showCrossPlatformAlert({
          title: 'Room Closed',
          message: systemMessage.message,
          buttons: [
            { 
              text: 'OK', 
              onPress: () => {
                clearSystemMessage();
                forceDisconnect();
                navigation.navigate('MultiplayerMenu');
              }
            }
          ]
        });
      } else if (systemMessage.type === 'game_terminated') {
        // Game terminated due to insufficient players
        logger.log('🔔 GAME_TERMINATED: Showing termination alert');
        showCrossPlatformAlert({
          title: 'Game Ended',
          message: systemMessage.message,
          buttons: [
            { 
              text: 'OK', 
              onPress: () => {
                logger.log('🔔 GAME_TERMINATED: User acknowledged, redirecting to MultiplayerMenu');
                clearSystemMessage();
                forceDisconnect();
                navigation.navigate('MultiplayerMenu');
              }
            }
          ]
        });
      }
    }
  }, [isMultiplayerMode, systemMessage, clearSystemMessage, forceDisconnect, navigation]);

  // Monitor player disconnections and handle host migration
  const previousPlayersRef = useRef<string[]>([]);
  const previousHostIdRef = useRef<string | null>(null);
  const previousCurrentPlayerIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState && user?.id) {
      const currentPlayers = Object.keys(multiplayerState.players || {});
      const currentHostId = multiplayerState.hostId;
      
      // Check if host changed (indicating a host migration occurred)
      if (previousHostIdRef.current && 
          previousHostIdRef.current !== currentHostId && 
          previousHostIdRef.current !== user.id) {
        logger.log('🔄 Host changed detected:', {
          previousHost: previousHostIdRef.current,
          newHost: currentHostId,
          currentUser: user.id
        });
        
        // The host migration was already handled by the server, just show notification
        const newHostName = multiplayerState.players[currentHostId]?.name || 'Unknown Player';
        showToast(
          'success',
          'Host Changed',
          `${newHostName} is now the new host!`
        );
      }
      
      // Check if any players have left
      if (previousPlayersRef.current.length > currentPlayers.length) {
        logger.log('📊 Player count changed:', {
          previous: previousPlayersRef.current.length,
          current: currentPlayers.length,
          currentPlayers,
          previousPlayers: previousPlayersRef.current
        });
        
        // Find which player left
        const leftPlayer = previousPlayersRef.current.find(playerId => !currentPlayers.includes(playerId));
        if (leftPlayer) {
          if (leftPlayer === previousHostIdRef.current) {
            logger.log('🚪 Host disconnected, handling migration...');
            handleHostDisconnection(leftPlayer);
          } else if (currentPlayers.length === 1) {
            // Only 2 players were left (including host), and a non-host player left
            // This means only the host remains, so terminate the game
            logger.log('🏁 Only 2 players were left, terminating game due to player disconnection...');
            terminateGame(leftPlayer);
          }
        }
      }
      
      // Update refs
      previousPlayersRef.current = currentPlayers;
      previousHostIdRef.current = currentHostId;
    }
  }, [isMultiplayerMode, multiplayerState?.players, multiplayerState?.hostId, user?.id, handleHostDisconnection, terminateGame]);

  // Reset submission state when current player changes
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState && user?.id) {
      const currentPlayerId = multiplayerState.currentPlayerId;
      
      // If the current player changed, reset submission state
      if (previousCurrentPlayerIdRef.current !== currentPlayerId) {
        logger.log('🔄 Current player changed, resetting submission state:', {
          previous: previousCurrentPlayerIdRef.current,
          current: currentPlayerId,
          isMyTurn: currentPlayerId === user.id
        });
        
        // Reset submission state for all players when turn changes
        setHasSubmittedThisTurn(false);
        
        // Update the ref
        previousCurrentPlayerIdRef.current = currentPlayerId;
      }
    }
  }, [isMultiplayerMode, multiplayerState?.currentPlayerId, user?.id]);

  // Reset submission state when question changes
  useEffect(() => {
    if (isMultiplayerMode && multiplayerState) {
      logger.log('🔄 Question changed, resetting submission state');
      setHasSubmittedThisTurn(false);
    }
  }, [isMultiplayerMode, multiplayerState?.currentQuestionIndex]);

  // Handle back button in multiplayer mode
  useEffect(() => {
    if (isMultiplayerMode) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        showCrossPlatformAlert({
          title: 'Exit Game',
          message: 'Are you sure you want to leave the game? This will disconnect you from the room.',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Exit', 
              style: 'destructive', 
              onPress: () => {
                leaveRoom();
                navigation.goBack();
              }
            }
          ]
        });
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [isMultiplayerMode, leaveRoom, navigation]);

  // Handle back button in single-player mode
  useEffect(() => {
    if (!isMultiplayerMode) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
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
                navigation.goBack();
              }
            }
          ]
        );
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }
  }, [isMultiplayerMode, resetGame, navigation]);

  // Cleanup game state when screen loses focus (user navigates away)
  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      logger.log('🎮 GameScreen focused');
      
      // Return cleanup function that runs when screen loses focus
      return () => {
        logger.log('🎮 GameScreen unfocused - cleaning up single-player game state');
        // Only reset single-player game state, not multiplayer
        if (!isMultiplayerMode) {
          logger.log('🎮 Resetting single-player game state on navigation away');
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
              navigation.navigate('Home');
            } else {
              resetGame();
              navigation.navigate('Categories', { gameMode: 'single' });
            }
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
      navigation.navigate('Home');
    };

           const handleBackToCategories = () => {
      setShowResults(false);
      setShowGameEndRanking(false);
      if (isMultiplayerMode) {
        forceDisconnect();
      } else {
        resetGame();
      }
      navigation.navigate('Home');
    };

  const handleQuitMultiplayerGame = () => {
    logger.log('🚪 Quitting multiplayer game...');
    setShowMultiplayerLeaderboard(false);
    forceDisconnect();
    navigation.navigate('MultiplayerMenu');
  };

  const handleMultiplayerLeaderboardComplete = () => {
    logger.log('⏰ Multiplayer leaderboard countdown complete...');
    setShowMultiplayerLeaderboard(false);
    forceDisconnect();
    navigation.navigate('MultiplayerMenu');
  };

  const getMultiplayerLeaderboardData = () => {
    if (!multiplayerState || !multiplayerState.players || !multiplayerState.scores) {
      return [];
    }

    return Object.entries(multiplayerState.players).map(([playerId, player]) => ({
      playerId,
      playerName: player.name || 'Unknown Player',
      score: multiplayerState.scores?.[playerId] || 0,
      rank: 0, // Will be calculated by the leaderboard component
    }));
  };

  // Helper function to show toast notifications
  const showToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    setToastNotification({
      visible: true,
      type,
      title,
      message,
    });
  };

  const hideToast = () => {
    setToastNotification(prev => ({ ...prev, visible: false }));
    };

  const handleBackButton = () => {
    if (!isMultiplayerMode) {
      // Single player mode - show warning
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
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      // Multiplayer mode - handle differently if needed
      logger.log('🎮 Back button pressed in multiplayer mode');
      navigation.goBack();
    }
  };

  const handleHelp = () => {
    Alert.alert(
      'How to Play TOP 10',
      'READ: Read the question carefully and think about the top 10 answers\n\nANSWER: Type your answer and submit - you can submit multiple answers!\n\nSCORE: The closer your answer is to #1, the more points you get\n\nTIP: Think broadly and submit as many relevant answers as possible!\n\nFind all 10 correct answers to complete each question!\n\nGood luck!',
      [{ text: 'Got it' }]
    );
  };

  const handleShowGameRules = () => {
    Alert.alert(
      'Game Rules',
      'OBJECTIVE: Guess the top 10 answers to each question\n\nSCORING:\n• #1 answer = 1 point\n• #2 answer = 2 points\n• #3 answer = 3 points\n• And so on...\n\nMULTIPLE ANSWERS: Submit as many as you can!\n\nPROGRESS: Find all 10 correct answers to complete each question',
      [{ text: 'Understood' }]
    );
  };



    const handleSkipTurn = async () => {
    if (!isMultiplayerMode || !multiplayerState || !user?.id) return;
    
    // Check if it's the current player's turn
    if (multiplayerState.currentPlayerId !== user.id) {
      logger.log('❌ Cannot skip turn: Not your turn');
      return;
    }
    
    try {
      logger.log('⏭️ Skipping turn...');
      await skipMultiplayerTurn();
      logger.log('✅ Turn skipped successfully');
    } catch (error) {
      logger.error('❌ Error skipping turn:', error);
    }
  };

    const handleSubmitAnswer = async () => {
    const answerToSubmit = isMultiplayerMode ? (multiplayerCurrentAnswer || '') : currentAnswer;
    
    // 🎯 SUBMIT ANSWER - START DEBUG LOGGING
    logger.log('🎯 SUBMIT ANSWER - START:', {
      userInput: answerToSubmit,
      playerId: user?.id,
      gameMode: 'multiplayer',
      currentQuestion: multiplayerState?.questions?.[multiplayerState?.currentQuestionIndex || 0]?.text,
      roomCode: multiplayerState?.roomCode,
      currentPlayerId: multiplayerState?.currentPlayerId,
      isMyTurn: multiplayerState?.currentPlayerId === user?.id,
      gamePhase: multiplayerState?.gamePhase,
      status: multiplayerState?.status,
      turnOrder: multiplayerState?.turnOrder,
      currentTurnIndex: multiplayerState?.currentTurnIndex,
      players: Object.keys(multiplayerState?.players || {}),
      timestamp: new Date().toISOString()
    });
    
    logger.log('🎮 handleSubmitAnswer called:', {
      isMultiplayerMode,
      answerToSubmit,
      multiplayerStateCurrentAnswer: multiplayerCurrentAnswer,
      currentAnswer,
      multiplayerState: multiplayerState ? {
        status: multiplayerState.status,
        gamePhase: multiplayerState.gamePhase,
        currentPlayerId: multiplayerState.currentPlayerId,
        currentQuestionIndex: multiplayerState.currentQuestionIndex,
        answersSubmittedCount: multiplayerState.answersSubmittedCount
      } : null,
      userId: user?.id
    });
    
    // Check rate limiting for answer submissions
    if (user?.id) {
      const rateLimitResult = await RateLimitService.checkRateLimit(
        user.id,
        'answerSubmission',
        { roomCode: multiplayerState?.roomCode }
      );
      
      if (!rateLimitResult.allowed) {
        logger.log('❌ Rate limit exceeded:', rateLimitResult.error);
        Alert.alert('Rate Limit Exceeded', rateLimitResult.error || 'Too many answer submissions. Please wait before trying again.');
        return;
      }
    }
    
    // Enhanced validation using InputValidator
    if (!answerToSubmit || typeof answerToSubmit !== 'string') {
      logger.log('❌ No valid answer to submit');
      return;
    }

    const answerValidation = InputValidator.validateGameAnswer(answerToSubmit);
    if (!answerValidation.valid) {
      logger.log('❌ Invalid answer:', answerValidation.errors);
      Alert.alert('Invalid Answer', answerValidation.errors.join('\n'));
      return;
    }
    
    // Additional content moderation for game answers
    if (user?.id) {
      const moderationResult = await InputValidator.moderateContent(
        answerToSubmit,
        'gameAnswer',
        user.id,
        { ipAddress: 'unknown', userAgent: 'mobile' } // In production, get real metadata
      );
      
      if (!moderationResult.approved) {
        logger.log('❌ Answer not approved by moderation:', moderationResult.errors);
        Alert.alert('Content Not Approved', moderationResult.errors.join('\n'));
        return;
      }
    }

    const sanitizedAnswer = answerValidation.sanitized;

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
        // Check if player has already submitted this turn
        if (hasSubmittedThisTurn) {
          logger.log('❌ Already submitted this turn');
          Alert.alert('Already Submitted', 'You have already submitted an answer this turn. Wait for your next turn.');
          return;
        }
        
        // Check if it's the current player's turn using V2 validation
        if (multiplayerState) {
          const validation = multiplayerService.isAllowedToSubmitV2(user?.id || '', multiplayerState);
          if (!validation.allowed) {
            logger.log('❌ Cannot submit:', validation.reason || 'Wait for your turn to submit answers.');
            Alert.alert('Not Your Turn', validation.reason || 'Wait for your turn to submit answers.');
            return;
          }
        }
        
        // Check if the answer has already been revealed
        if (multiplayerState && multiplayerState.revealedAnswers) {
          const currentQuestion = multiplayerState.questions?.[multiplayerState.currentQuestionIndex];
          if (currentQuestion && currentQuestion.answers) {
            // Find if the user's answer matches any of the correct answers
            const match = findMatchingAnswer(sanitizedAnswer, currentQuestion.answers);
            if (match) {
              const { index } = match;
              // Check if this answer position is already revealed
              if (multiplayerState.revealedAnswers[index] !== null) {
                logger.log('❌ Answer already revealed:', {
                  userAnswer: sanitizedAnswer,
                  matchedAnswer: currentQuestion.answers[index]?.text,
                  revealedAnswer: multiplayerState.revealedAnswers[index]
                });
                Alert.alert('Answer Already Revealed', 'This answer has already been revealed by another player. Please try a different answer.');
                return;
              }
            }
          }
        }
        
        logger.log('📝 Submitting multiplayer answer:', sanitizedAnswer);
        
        // Use V2 answer submission system
        logger.log('🔧 CALLING SERVICE - submitAnswerV2:', {
          roomCode: multiplayerState?.roomCode || '',
          playerId: user?.id || '',
          answerText: sanitizedAnswer
        });
        
        const result = await multiplayerService.submitAnswerV2(
          multiplayerState?.roomCode || '',
          user?.id || '',
          sanitizedAnswer
        );
        
        // 🎯 SUBMIT ANSWER - SERVICE RESULT DEBUG LOGGING
        logger.log('🎯 SUBMIT ANSWER - SERVICE RESULT:', {
          success: result.success,
          points: result.points,
          error: result.error,
          roundEnded: result.roundEnded,
          matchedAnswer: 'N/A' // Service doesn't return matchedAnswer
        });
        
        if (result.success) {
          setMultiplayerAnswer('');
          setHasSubmittedThisTurn(true); // Mark that player has submitted this turn
          // The answer is already added to multiplayerSubmittedAnswers by the context
          
          // Show feedback based on whether points were earned (correct answer)
          if (result.points && result.points > 0) {
            setLastAnswerResult('correct');
            setPointsEarned(result.points);
            logger.log(`✅ Correct answer! Earned ${result.points} points`);
            // Show success message with points
            Alert.alert(
              'Correct Answer!',
              `You earned ${result.points} points!`,
              [{ text: 'Great!', style: 'default' }]
            );
          } else {
            setLastAnswerResult('incorrect');
            setPointsEarned(0);
            logger.log(`❌ Wrong answer - no points earned`);
            // Show error message
            Alert.alert(
              'Wrong Answer',
              'That answer is not correct. Try again!',
              [{ text: 'OK', style: 'default' }]
            );
          }
          
          // If round ended, show message
          if (result.roundEnded) {
            logger.log(`🏁 Round ended! Moving to answers phase.`);
            // The game phase will automatically change to 'answers' via the multiplayer context
          }
        } else {
          // Show error feedback
          setLastAnswerResult('incorrect');
          logger.log(`❌ Answer submission failed: ${result.error || 'Failed to submit answer'}`);
        }
      } else {
        logger.log('📝 Submitting single-player answer:', sanitizedAnswer);
        logger.log('📝 Before submission - Score:', getPlayerScore('You'));
        submitAnswer('You', sanitizedAnswer);
        logger.log('📝 After submission - Score:', getPlayerScore('You'));
        setAnswer('');
        
        // Determine answer result and show feedback
        const isCorrect = checkAnswerCorrectness(sanitizedAnswer);
        setLastAnswerResult(isCorrect ? 'correct' : 'incorrect');
      }
      
      setSubmittedAnswers(prev => [...prev, sanitizedAnswer]);
      setIsAnswerSubmitted(true);
      
      // Animate answer input based on result - use setTimeout to ensure state is updated
      setTimeout(() => {
        Animated.timing(answerInputGlow, {
          toValue: lastAnswerResult === 'correct' ? 1 : -1,
          duration: ANIMATIONS.duration.normal,
          useNativeDriver: false,
        }).start();
      }, 100); // Small delay to ensure state is updated
      
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
      logger.error('❌ Error submitting answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (isMultiplayerMode) {
      if (multiplayerState && (multiplayerState.currentQuestionIndex || 0) >= (multiplayerState.questions?.length || 0) - 1) {
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
    if (!currentQuestion?.answers || !answer || typeof answer !== 'string') return false;
    
    const normalizedAnswer = answer.toLowerCase().trim();
    if (!Array.isArray(currentQuestion.answers)) {
      logger.warn('⚠️ currentQuestion.answers is not an array:', currentQuestion.answers);
      return false;
    }
    
    return currentQuestion.answers.some((correctAnswer: any) => {
      if (!correctAnswer || !correctAnswer.text) return false;
      
      return correctAnswer.text.toLowerCase().trim() === normalizedAnswer ||
        (correctAnswer.normalized && correctAnswer.normalized.toLowerCase().trim() === normalizedAnswer) ||
        (correctAnswer.aliases && Array.isArray(correctAnswer.aliases) && 
         correctAnswer.aliases.some((alias: string) => 
           alias && typeof alias === 'string' && alias.toLowerCase().trim() === normalizedAnswer
         ));
    });
  };

  logger.log('🎮 GameScreen render state:', {
    isMultiplayerMode,
    gameState: gameState ? 'exists' : 'null',
    multiplayerState: multiplayerState ? 'exists' : 'null',
    currentQuestion: currentQuestion ? 'exists' : 'null',
    gamePhase: multiplayerState?.gamePhase,
    currentScore,
    correctAnswersFound,
    gameProgress,
    roomId,
    categoryId,
    questionsCount: multiplayerState?.questions?.length,
    currentQuestionIndex: multiplayerState?.currentQuestionIndex,
    turnStartTime: multiplayerState?.turnStartTime
  });

  if ((!isMultiplayerMode && (!gameState || !currentQuestion)) || 
      (isMultiplayerMode && (!multiplayerState || !currentQuestion || multiplayerState.gamePhase === 'lobby'))) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {isMultiplayerMode ? 'Waiting for game to start...' : 'Loading game...'}
          </Text>
          {isMultiplayerMode && (
            <>
              <Text style={styles.connectionStatus}>
                Status: {multiplayerConnectionStatus || 'disconnected'}
              </Text>
              <Text style={styles.connectionStatus}>
                Game Phase: {multiplayerState?.gamePhase || 'unknown'}
              </Text>
              <Text style={styles.connectionStatus}>
                Questions: {multiplayerState?.questions?.length || 0}
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
             {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        {isMultiplayerMode ? (
          <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
            <Text style={styles.backButtonArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerLeft} />
        )}

        <View style={styles.headerCenter}>
          {isMultiplayerMode && (
            <Text style={styles.multiplayerIndicator}>
              Multiplayer
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {isMultiplayerMode && (
            <TouchableOpacity onPress={handleExitGame} style={styles.exitButton}>
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Multiplayer Leaderboard */}
        {isMultiplayerMode && multiplayerState && (
          <>
            <MultiplayerLeaderboard
              leaderboard={Object.entries(multiplayerState.players || {}).map(([playerId, player]) => ({
                playerId,
                playerName: player.name || 'Unknown Player',
                score: multiplayerState.scores?.[playerId] || 0
              })).sort((a, b) => b.score - a.score)} // Sort by score descending
              currentPlayerId={user?.id || ''}
              maxHeight={150}
            />
            
            {/* Start Game Button for Multiplayer - Only show in lobby */}
            {multiplayerState?.gamePhase === 'lobby' && isMultiplayerHost && (
              <View style={styles.startGameSection}>
                <Text style={styles.startGameTitle}>
                  Waiting for players... ({Object.keys(multiplayerState?.players || {}).length} joined)
                </Text>
                <Button 
                  title="Start Game" 
                  onPress={() => {
                    logger.log('🎮 Manual start game pressed');
                    startMultiplayerGame();
                  }}
                  style={styles.startGameButton}
                />
              </View>
            )}
            
            {/* Game Status for Multiplayer */}
            
            {multiplayerState?.gamePhase === 'answers' && (
              <View style={styles.gameStatusSection}>
                <Text style={styles.gameStatusText}>
                  🎯 Revealing answers...
                </Text>
              </View>
            )}
            
            {multiplayerState?.gamePhase === 'results' && (
              <View style={styles.gameStatusSection}>
                <Text style={styles.gameStatusText}>
                  🏆 Question complete! Moving to next question...
                </Text>
              </View>
            )}
          </>
        )}



        {/* Question Section - Modern Trivia Style */}
        {currentQuestion && (
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>
                Question {multiplayerState?.currentQuestionIndex ? multiplayerState.currentQuestionIndex + 1 : 1}
            </Text>
              <Text style={styles.questionCategory}>
                {currentQuestion.category}
            </Text>
            </View>
            <Text style={styles.questionText}>
              {'text' in currentQuestion ? currentQuestion.text : currentQuestion.title}
            </Text>
          </View>
        )}

        {/* Turn Indicator - Enhanced design between question and input */}
        {isMultiplayerMode && multiplayerState?.gamePhase === 'question' && (
          <View style={styles.enhancedTurnIndicator}>
            <View style={styles.turnContent}>
              <Text style={styles.enhancedTurnText}>
                {multiplayerState.currentPlayerId === user?.id ? 'Your Turn' : 'Waiting'}
              </Text>
            </View>
          </View>
        )}




        {/* Modern Answer Grid */}
        {currentQuestion && currentQuestion.answers && (
          <View style={styles.answerGridContainer}>
            {/* Timer above answers */}
            <Animated.View 
              style={[
                styles.answerTimerContainer,
                isMultiplayerMode && multiplayerTimeRemaining <= 10 && styles.answerTimerContainerWarning,
                isMultiplayerMode && multiplayerTimeRemaining <= 5 && styles.answerTimerContainerCritical,
                {
                  transform: [
                    { scale: timerPulse },
                    { scale: timerScale }
                  ],
                  opacity: Animated.subtract(1, Animated.multiply(timerFlash, 0.3))
                }
              ]}
              accessibilityRole="timer"
              accessibilityLabel={`Time remaining: ${isMultiplayerMode ? multiplayerTimeRemaining : (isTeamMode && teamGameState?.timeRemaining) ? teamGameState.timeRemaining : 'unlimited'} seconds`}
              accessibilityHint={isMultiplayerMode && multiplayerTimeRemaining <= 10 ? "Time is running low" : "Time remaining for this question"}
            >
              <Text 
                style={[
                  styles.answerTimerLabel,
                  isMultiplayerMode && multiplayerTimeRemaining <= 10 && styles.answerTimerLabelWarning,
                  isMultiplayerMode && multiplayerTimeRemaining <= 5 && styles.answerTimerLabelCritical
                ]}
                accessibilityRole="text"
              >
                Time Remaining
              </Text>
              <Text 
                style={[
                  styles.answerTimerText,
                  isMultiplayerMode && multiplayerTimeRemaining <= 10 && styles.answerTimerTextWarning,
                  isMultiplayerMode && multiplayerTimeRemaining <= 5 && styles.answerTimerTextCritical
                ]}
                accessibilityRole="text"
                accessibilityLabel={`${isMultiplayerMode ? multiplayerTimeRemaining : (isTeamMode && teamGameState?.timeRemaining) ? teamGameState.timeRemaining : 'unlimited'} seconds`}
              >
                {isMultiplayerMode 
                  ? multiplayerTimeRemaining 
                  : (isTeamMode && teamGameState?.timeRemaining) 
                    ? teamGameState.timeRemaining 
                    : '∞'
                }
              </Text>
            </Animated.View>
            <Text style={styles.answerGridTitle}>Answers</Text>
            <View style={styles.answerGrid}>
                             {Array.isArray(currentQuestion.answers) ? currentQuestion.answers.map((answer: any, index: number) => {
                 // Get answer text
                 const answerText = typeof answer === 'string' ? answer : answer.text;
                 
                 // Determine if this answer should be revealed
                 let isRevealed = false;
                 let assignedTeam = null;
                 let assignedPoints = 0;
                 
                 // 🎨 ANSWER DEBUG LOGGING (only for first few answers to avoid spam)
                 if (index < 3) {
                   logger.log(`🎨 ANSWER ${index + 1}:`, {
                     canonicalName: answerText,
                     answerIndex: index,
                     isRevealed: false, // Will be updated below
                     revealedValue: 'N/A' // Will be updated below
                   });
                 }
                 
                 if (isMultiplayerMode) {
                   // In multiplayer mode, check if answer is revealed
                   // Check if this answer position is revealed in the revealedAnswers array
                   const revealedAnswer = multiplayerState?.revealedAnswers?.[index];
                   isRevealed = revealedAnswer !== null && 
                               revealedAnswer !== undefined &&
                               revealedAnswer.answerId !== undefined &&
                               revealedAnswer.answerId !== null;
                   
                   // Debug logging for answer revelation
                   if (index === 0) { // Only log for first answer to avoid spam
                     logger.log('🔍 Answer revelation debug:', {
                       answerText,
                       answerIndex: index,
                       revealedAnswers: multiplayerState?.revealedAnswers,
                       isRevealed,
                       currentRevealedAnswer: multiplayerState?.revealedAnswers?.[index]
                     });
                   }
                   
                   // Additional logging for revealed answers
                   if (isRevealed) {
                     logger.log(`🎉 UI_REVELATION_DEBUG: Answer at index ${index} is revealed:`, {
                       answerText,
                       answerIndex: index,
                       revealedAnswer: multiplayerState?.revealedAnswers?.[index],
                       canonicalAnswer: multiplayerState?.revealedAnswers?.[index]?.answerId,
                       playerWhoRevealed: multiplayerState?.revealedAnswers?.[index]?.playerId,
                       pointsAwarded: multiplayerState?.revealedAnswers?.[index]?.points
                     });
                   }
                   
                   // Set the revealed value to the actual answer text
                   let revealedValue = answerText; // Default to original answer text
                   if (isRevealed && revealedAnswer) {
                     revealedValue = revealedAnswer.answerId || answerText;
                   }
                   
                   // 🎨 ANSWER DEBUG LOGGING - Update with actual values
                   if (index < 3) {
                     logger.log(`🎨 ANSWER ${index + 1} - UPDATED:`, {
                       canonicalName: answerText,
                       answerIndex: index,
                       isRevealed: isRevealed,
                       revealedValue: revealedValue,
                       shouldShow: isRevealed
                     });
                   }
                 } else if (!isMultiplayerMode && isTeamMode) {
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
                     if (!submitted || typeof submitted !== 'string') return false;
                     
                     const normalizedSubmitted = submitted.toLowerCase().trim();
                     const answerText = typeof answer === 'string' ? answer : (answer?.text || '');
                     
                     if (!answerText) return false;
                     
                     return (
                       answerText.toLowerCase().trim() === normalizedSubmitted ||
                       (typeof answer === 'object' && answer?.normalized && 
                        answer.normalized.toLowerCase().trim() === normalizedSubmitted) ||
                       (typeof answer === 'object' && answer?.aliases && Array.isArray(answer.aliases) && 
                        answer.aliases.some((alias: any) => 
                          alias && typeof alias === 'string' && alias.toLowerCase().trim() === normalizedSubmitted
                        ))
                     );
                   });
                 }
                 
                 return (
                   <TouchableOpacity 
                     key={index} 
                     style={[
                       styles.answerCard,
                       isRevealed && styles.revealedAnswerCard,
                       assignedTeam && styles.assignedAnswerCard,
                       !isMultiplayerMode && isTeamMode && !assignedTeam && styles.unassignedAnswerCard
                     ]}
                     onPress={() => {
                       // In team mode, allow host to assign unassigned answers
                       if (!isMultiplayerMode && isTeamMode && !assignedTeam) {
                         setSelectedAnswerIndex(index);
                         setSelectedAnswer(typeof answer === 'string' ? { text: answer, rank: index + 1, points: index + 1 } : answer);
                         setShowHostAssignModal(true);
                       }
                     }}
                     disabled={isMultiplayerMode || (isTeamMode && !!assignedTeam)}
                   >
                     <View style={styles.answerRankBadge}>
                       <Text style={styles.answerRankNumber}>
                         {typeof answer === 'string' ? index + 1 : answer.rank}
                       </Text>
                     </View>
                     <View style={[
                       styles.answerCardContent,
                       isRevealed && styles.revealedAnswerCardContent,
                       assignedTeam && styles.assignedAnswerCardContent,
                       !isMultiplayerMode && isTeamMode && !assignedTeam && styles.unassignedAnswerCardContent
                     ]}>
                       <Text style={styles.answerCardText}>
                         {isRevealed ? (
                           isMultiplayerMode 
                             ? (multiplayerState?.revealedAnswers?.[index]?.answerId || (typeof answer === 'string' ? answer : answer.text))
                             : (typeof answer === 'string' ? answer : answer.text)
                           ) : '🔒'}
                       </Text>
                       {isRevealed && assignedTeam && (
                           <View style={[styles.teamBadge, { backgroundColor: assignedTeam.color }]}>
                             <Text style={styles.teamBadgeText}>
                               {assignedTeam.name} (+{assignedPoints})
                             </Text>
                           </View>
                       )}
                     </View>
                   </TouchableOpacity>
                 );
               }) : (
                 <Text style={styles.noAnswersText}>No answers available</Text>
               )}
            </View>

            {/* End Game Button - Single Player Only */}
            {!isMultiplayerMode && (
              <TouchableOpacity 
                style={styles.endGameButton} 
                onPress={handleEndGame}
              >
                <Text style={styles.endGameButtonText}>End Game</Text>
              </TouchableOpacity>
            )}

          </View>
        )}


        {/* Results Phase - Show when game is finished */}

        {/* Question Complete Success Message */}
        {showQuestionComplete && (
          <View style={styles.successSection}>
            <Text style={styles.successTitle}>Question Complete!</Text>
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


        {/* Submitted Answers Section */}
        {(isMultiplayerMode ? multiplayerSubmittedAnswers : submittedAnswers).length > 0 && (
          <View style={styles.submittedAnswersSection}>
            <Text style={styles.submittedAnswersTitle}>Your Answers:</Text>
            {(isMultiplayerMode ? multiplayerSubmittedAnswers : submittedAnswers).map((answer, index) => (
              <Text key={index} style={styles.submittedAnswer}>
                • {answer}
              </Text>
            ))}
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
              <View style={styles.teamIndicatorLeft}>
                <Text style={styles.currentTeamLabel}>Current Turn:</Text>
                <View style={[styles.teamColorIndicator, { backgroundColor: getCurrentTeam()?.color }]} />
                <Text style={styles.teamName}>{getCurrentTeam()?.name}</Text>
              </View>
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
                logger.log(`🎯 Assigning "${selectedAnswer.text}" to ${team?.name} for ${points} points`);
                
                assignAnswerToTeam(selectedAnswerIndex, teamId, points);
                setShowHostAssignModal(false);
                setSelectedAnswerIndex(-1);
                setSelectedAnswer(null);
                
                // Show success feedback
                logger.log(`✅ Answer Assigned: "${selectedAnswer.text}" to ${team?.name} (+${points} points)`);
              }
            }}
            answer={selectedAnswer}
            answerIndex={selectedAnswerIndex}
            teams={teamGameState?.teams || []}
            currentTeamIndex={teamGameState?.currentTeamIndex || 0}
          />
        )}

        {/* Multiplayer Leaderboard Screen - Shows when game is finished */}
        {showMultiplayerLeaderboard && isMultiplayerMode && (
          <MultiplayerLeaderboardScreen
            players={getMultiplayerLeaderboardData()}
            onQuit={handleQuitMultiplayerGame}
            onCountdownComplete={handleMultiplayerLeaderboardComplete}
            countdownSeconds={15}
          />
        )}

        {/* Answer Input Section - Always visible */}
        {(() => {
          const shouldShowAnswer = !questionIsComplete && 
            ((isMultiplayerMode && multiplayerState?.gamePhase !== 'finished') ||
             (!isMultiplayerMode && gameState?.gamePhase !== 'finished')) && 
            !(!isMultiplayerMode && isTeamMode);
          
          logger.log('🎮 Answer input visibility check:', {
            questionIsComplete,
            isMultiplayerMode,
            gamePhase: multiplayerState?.gamePhase,
            currentPlayerId: multiplayerState?.currentPlayerId,
            myUserId: user?.id,
            isMyTurn: multiplayerState?.currentPlayerId === user?.id,
            shouldShowAnswer,
            revealedAnswersCount: Array.isArray(multiplayerState?.revealedAnswers) 
              ? multiplayerState.revealedAnswers.filter(ra => ra !== null).length 
              : 0,
            totalAnswers: currentQuestion?.answers?.length || 0
          });
          
          return shouldShowAnswer;
        })() && (
          <View style={styles.modernAnswerSection}>
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
                 borderColor: lastAnswerResult === 'correct' ? COLORS.success : 
                              lastAnswerResult === 'incorrect' ? COLORS.error : COLORS.muted
               }
             ]}>
               <TextInput 
                 placeholder="Enter your answer..." 
                 placeholderTextColor={COLORS.muted}
                 value={isMultiplayerMode ? (multiplayerCurrentAnswer || '') : currentAnswer} 
                 onChangeText={isMultiplayerMode ? setMultiplayerAnswer : setAnswer}
                 style={styles.answerInput}
                 editable={true}
               />
             </Animated.View>
             
             {/* Modern Submit Button */}
             <Animated.View style={[
               styles.modernSubmitContainer,
               { transform: [{ scale: submitButtonScale }] }
             ]}>
               <TouchableOpacity
                 style={[
                   styles.modernSubmitButton,
                   // Only apply grey styling when it's not your turn
                   (isMultiplayerMode && multiplayerState?.currentPlayerId !== user?.id) && styles.modernSubmitButtonNotMyTurn,
                   // Apply disabled styling when there's no answer AND it's your turn
                   (!(isMultiplayerMode ? (multiplayerCurrentAnswer || '') : currentAnswer).trim() && 
                    !(isMultiplayerMode && multiplayerState?.currentPlayerId !== user?.id)) && styles.modernSubmitButtonDisabled,
                   // Apply submitted styling when player has already submitted this turn
                   (isMultiplayerMode && hasSubmittedThisTurn) && styles.modernSubmitButtonSubmitted
                 ]}
                 onPress={handleSubmitAnswer}
                 disabled={
                   !(isMultiplayerMode ? (multiplayerCurrentAnswer || '') : currentAnswer).trim() ||
                   (isMultiplayerMode && hasSubmittedThisTurn)
                 }
               >
                 <Text style={[
                   styles.modernSubmitButtonText,
                   (isMultiplayerMode && multiplayerState?.currentPlayerId !== user?.id) && styles.modernSubmitButtonTextNotMyTurn,
                   (isMultiplayerMode && hasSubmittedThisTurn) && styles.modernSubmitButtonTextSubmitted
                 ]}>
                   {isMultiplayerMode && hasSubmittedThisTurn ? 'Submitted ✓' : 'Submit Answer'}
              </Text>
               </TouchableOpacity>
             </Animated.View>
             
             {/* Skip Turn Button - Modern Design */}
             {isMultiplayerMode && (
               <TouchableOpacity
                 style={[
                   styles.modernSkipButton,
                   (multiplayerState?.currentPlayerId !== user?.id) && styles.modernSkipButtonNotMyTurn
                 ]}
                 onPress={handleSkipTurn}
               >
                 <Text style={[
                   styles.modernSkipButtonText,
                   (multiplayerState?.currentPlayerId !== user?.id) && styles.modernSkipButtonTextNotMyTurn
                 ]}>
                   Skip Turn
                 </Text>
               </TouchableOpacity>
             )}
             
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
                   {lastAnswerResult === 'correct' 
                     ? `Correct! +${pointsEarned || 0} points` 
                     : 'Wrong Answer'}
              </Text>
               </Animated.View>
             )}
          </View>
        )}

        {/* Toast Notification */}
        <ToastNotification
          visible={toastNotification.visible}
          type={toastNotification.type}
          title={toastNotification.title}
          message={toastNotification.message}
          onHide={hideToast}
        />
     </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundTertiary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundTertiary
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold
  },
  connectionStatus: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium
  },
     header: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.sm,
     backgroundColor: COLORS.backgroundSecondary,
   },
   backButton: {
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
   },
   backButtonArrow: {
     color: '#FFFFFF',
     fontSize: 24,
     fontWeight: '600',
     textShadowColor: 'rgba(173, 216, 230, 0.6)',
     textShadowOffset: { width: 0, height: 0 },
     textShadowRadius: 8,
     includeFontPadding: false,
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
  headerLeft: {
    width: 80, // Same width as back button to maintain layout balance
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
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
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  successMessage: {
    color: '#94A3B8',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24
  },
  answerSection: {
    backgroundColor: '#1E1B4B', // Dark purple background for cohesive theme
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#8B5CF6' // Purple border for cohesive theme
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
    backgroundColor: '#6D28D9', // Darker purple to match modern submit button
    borderRadius: 12,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#5B21B6' // Darker purple border
  },
  skipTurnContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center'
  },
  skipTurnButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: '#DC2626',
    minWidth: 120
  },
  scoreSection: {
    backgroundColor: '#1E1B4B', // Dark purple background for cohesive theme
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6' // Purple border for cohesive theme
  },
  scoreTitle: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 12
  },
  submittedAnswersSection: {
    backgroundColor: '#1E1B4B', // Dark purple background for cohesive theme
    borderRadius: 20,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#8B5CF6' // Purple border for cohesive theme
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
     backgroundColor: 'rgba(139, 92, 246, 0.2)',
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
     justifyContent: 'space-between',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     backgroundColor: '#1E293B',
     borderRadius: 12,
     marginBottom: SPACING.md,
     borderWidth: 1,
     borderColor: '#475569'
   },
   teamIndicatorLeft: {
     flexDirection: 'row',
     alignItems: 'center',
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
   },
   
   // Turn-based system
   turnSystemSection: {
     backgroundColor: '#1E293B',
     borderRadius: 12,
     padding: SPACING.lg,
     marginBottom: SPACING.md,
     borderWidth: 1,
     borderColor: '#475569',
     alignItems: 'center'
   },
   turnSystemTitle: {
     color: '#F1F5F9',
     fontSize: 20,
     fontWeight: '700',
     textAlign: 'center',
     marginBottom: SPACING.sm
   },
   turnSystemSubtitle: {
     color: '#94A3B8',
     fontSize: 14,
     textAlign: 'center',
     marginBottom: SPACING.md
   },
   
   // Enhanced Turn Indicator Styles
   enhancedTurnIndicator: {
     backgroundColor: '#0F172A',
     borderRadius: 12,
     paddingVertical: 12,
     paddingHorizontal: 20,
     marginHorizontal: 16,
     marginVertical: 8,
     borderWidth: 2,
     borderColor: '#8B5CF6',
     shadowColor: '#8B5CF6',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.3,
     shadowRadius: 4,
     elevation: 6
   },
   turnContent: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     gap: 12
   },
   enhancedTurnText: {
     color: '#FFFFFF',
     fontSize: 16,
     fontWeight: '700',
     textAlign: 'center',
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2
   },
   turnTimerContainer: {
     backgroundColor: '#334155',
     borderRadius: 8,
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     borderWidth: 1,
     borderColor: '#475569'
   },
   turnTimerText: {
     color: '#F1F5F9',
     fontSize: 18,
     fontWeight: '600',
     textAlign: 'center'
   },
   submitButtonDisabled: {
     backgroundColor: '#6D28D9', // Same purple color when disabled
     opacity: 0.6
   },
   hostControlsTitle: {
     color: '#F1F5F9',
     fontSize: 18,
     fontWeight: '700',
     textAlign: 'center',
     marginBottom: SPACING.sm
   },
   hostControlsSubtitle: {
     color: '#94A3B8',
     fontSize: 14,
     textAlign: 'center',
     marginBottom: SPACING.md
   },
   hostControlsGrid: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: SPACING.sm
   },
   hostControlButton: {
     backgroundColor: '#334155',
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#475569',
     minWidth: 120
   },
   hostControlButtonRevealed: {
     backgroundColor: '#059669',
     borderColor: '#047857'
   },
   hostControlButtonText: {
     color: '#E2E8F0',
     fontSize: 14,
     fontWeight: '600',
     textAlign: 'center'
   },
   hostControlButtonTextRevealed: {
     color: '#D1FAE5'
   },
   hostActionButtons: {
     marginTop: SPACING.md,
     alignItems: 'center',
     gap: SPACING.sm
   },
   nextQuestionButton: {
     backgroundColor: '#8B5CF6',
     paddingHorizontal: SPACING.lg,
     paddingVertical: SPACING.md,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#7C3AED'
   },
   nextQuestionButtonText: {
     color: 'white',
     fontSize: 16,
     fontWeight: '600'
   },
   
   // Game status styles
   gameStatusSection: {
     backgroundColor: 'rgba(139, 92, 246, 0.1)',
     borderRadius: 12,
     padding: SPACING.lg,
     marginBottom: SPACING.md,
     borderWidth: 1,
     borderColor: 'rgba(139, 92, 246, 0.3)'
   },
   gameStatusText: {
     color: '#8B5CF6',
     fontSize: 16,
     fontWeight: '600',
     textAlign: 'center',
     marginBottom: SPACING.xs
   },
   gameStatusSubtext: {
     color: '#A78BFA',
     fontSize: 14,
     textAlign: 'center'
   },

  // Modern Trivia Game Styles
  questionCard: {
    backgroundColor: '#1E1B4B', // Dark purple background
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#8B5CF6', // Purple shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)', // Purple border
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  questionCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    lineHeight: 26,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // Modern Timer Styles
  modernTimerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activeTimer: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  waitingTimer: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  timerNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  turnPlayerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 8,
  },

  // Modern Answer Grid Styles
  answerGridContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  answerTimerContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  answerTimerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  answerTimerText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#8B5CF6',
    textAlign: 'center',
    textShadowColor: 'rgba(139, 92, 246, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Warning state (≤10 seconds)
  answerTimerContainerWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.5)',
    shadowColor: '#FBBF24',
  },
  answerTimerLabelWarning: {
    color: '#FBBF24',
  },
  answerTimerTextWarning: {
    color: '#FBBF24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
  },
  // Critical state (≤5 seconds)
  answerTimerContainerCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    shadowColor: '#EF4444',
    borderWidth: 3,
  },
  answerTimerLabelCritical: {
    color: '#EF4444',
  },
  answerTimerTextCritical: {
    color: '#EF4444',
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
    fontSize: 36,
  },
  // Turn Indicator Styles
  turnIndicator: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  turnIndicatorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
    textAlign: 'center',
  },
  turnTimerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A78BFA',
    textAlign: 'center',
  },
  // High contrast accessibility styles
  answerTimerContainerHighContrast: {
    backgroundColor: '#000000',
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  answerTimerLabelHighContrast: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  answerTimerTextHighContrast: {
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'transparent',
  },
  answerGridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  endGameButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  answerCard: {
    width: '48%',
    backgroundColor: 'rgba(139, 92, 246, 0.2)', // More solid purple background
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#8B5CF6', // Purple shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.8)', // More vibrant purple border
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  revealedAnswerCard: {
    borderColor: 'rgba(16, 185, 129, 0.8)', // Green border for revealed answers
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // More solid green background
  },
  assignedAnswerCard: {
    borderColor: 'rgba(139, 92, 246, 0.9)', // Vibrant purple border for assigned
    backgroundColor: 'rgba(99, 102, 241, 0.2)', // More solid purple background
  },
  unassignedAnswerCard: {
    borderColor: 'rgba(167, 139, 250, 0.7)', // Lighter purple border for unassigned
    backgroundColor: 'rgba(245, 158, 11, 0.2)', // More solid orange background
  },
  // Content area styles for different states
  revealedAnswerCardContent: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)', // Solid green background for revealed content
  },
  assignedAnswerCardContent: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)', // Solid purple background for assigned content
  },
  unassignedAnswerCardContent: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)', // Solid orange background for unassigned content
  },
  answerRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6', // Purple background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)', // Purple border
  },
  answerRankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  answerCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 40,
    marginLeft: 4, // Small margin from the rank badge
    backgroundColor: 'rgba(139, 92, 246, 0.3)', // Solid purple background for the inner area
    borderRadius: 6,
  },
  answerCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E2E8F0', // Light text for dark background
    lineHeight: 18,
    textAlign: 'center',
  },
  teamBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  teamBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Modern Answer Input Styles
  modernAnswerSection: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  answerSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Modern Submit Button Styles
  modernSubmitContainer: {
    marginTop: 16,
  },
  modernSubmitButton: {
    backgroundColor: '#6D28D9', // Darker purple
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#6D28D9', // Darker purple shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modernSubmitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  modernSubmitButtonNotMyTurn: {
    backgroundColor: '#6B7280', // Grey when not my turn
    shadowOpacity: 0.1,
  },
  modernSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernSubmitButtonTextNotMyTurn: {
    color: '#9CA3AF', // Grey text when not my turn
  },
  modernSubmitButtonSubmitted: {
    backgroundColor: '#10B981', // Green when submitted
    shadowOpacity: 0.2,
  },
  modernSubmitButtonTextSubmitted: {
    color: '#FFFFFF', // White text when submitted
  },

  // Modern Skip Button Styles
  modernSkipButton: {
    backgroundColor: '#6D28D9', // Darker purple to match submit button
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6D28D9', // Darker purple shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modernSkipButtonNotMyTurn: {
    backgroundColor: '#6B7280', // Grey when not my turn
    shadowOpacity: 0.1,
  },
  modernSkipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modernSkipButtonTextNotMyTurn: {
    color: '#9CA3AF', // Grey text when not my turn
  },
  modernSkipButtonDisabled: {
    backgroundColor: '#6D28D9', // Same purple color when disabled
    shadowOpacity: 0.1,
    opacity: 0.6, // Make it slightly transparent to show disabled state
  },
  modernSkipButtonTextDisabled: {
    color: '#FFFFFF', // White text when disabled (same as enabled)
  },
  noAnswersText: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    padding: SPACING.lg,
    fontStyle: 'italic',
  },
});

export default GameScreen;



import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import AvatarIcon from '../components/AvatarIcon';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';
import { Player } from '../services/multiplayerService';
import RoundTimeSelector from '../components/RoundTimeSelector';

const { width } = Dimensions.get('window');

interface RoomLobbyScreenProps {}

const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { 
    currentRoom,
    isHost,
    playerRole,
    loading,
    isStarting,
    error,
    leaveRoom,
    startGame,
    endGame,
    kickPlayer,
    clearError,
    resetAll,
    cleanup,
    setNavigationCallback
  } = useMultiplayer();

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [showRoundTimeSelector, setShowRoundTimeSelector] = useState(false);
  // Get turn duration from route params if available
  const routeParams = route.params as { roomCode: string; turnDuration?: number };
  const initialTurnDuration = routeParams?.turnDuration || 60;
  const [selectedRoundTime, setSelectedRoundTime] = useState(initialTurnDuration);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Set up navigation callback for auto-navigation when game starts
  useEffect(() => {
    setNavigationCallback((params: any) => {
      logger.log('🎮 RoomLobbyScreen: Auto-navigating to GameScreen with params:', params);
      navigation.navigate('GameScreen', params);
    });
  }, [navigation]);

  // Handle back button to prevent accidental exits
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Leave Room',
        'Are you sure you want to leave this room? This will end the room session.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Leave Room', 
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveRoom();
                navigation.goBack();
              } catch (error) {
                logger.error('Error leaving room:', error);
                navigation.goBack();
              }
            }
          }
        ]
      );
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [leaveRoom, navigation]);

  const handleLeaveRoom = async () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room? This will end the room session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave Room', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Clean up any existing room session
              await leaveRoom();
              
              // Reset all multiplayer state
              resetAll();
              
              // Clean up listeners and connections
              cleanup();
              
              // Navigate back to multiplayer menu
              navigation.navigate('MultiplayerMenu' as never);
            } catch (error) {
              logger.error('Error leaving room:', error);
              // Even if there's an error, still clean up and navigate
              resetAll();
              cleanup();
              navigation.navigate('MultiplayerMenu' as never);
            }
          }
        }
      ]
    );
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;
    
    const playerCount = Object.keys(currentRoom.players).length;
    if (playerCount < 2) {
      Alert.alert('Not Enough Players', 'You need at least 2 players to start the game');
      return;
    }

    Alert.alert(
      'Start Game',
      `Start the game with ${playerCount} players?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Game', 
          onPress: async () => {
            try {
              logger.log(`🎮 Host starting game with ${selectedRoundTime}s rounds...`);
              await startGame(selectedRoundTime);
              logger.log('🎮 Game start command sent, waiting for auto-navigation...');
              // Navigation will be handled automatically by the context
            } catch (error) {
              logger.error('Error starting game:', error);
              Alert.alert('Error', 'Failed to start the game. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEndGame = async () => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end the game? All players will be returned to the lobby.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Game', 
          style: 'destructive',
          onPress: async () => {
            try {
              await endGame();
            } catch (error) {
              // Error handled by context
            }
          }
        }
      ]
    );
  };

  const handleResetRoom = async () => {
    try {
      if (currentRoom && user?.id) {
        const { multiplayerService } = require('../services/multiplayerService');
        await multiplayerService.resetRoomStatusV2(currentRoom.roomCode, user.id);
        Alert.alert('Success', 'Room status has been reset to lobby');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset room status');
    }
  };

  const handleKickPlayer = (player: Player) => {
    Alert.alert(
      'Remove Player',
      `Remove ${player.name || 'Unknown Player'} from the room?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await kickPlayer(player.id);
            } catch (error) {
              // Error handled by context
            }
          }
        }
      ]
    );
  };


  if (!currentRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Debug logging
  logger.log('RoomLobbyScreen - currentRoom:', {
    roomCode: currentRoom.roomCode,
    playersCount: Object.keys(currentRoom.players).length,
    players: Object.values(currentRoom.players).map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost
    }))
  });

  const players = Object.values(currentRoom.players).filter(player => {
    if (!player || !player.id) {
      logger.warn('Invalid player found:', player);
      return false;
    }
    if (!player.name) {
      logger.warn('Player with undefined name found:', player);
      player.name = 'Unknown Player'; // Fix it in place
    }
    return true;
  });
  const playerCount = players.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={handleLeaveRoom}
          accessibilityLabel="Exit room and end session"
        >
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Room Lobby</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Room Code Display */}
          <View style={styles.roomCodeSection}>
            <Text style={styles.roomCodeLabel}>Room Code</Text>
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeText}>{currentRoom.roomCode}</Text>
            </View>
            <Text style={styles.roomCodeHint}>
              Share this code with friends to invite them
            </Text>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfoSection}>
            <Text style={styles.gameInfoTitle}>Game Details</Text>
            <View style={styles.gameInfoGrid}>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Category</Text>
                <Text style={styles.gameInfoValue}>{currentRoom.category}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Question</Text>
                <Text style={[styles.gameInfoValue, styles.questionText]}>
                  {currentRoom.questions[0]?.text || 'No question selected'}
                </Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Players</Text>
                <Text style={styles.gameInfoValue}>{playerCount}/{currentRoom.maxPlayers}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Status</Text>
                <Text style={[
                  styles.gameInfoValue,
                  (styles as any)[`status${currentRoom.status.charAt(0).toUpperCase() + currentRoom.status.slice(1)}`]
                ]}>
                  {currentRoom.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Players List */}
          <View style={styles.playersSection}>
            <Text style={styles.playersTitle}>
              Players ({playerCount})
            </Text>
            <View style={styles.playersList}>
              {players.map((player, index) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerInfo}>
                    <AvatarIcon 
                      user={{ 
                        id: player.id, 
                        displayName: player.name || 'Player', 
                        email: `${player.id}@player.local`,
                        selectedAvatar: player.selectedAvatar 
                      }} 
                      size={32} 
                      showBorder={true}
                      borderColor={COLORS.primary}
                    />
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {player.name || 'Unknown Player'}
                        {player.isHost && ' (Host)'}
                      </Text>
                      <Text style={styles.playerStatus}>
                        {player.isConnected ? 'Connected' : 'Disconnected'}
                      </Text>
                    </View>
                  </View>
                  {isHost && !player.isHost && (
                    <TouchableOpacity
                      style={styles.kickButton}
                      onPress={() => handleKickPlayer(player)}
                      accessibilityLabel={`Remove ${player.name || 'Unknown Player'}`}
                    >
                      <Text style={styles.kickButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Host Controls */}
          {isHost && (
            <View style={styles.hostControlsSection}>
              <Text style={styles.hostControlsTitle}>Host Controls</Text>
              
              {/* Round Time Selector */}
              <View style={styles.roundTimeSection}>
                <Text style={styles.roundTimeLabel}>Round Time</Text>
                <TouchableOpacity
                  style={styles.roundTimeButton}
                  onPress={() => setShowRoundTimeSelector(true)}
                  accessibilityLabel="Select round time"
                >
                  <Text style={styles.roundTimeButtonText}>
                    {selectedRoundTime === 10 ? '10 seconds' :
                     selectedRoundTime === 20 ? '20 seconds' :
                     selectedRoundTime === 40 ? '40 seconds' :
                     '1 minute'}
                  </Text>
                  <Text style={styles.roundTimeButtonIcon}>⚙️</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.hostControlsButtons}>
                <TouchableOpacity
                  style={[
                    styles.startGameButton,
                    playerCount < 2 && styles.startGameButtonDisabled
                  ]}
                  onPress={handleStartGame}
                  disabled={playerCount < 2 || loading || isStarting}
                  accessibilityLabel="Start the game"
                >
                  {(loading || isStarting) ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.startGameButtonText}>
                      {isStarting ? 'Starting...' : `Start Game (${playerCount} players)`}
                    </Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.endGameButton}
                  onPress={handleEndGame}
                  accessibilityLabel="End the game"
                >
                  <Text style={styles.endGameButtonText}>End Game</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.endGameButton, { backgroundColor: COLORS.warning }]}
                  onPress={handleResetRoom}
                  accessibilityLabel="Reset room status"
                >
                  <Text style={styles.endGameButtonText}>Reset Room</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Waiting Message for Players */}
          {!isHost && (
            <View style={styles.waitingSection}>
              <Text style={styles.waitingTitle}>Waiting for Host</Text>
              <Text style={styles.waitingSubtitle}>
                The host will start the game when ready
              </Text>
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.waitingSpinner} />
            </View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Round Time Selector Modal */}
      <RoundTimeSelector
        visible={showRoundTimeSelector}
        onClose={() => setShowRoundTimeSelector(false)}
        onSelect={(timeInSeconds) => {
          setSelectedRoundTime(timeInSeconds);
          logger.log(`🎮 Round time selected: ${timeInSeconds} seconds`);
        }}
        currentTime={selectedRoundTime}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  exitButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  exitButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  animatedContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: SPACING.md,
  },
  roomCodeSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  roomCodeLabel: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roomCodeText: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    letterSpacing: 4,
    marginRight: SPACING.md,
  },
  roomCodeHint: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  gameInfoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  gameInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  gameInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  gameInfoItem: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
  },
  gameInfoLabel: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  gameInfoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  questionText: {
    flex: 1,
    flexWrap: 'nowrap',
    textAlign: 'left',
  },
  statusLobby: {
    color: COLORS.primary,
  },
  statusPlaying: {
    color: COLORS.success,
  },
  statusFinished: {
    color: COLORS.muted,
  },
  playersSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  playersList: {
    gap: SPACING.sm,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  playerAvatarText: {
    color: COLORS.white,
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  playerDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  playerStatus: {
    fontSize: 12,
    color: COLORS.muted,
  },
  kickButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
  },
  kickButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  hostControlsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  hostControlsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  hostControlsButtons: {
    gap: SPACING.md,
  },
  startGameButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  startGameButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  startGameButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.white,
  },
  endGameButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  endGameButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.white,
  },
  roundTimeSection: {
    marginBottom: SPACING.lg,
  },
  roundTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roundTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  roundTimeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  roundTimeButtonIcon: {
    fontSize: 16,
  },
  waitingSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  waitingSpinner: {
    marginTop: SPACING.md,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  statusWaiting: {
    color: COLORS.warning,
  },
  statusStarting: {
    color: COLORS.info,
  },
});

export default RoomLobbyScreen;

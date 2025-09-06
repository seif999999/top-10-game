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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';
import { Player } from '../services/multiplayerService';

const { width } = Dimensions.get('window');

interface RoomLobbyScreenProps {}

const RoomLobbyScreen: React.FC<RoomLobbyScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
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
      console.log('🎮 RoomLobbyScreen: Auto-navigating to GameScreen with params:', params);
      navigation.navigate('GameScreen' as never, params as never);
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
                console.error('Error leaving room:', error);
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
              console.error('Error leaving room:', error);
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
              console.log('🎮 Host starting game...');
              await startGame();
              console.log('🎮 Game start command sent, waiting for auto-navigation...');
              // Navigation will be handled automatically by the context
            } catch (error) {
              console.error('Error starting game:', error);
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
  console.log('RoomLobbyScreen - currentRoom:', {
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
      console.warn('Invalid player found:', player);
      return false;
    }
    if (!player.name) {
      console.warn('Player with undefined name found:', player);
      player.name = 'Unknown Player'; // Fix it in place
    }
    return true;
  });
  const playerCount = players.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.title}>Room Lobby</Text>
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
          accessibilityLabel="Leave room and end session"
        >
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  // Copy to clipboard functionality would go here
                  Alert.alert('Copied!', 'Room code copied to clipboard');
                }}
                accessibilityLabel="Copy room code"
              >
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
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
                <Text style={styles.gameInfoLabel}>Questions</Text>
                <Text style={styles.gameInfoValue}>{currentRoom.questions.length}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Players</Text>
                <Text style={styles.gameInfoValue}>{playerCount}/{currentRoom.maxPlayers}</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoLabel}>Status</Text>
                <Text style={[
                  styles.gameInfoValue,
                  styles[`status${currentRoom.status.charAt(0).toUpperCase() + currentRoom.status.slice(1)}`]
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
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {(player.name || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>
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
                  style={[styles.endGameButton, { backgroundColor: COLORS.orange }]}
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
  },
  leaveButton: {
    padding: SPACING.sm,
  },
  leaveButtonText: {
    fontSize: 16,
    color: COLORS.error,
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
  copyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  copyButtonText: {
    color: COLORS.white,
    fontWeight: '600' as const,
    fontSize: 14,
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
});

export default RoomLobbyScreen;

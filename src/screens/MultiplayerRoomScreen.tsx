import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';
import { MultiplayerRoomScreenProps } from '../types/navigation';
import { 
  createRoom, 
  joinRoom, 
  subscribeToRoom, 
  updateRoomGameState,
  updateRoomQuestions,
  handleHostLeaving,
  RoomData 
} from '../services/roomService';
import { getQuestionsByCategory } from '../services/questionsService';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_SPACING = 20;

// Categories data - same as CategoriesCarouselScreen
const categories = [
  {
    id: 'Sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Athletics, games, and competitions',
    color: '#FF6B6B',
    questions: 10
  },
  {
    id: 'Movies',
    name: 'Movies & TV',
    icon: '🎬',
    description: 'Films, television, and entertainment',
    color: '#4ECDC4',
    questions: 10
  },
  {
    id: 'Music',
    name: 'Music',
    icon: '🎵',
    description: 'Songs, artists, and musical genres',
    color: '#45B7D1',
    questions: 10
  },
  {
    id: 'Geography',
    name: 'Geography',
    icon: '🌍',
    description: 'Countries, cities, and landmarks',
    color: '#96CEB4',
    questions: 10
  },
  {
    id: 'History',
    name: 'History',
    icon: '📚',
    description: 'Historical events and figures',
    color: '#FFEAA7',
    questions: 10
  },
  {
    id: 'Science',
    name: 'Science',
    icon: '🔬',
    description: 'Scientific discoveries and facts',
    color: '#DDA0DD',
    questions: 10
  },
  {
    id: 'Food',
    name: 'Food & Drink',
    icon: '🍕',
    description: 'Cuisines, dishes, and beverages',
    color: '#FFB347',
    questions: 10
  },
  {
    id: 'Technology',
    name: 'Technology',
    icon: '💻',
    description: 'Computers, gadgets, and innovation',
    color: '#87CEEB',
    questions: 10
  }
];

const MultiplayerRoomScreen: React.FC<MultiplayerRoomScreenProps> = ({ route, navigation }) => {
  const { categoryName, categoryId, roomCode: joinedRoomCode } = route.params;
  const { user } = useAuth();
  
  // Sporcle-like flow state management
  // Mode determines what screen we show:
  // - 'mode_select': Create Room vs Join Room (Sporcle's first screen)
  // - 'create_flow': Host picks category then creates room  
  // - 'join_flow': Player enters room code
  // - 'question_selection': Host selects questions for the game
  // - 'room_lobby': Room waiting area with players
  const [mode, setMode] = useState<'mode_select' | 'create_flow' | 'join_flow' | 'question_selection' | 'room_lobby'>(
    joinedRoomCode ? 'room_lobby' : 'mode_select'
  );
  const [joinRoomCode, setJoinRoomCode] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Reset all selections function
  const resetAllSelections = () => {
    setSelectedCategory(null);
    setSelectedQuestions([]);
    setAvailableQuestions([]);
    setJoinRoomCode('');
  };

  // Render category card for carousel
  const renderCategoryCard = ({ item, index }: { item: typeof categories[0]; index: number }) => {
    const isSelected = selectedCategory === item.id;
    const isCreating = loading && selectedCategory === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          { 
            backgroundColor: item.color,
            transform: [{ scale: isSelected ? 1.05 : 1 }],
            opacity: loading && !isCreating ? 0.6 : 1
          }
        ]}
        onPress={() => {
          setSelectedCategory(item.id);
          handleCreateRoom(item.id, item.name);
        }}
        activeOpacity={0.8}
        disabled={loading}
      >
        <View style={styles.cardContent}>
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryDescription}>{item.description}</Text>
          <View style={styles.questionCount}>
            <Text style={styles.questionCountText}>{item.questions} Questions</Text>
          </View>
        </View>
        
        {/* Play Button */}
        <View style={styles.playButton}>
          {isCreating ? (
            <View style={styles.creatingButton}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.playButtonText}>Creating...</Text>
            </View>
          ) : (
            <Text style={styles.playButtonText}>🎯 Create Room</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Subscription cleanup
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Reset selections when component mounts (fresh start)
  useEffect(() => {
    if (!joinedRoomCode) {
      resetAllSelections();
    }
  }, []);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  // Handle joining room on mount if roomCode provided
  useEffect(() => {
    if (joinedRoomCode) {
      console.log(`🎯 Auto-subscribing to joined room: ${joinedRoomCode}`);
      subscribeToNewRoom(joinedRoomCode);
    }
  }, [joinedRoomCode]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const showError = (message: string) => {
    setError(message);
    console.error('MultiplayerRoomScreen Error:', message);
  };

  const showSuccess = (message: string) => {
    Alert.alert('Success', message);
    console.log('MultiplayerRoomScreen Success:', message);
  };

  // Subscribe to room updates
  const subscribeToNewRoom = (roomCode: string) => {
    // Cleanup existing subscription
    if (unsubscribe) {
      unsubscribe();
    }

    const newUnsubscribe = subscribeToRoom(roomCode, (roomData) => {
      console.log(`🔄 Room ${roomCode} data updated:`, roomData);
      setCurrentRoom(roomData);
      
      if (roomData) {
        console.log(`👥 Players in room: [${roomData.players.join(', ')}]`);
        console.log(`🎯 Host: ${roomData.hostId}, Current user: ${auth.currentUser?.uid}`);
        console.log(`🎮 Game state: ${roomData.gameState}`);
        
        if (roomData.gameState === 'playing') {
          console.log(`🚀 Game started! All players navigating to game...`);
          // Navigate to game screen when host starts the game
          navigateToGame(roomData.roomCode, roomData.category || categoryName);
        }

        // If we're in question selection and questions are already selected, go to lobby
        if (mode === 'question_selection' && roomData.questions && roomData.questions.length > 0) {
          console.log('📝 Questions already selected, moving to lobby');
          setMode('room_lobby');
        }

        // Handle host leaving edge case
        if (roomData.gameState === 'finished' && roomData.players.length === 0) {
          console.log('🏠 Room was deleted by host, returning to mode selection');
          setError('Host left and room was deleted');
          resetAllSelections();
          setCurrentRoom(null);
          setMode('mode_select');
        }
      }
    });

    setUnsubscribe(() => newUnsubscribe);
  };

  // Navigate to game screen when game starts
  const navigateToGame = (roomCode: string, category?: string) => {
    navigation.navigate('GameScreen', {
      roomId: roomCode,
      categoryId: category || 'Unknown',
      categoryName: category || 'Unknown',
      isMultiplayer: true,
      selectedQuestion: currentRoom?.questions || []
    });
  };

  // Sporcle Flow: Create Room after category selection
  const handleCreateRoom = async (selectedCategoryId: string, selectedCategoryName: string) => {
    setError(''); // Clear any previous errors
    
    // Small delay to make the selection feel responsive
    setTimeout(() => {
      setLoading(true);
    }, 100);
    
    try {
      console.log(`🎮 Creating room for category: ${selectedCategoryName}`);
      const roomCode = await createRoom(selectedCategoryName, 4);
      
      console.log(`✅ Room created successfully: ${roomCode}`);
      console.log(`🎯 Host ${auth.currentUser?.uid} is now both host AND player in room ${roomCode}`);
      
      // Load questions for this category
      const questions = getQuestionsByCategory(selectedCategoryName);
      setAvailableQuestions(questions);
      setSelectedCategory(selectedCategoryName);
      // Reset question selections for fresh start
      setSelectedQuestions([]);
      
      // Subscribe to room updates and switch to question selection
      subscribeToNewRoom(roomCode);
      setMode('question_selection');
      
      showSuccess(`Room created! Code: ${roomCode} - Now select questions`);
    } catch (err) {
      console.error('🚨 Room creation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(`Room creation failed: ${errorMessage}`);
      setMode('create_flow');
      // Reset selection on error
      setSelectedCategory(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle question selection
  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Handle finishing question selection
  const handleFinishQuestionSelection = async () => {
    if (selectedQuestions.length === 0) {
      showError('Please select at least one question');
      return;
    }

    if (!currentRoom) {
      showError('Room not found');
      return;
    }

    setLoading(true);
    try {
      const selectedQuestionsData = availableQuestions.filter(q => selectedQuestions.includes(q.id));
      await updateRoomQuestions(currentRoom.roomCode, selectedQuestionsData);
      
      // Transition to room lobby
      setMode('room_lobby');
      showSuccess(`Selected ${selectedQuestions.length} questions! Ready to start game.`);
    } catch (error) {
      console.error('Error saving questions:', error);
      showError('Failed to save question selection');
    } finally {
      setLoading(false);
    }
  };

  // Sporcle Flow: Join existing room with code
  const handleJoinRoom = async () => {
    if (!joinRoomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    // Validate room code format
    const normalizedCode = joinRoomCode.toUpperCase().trim();
    if (normalizedCode.length !== 6) {
      setError('Room code must be 6 characters long');
      return;
    }

    if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
      setError('Room code can only contain letters and numbers');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const normalizedRoomCode = joinRoomCode.trim().toUpperCase();
      console.log(`👥 Player attempting to join room: ${normalizedRoomCode}`);
      
      await joinRoom(normalizedRoomCode);
      
      console.log(`✅ Successfully joined room: ${normalizedRoomCode}`);
      console.log(`🔄 Subscribing to room updates...`);
      
      // Subscribe to room updates and switch to room lobby
      subscribeToNewRoom(normalizedRoomCode);
      setMode('room_lobby');
      
      setJoinRoomCode('');
      showSuccess(`Successfully joined room: ${normalizedRoomCode}`);
    } catch (err) {
      console.error('🚨 Room join failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      showError(`Join failed: ${errorMessage}`);
      // Stay in join_flow mode to try again
    } finally {
      setLoading(false);
    }
  };

  // Start the game (host only)
  const handleStartGame = async () => {
    if (!currentRoom) return;
    
    if (currentRoom.players.length < 2) {
      showError('Need at least 2 players to start the game');
      return;
    }

    setLoading(true);
    try {
      console.log(`🎮 Host ${auth.currentUser?.uid} starting game for room ${currentRoom.roomCode}`);
      console.log(`👥 All players who will join game: [${currentRoom.players.join(', ')}]`);
      console.log(`📁 Category: ${currentRoom.category}`);
      
      // Update room state to 'playing' so all players start the game
      await updateRoomGameState(currentRoom.roomCode, 'playing');
      console.log(`✅ Room state changed to 'playing' - all players will receive real-time update`);
    } catch (error) {
      showError('Failed to start game. Please try again.');
      console.error('Error starting game:', error);
    } finally {
      setLoading(false);
    }
  };

  // Leave current room and go back to mode selection
  const handleLeaveRoom = async () => {
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    
    setCurrentRoom(null);
    setMode('mode_select');
  };

  const isHost = currentRoom?.hostId === auth.currentUser?.uid;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (mode === 'join_flow' || mode === 'create_flow') {
                // Reset category selection when leaving create flow
                resetAllSelections();
                setMode('mode_select');
              } else if (mode === 'question_selection') {
                // Reset question selection when going back to create flow
                setSelectedQuestions([]);
                setAvailableQuestions([]);
                setMode('create_flow');
              } else if (mode === 'room_lobby') {
                // Reset all selections when leaving room
                resetAllSelections();
                handleLeaveRoom();
              } else {
                navigation.goBack();
              }
            }} 
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              {mode === 'mode_select' ? 'Multiplayer' : 
               mode === 'create_flow' ? 'Create Room' :
               mode === 'join_flow' ? 'Join Room' :
               mode === 'question_selection' ? 'Select Questions' :
               mode === 'room_lobby' ? 'Room' : 'Multiplayer'}
            </Text>
            <Text style={styles.subtitle}>
              {currentRoom?.category || 'Choose your option'}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Error Display - Only show for specific modes */}
        {error && (mode === 'join_flow' || mode === 'question_selection') ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Sporcle Mode Selection - Create Room or Join Room */}
        {mode === 'mode_select' && (
          <View style={styles.modeContainer}>
            <Text style={styles.modeTitle}>Multiplayer Game</Text>
            
            {/* Create Room - Sporcle Style */}
            <TouchableOpacity
              style={[styles.modeButton, styles.hostButton]}
              onPress={() => setMode('create_flow')}
              disabled={loading}
            >
              <Text style={styles.modeButtonIcon}>🎯</Text>
              <Text style={styles.modeButtonTitle}>Create Room</Text>
              <Text style={styles.modeButtonDescription}>
                Choose a category and create a room for friends
              </Text>
            </TouchableOpacity>

            {/* Join Room - Sporcle Style */}
            <TouchableOpacity
              style={[styles.modeButton, styles.playerButton]}
              onPress={() => setMode('join_flow')}
              disabled={loading}
            >
              <Text style={styles.modeButtonIcon}>🚪</Text>
              <Text style={styles.modeButtonTitle}>Join Room</Text>
              <Text style={styles.modeButtonDescription}>
                Enter a room code to join an existing game
              </Text>
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>How it works:</Text>
              <Text style={styles.instructionsText}>
                🎯 <Text style={styles.bold}>Create:</Text> Pick category → Get room code → Share with friends{'\n'}
                🚪 <Text style={styles.bold}>Join:</Text> Enter room code → Play the host's category
              </Text>
            </View>
          </View>
        )}

        {/* Sporcle Create Flow - Category Carousel */}
        {mode === 'create_flow' && (
          <View style={styles.createFlowContainer}>
            <Text style={styles.createFlowTitle}>Choose a Category</Text>
            <Text style={styles.createFlowSubtitle}>Swipe to browse categories • Tap to create room</Text>
            
            {/* Category Carousel - Same as CategoriesCarouselScreen */}
            <View style={styles.carouselContainer}>
              <FlatList
                data={categories}
                renderItem={renderCategoryCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContent}
                ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
              />
            </View>
          </View>
        )}

        {/* Sporcle Join Flow - Room Code Input */}
        {mode === 'join_flow' && (
          <View style={styles.joinContainer}>
            <Text style={styles.joinTitle}>Enter Room Code</Text>
            <Text style={styles.joinSubtitle}>
              Ask the host for their 6-character room code
            </Text>
            
            <TextInput
              style={styles.roomCodeInput}
              placeholder="ABC123"
              value={joinRoomCode}
              onChangeText={setJoinRoomCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            
            <View style={styles.joinButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  resetAllSelections(); // Reset all selections
                  setMode('mode_select');
                }}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, (!joinRoomCode.trim() || loading) && styles.disabledButton]}
                onPress={handleJoinRoom}
                disabled={loading || !joinRoomCode.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Join Room</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Question Selection - Host selects questions */}
        {mode === 'question_selection' && (
          <View style={styles.questionSelectionContainer}>
            <Text style={styles.questionSelectionTitle}>Select Questions</Text>
            <Text style={styles.questionSelectionSubtitle}>
              Choose which questions to play in your {selectedCategory} room
            </Text>
            
            <ScrollView style={styles.questionsList} showsVerticalScrollIndicator={false}>
              {availableQuestions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.questionItem,
                    selectedQuestions.includes(question.id) && styles.questionItemSelected
                  ]}
                  onPress={() => handleQuestionToggle(question.id)}
                >
                  <View style={styles.questionContent}>
                    <Text style={styles.questionTitle}>{question.title}</Text>
                    <Text style={styles.questionDifficulty}>
                      {question.difficulty} • {question.answers.length} answers
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedQuestions.includes(question.id) && styles.checkboxSelected
                  ]}>
                    {selectedQuestions.includes(question.id) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.questionSelectionFooter}>
              <Text style={styles.selectedCount}>
                {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (selectedQuestions.length === 0 || loading) && styles.disabledButton
                ]}
                onPress={handleFinishQuestionSelection}
                disabled={selectedQuestions.length === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Finish Selection</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Sporcle Room Lobby - Waiting Area */}
        {mode === 'room_lobby' && currentRoom && (
          <View style={styles.roomContainer}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomCode}>Room: {currentRoom.roomCode}</Text>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => {
                  Alert.alert('Share Room Code', `Share this code with friends: ${currentRoom.roomCode}`);
                }}
              >
                <Text style={styles.shareButtonText}>📋 Share Code</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.roomCategory}>Category: {currentRoom.category}</Text>
            <Text style={styles.roomSubtitle}>
              {isHost ? 'You are the host and a player' : `Host: ${currentRoom.hostId}`}
            </Text>
            
            {/* Question Status */}
            <View style={styles.questionStatusContainer}>
              {currentRoom.questions && currentRoom.questions.length > 0 ? (
                <View style={styles.questionStatusReady}>
                  <Text style={styles.questionStatusText}>
                    ✅ {currentRoom.questions.length} question{currentRoom.questions.length !== 1 ? 's' : ''} selected
                  </Text>
                </View>
              ) : (
                <View style={styles.questionStatusWaiting}>
                  <Text style={styles.questionStatusText}>
                    ⏳ Waiting for host to pick questions...
                  </Text>
                </View>
              )}
            </View>
            
            {/* Player List */}
            <View style={styles.playersContainer}>
              <Text style={styles.playersTitle}>Players ({currentRoom.players.length}/4)</Text>
              <Text style={styles.playersSubtitle}>All players including host will play together</Text>
              {currentRoom.players.map((playerId, index) => (
                <View key={index} style={styles.playerItem}>
                  <Text style={styles.playerName}>
                    {playerId === auth.currentUser?.uid ? 'You' : `Player ${index + 1}`}
                  </Text>
                  {playerId === currentRoom.hostId && (
                    <View style={styles.hostBadge}>
                      <Text style={styles.hostBadgeText}>Host</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Waiting for Players */}
            {currentRoom.players.length < 2 && (
              <View style={styles.waitingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.waitingText}>Waiting for players...</Text>
                <Text style={styles.waitingSubtext}>
                  {isHost ? 'Share the room code with your friends' : 'Waiting for host to start the game'}
                </Text>
              </View>
            )}

            {/* Game Controls */}
            <View style={styles.gameControls}>
              {isHost && currentRoom.players.length >= 2 && (
                <TouchableOpacity
                  style={[
                    styles.button, 
                    styles.startButton,
                    (!currentRoom.questions || currentRoom.questions.length === 0) && styles.disabledButton
                  ]}
                  onPress={handleStartGame}
                  disabled={loading || !currentRoom.questions || currentRoom.questions.length === 0}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {currentRoom.questions && currentRoom.questions.length > 0 
                        ? '🚀 Start Game' 
                        : '⏳ Select Questions First'}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.leaveButton]}
                onPress={handleLeaveRoom}
              >
                <Text style={styles.buttonText}>Leave Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Loading State - Only show for specific actions, not category selection */}
        {loading && (mode === 'join_flow' || mode === 'question_selection') && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {mode === 'join_flow' ? 'Joining room...' : 
               mode === 'question_selection' ? 'Saving questions...' : 'Loading...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700' as const,
    color: ACCESSIBILITY.colors.text,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize['2xl'],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: ACCESSIBILITY.colors.textMuted,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    fontWeight: '500' as const,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  modeContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 28,
  },
  modeButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
  },
  hostButton: {
    borderColor: COLORS.primary,
  },
  playerButton: {
    borderColor: COLORS.info,
  },
  modeButtonIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modeButtonDescription: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructions: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    marginTop: SPACING.lg,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  joinSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  roomCodeInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xl,
    fontWeight: '600' as const,
    letterSpacing: 3,
  },
  joinButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: ACCESSIBILITY.minTouchTarget,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.muted,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  leaveButton: {
    backgroundColor: COLORS.error,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600' as const,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
  },
  roomContainer: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roomCode: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  shareButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  roomCategory: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '600' as const,
  },
  roomSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontWeight: '500' as const,
  },
  playersContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  playersSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
  },
  playerName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  hostBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hostBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  waitingSubtext: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  gameControls: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  // Sporcle-style Create Flow
  createFlowContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  createFlowTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  createFlowSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  // Category Carousel Styles - Same as CategoriesCarouselScreen
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: height * 0.6,
    borderRadius: 24,
    padding: SPACING.xl,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  categoryName: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: 'white',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  questionCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  questionCountText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  creatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Question Selection Styles
  questionSelectionContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  questionSelectionTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  questionSelectionSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  questionsList: {
    flex: 1,
    marginBottom: SPACING.lg,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  questionItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  questionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  questionDifficulty: {
    fontSize: 14,
    color: COLORS.muted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  questionSelectionFooter: {
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    fontWeight: '600' as const,
  },
  // Question Status Styles
  questionStatusContainer: {
    marginVertical: SPACING.lg,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  questionStatusReady: {
    backgroundColor: '#E8F5E8',
    padding: SPACING.md,
    borderRadius: 8,
    width: '100%',
  },
  questionStatusWaiting: {
    backgroundColor: '#FFF3CD',
    padding: SPACING.md,
    borderRadius: 8,
    width: '100%',
  },
  questionStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
});

export default MultiplayerRoomScreen;
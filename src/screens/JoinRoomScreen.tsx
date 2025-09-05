import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';
import { AuthService } from '../services/authService';

interface JoinRoomScreenProps {}

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = () => {
  const navigation = useNavigation();
  const { 
    joinRoomCode, 
    setJoinRoomCode, 
    joinRoom, 
    loading, 
    error,
    clearError,
    leaveRoom,
    resetAll,
    cleanup
  } = useMultiplayer();
  const authService = AuthService.getInstance();

  const [roomCode, setRoomCode] = useState(joinRoomCode);
  const [isValidCode, setIsValidCode] = useState(false);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  useEffect(() => {
    // Validate room code format (6 characters, alphanumeric)
    const isValid = /^[A-Z0-9]{6}$/.test(roomCode);
    setIsValidCode(isValid);
  }, [roomCode]);

  const handleRoomCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const formattedText = text.toUpperCase().slice(0, 6);
    setRoomCode(formattedText);
    setJoinRoomCode(formattedText);
  };

  const handleJoinRoom = async () => {
    if (!isValidCode) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-character room code');
      return;
    }

    try {
      // Ensure user is authenticated before joining room
      await authService.ensureAuthenticated();
      
      const success = await joinRoom(roomCode);
      if (success) {
        navigation.navigate('RoomLobby' as never, { roomCode } as never);
      }
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleLeaveRoom = async () => {
    try {
      // Clean up any existing room session
      await leaveRoom();
      
      // Reset all multiplayer state
      resetAll();
      
      // Clean up listeners and connections
      cleanup();
      
      // Navigate back to main menu
      navigation.goBack();
    } catch (error) {
      console.error('Error leaving room:', error);
      // Even if there's an error, still clean up and go back
      resetAll();
      cleanup();
      navigation.goBack();
    }
  };

  const handlePasteCode = async () => {
    // This would integrate with clipboard in a real app
    Alert.alert('Paste Code', 'Paste functionality would be implemented here');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.leaveButton}
          onPress={handleLeaveRoom}
          accessibilityLabel="Leave room and end session"
        >
          <Text style={styles.leaveButtonText}>Leave Room</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Join Room</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Enter Room Code</Text>
          <Text style={styles.instructionsSubtitle}>
            Ask the host for the 6-character room code to join their game
          </Text>
        </View>

        {/* Room Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Room Code</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.roomCodeInput,
                isValidCode && styles.roomCodeInputValid,
                roomCode.length === 6 && !isValidCode && styles.roomCodeInputInvalid
              ]}
              value={roomCode}
              onChangeText={handleRoomCodeChange}
              placeholder="ABC123"
              placeholderTextColor={COLORS.muted}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              accessibilityLabel="Room code input"
              accessibilityHint="Enter the 6-character room code"
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePasteCode}
              accessibilityLabel="Paste room code"
            >
              <Text style={styles.pasteButtonText}>Paste</Text>
            </TouchableOpacity>
          </View>
          
          {/* Validation Messages */}
          {roomCode.length > 0 && !isValidCode && (
            <Text style={styles.validationError}>
              Room code must be 6 characters (letters and numbers only)
            </Text>
          )}
          {isValidCode && (
            <Text style={styles.validationSuccess}>
              ✓ Valid room code format
            </Text>
          )}
        </View>

        {/* Join Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              (!isValidCode || loading) && styles.joinButtonDisabled
            ]}
            onPress={handleJoinRoom}
            disabled={!isValidCode || loading}
            accessibilityLabel="Join room with entered code"
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.joinButtonText}>Join Room</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <View style={styles.helpList}>
            <View style={styles.helpItem}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={styles.helpText}>
                Room codes are 6 characters long (like ABC123)
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={styles.helpText}>
                Ask the host to share their room code
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={styles.helpText}>
                Make sure you're connected to the internet
              </Text>
            </View>
            <View style={styles.helpItem}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={styles.helpText}>
                Room codes are case-insensitive
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  leaveButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  instructionsSection: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  instructionsSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  roomCodeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 4,
    paddingVertical: SPACING.lg,
  },
  roomCodeInputValid: {
    color: COLORS.success,
  },
  roomCodeInputInvalid: {
    color: COLORS.error,
  },
  pasteButton: {
    padding: SPACING.sm,
  },
  pasteButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  validationError: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
  },
  validationSuccess: {
    fontSize: 12,
    color: COLORS.success,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.white,
  },
  helpSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  helpList: {
    gap: SPACING.sm,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpBullet: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.muted,
    flex: 1,
    lineHeight: 20,
  },
});

export default JoinRoomScreen;

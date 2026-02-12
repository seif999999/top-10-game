import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../shared/types/navigation';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import ThemedAlert from '../utils/themedAlert';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../../backend/utils/constants';
import { AuthService } from '../../backend/services/authService';
import { logger } from '../../backend/utils/logger';
import useAppTranslation from '../../hooks/useTranslation';

interface JoinRoomScreenProps {}

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
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
  const { t } = useAppTranslation('screens');
  const { t: tCommon } = useAppTranslation('common');
  const { isRTL } = useAppTranslation();

  const [roomCode, setRoomCode] = useState(joinRoomCode);
  const [isValidCode, setIsValidCode] = useState(false);

  useEffect(() => {
    if (error) {
      ThemedAlert.error(tCommon('error'), error, [{ text: tCommon('ok'), onPress: clearError }]);
    }
  }, [error, clearError, tCommon]);

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
      ThemedAlert.warning(t('multiplayer.joinRoomScreen.invalidCodeTitle'), t('multiplayer.joinRoomScreen.invalidCodeMessage'));
      return;
    }

    try {
      logger.log('🎯 Attempting to join room:', roomCode);
      
      // Ensure user is authenticated before joining room
      await authService.ensureAuthenticated();
      
      logger.log('✅ User authenticated, calling joinRoom...');
      const success = await joinRoom(roomCode);
      
      if (success) {
        logger.log('✅ Successfully joined room, navigating to RoomLobby');
        
        // Add a small delay to ensure room subscription is established
        await new Promise(resolve => setTimeout(resolve, 300));
        
        navigation.navigate('RoomLobby', { roomCode });
      } else {
        logger.log('❌ Failed to join room - joinRoom returned false');
        ThemedAlert.error(
          t('multiplayer.joinRoomScreen.joinFailedTitle'),
          t('multiplayer.joinRoomScreen.joinFailedMessage')
        );
      }
    } catch (error) {
      logger.error('❌ Error in handleJoinRoom:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      ThemedAlert.error(
        t('multiplayer.joinRoomScreen.joinFailedTitle'),
        errorMessage ? t('multiplayer.joinRoomScreen.joinFailedWithError', { message: errorMessage }) : t('multiplayer.joinRoomScreen.joinFailedMessage')
      );
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
      logger.error('Error leaving room:', error);
      // Even if there's an error, still clean up and go back
      resetAll();
      cleanup();
      navigation.goBack();
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
        <TouchableOpacity 
          style={[styles.leaveButton, { position: 'absolute', [isRTL ? 'right' : 'left']: SPACING.lg }]}
          onPress={handleLeaveRoom}
          accessibilityLabel={t('multiplayer.leaveRoom')}
        >
          <Text style={styles.leaveButtonText}>{t('multiplayer.joinRoomScreen.exit')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('multiplayer.joinRoom')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={[styles.instructionsTitle, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.enterRoomCodeTitle')}</Text>
          <Text style={[styles.instructionsSubtitle, isRTL && styles.rtlText]}>
            {t('multiplayer.joinRoomScreen.enterRoomCodeSubtitle')}
          </Text>
        </View>

        {/* Room Code Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.roomCodeLabel')}</Text>
          <View style={[styles.inputContainer, isRTL && styles.rtlRow]}>
            <TextInput
              style={[
                styles.roomCodeInput,
                isValidCode && styles.roomCodeInputValid,
                roomCode.length === 6 && !isValidCode && styles.roomCodeInputInvalid,
                isRTL && styles.rtlText
              ]}
              value={roomCode}
              onChangeText={handleRoomCodeChange}
              placeholder={t('multiplayer.joinRoomScreen.roomCodePlaceholder')}
              placeholderTextColor={COLORS.muted}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              accessibilityLabel={t('multiplayer.joinRoomScreen.roomCodeLabel')}
              accessibilityHint={t('multiplayer.joinRoomScreen.enterRoomCodeSubtitle')}
              textAlign={isRTL ? 'right' : 'center'}
            />
          </View>
          
          {/* Validation Messages */}
          {roomCode.length > 0 && !isValidCode && (
            <Text style={[styles.validationError, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.validationError')}</Text>
          )}
          {isValidCode && (
            <Text style={[styles.validationSuccess, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.validationSuccess')}</Text>
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
            accessibilityLabel={t('multiplayer.joinRoomScreen.joinRoomButton')}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.joinButtonText}>{t('multiplayer.joinRoomScreen.joinRoomButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={[styles.helpTitle, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.needHelp')}</Text>
          <View style={styles.helpList}>
            <View style={[styles.helpItem, isRTL && styles.rtlRow]}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={[styles.helpText, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.help1')}</Text>
            </View>
            <View style={[styles.helpItem, isRTL && styles.rtlRow]}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={[styles.helpText, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.help2')}</Text>
            </View>
            <View style={[styles.helpItem, isRTL && styles.rtlRow]}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={[styles.helpText, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.help3')}</Text>
            </View>
            <View style={[styles.helpItem, isRTL && styles.rtlRow]}>
              <Text style={styles.helpBullet}>•</Text>
              <Text style={[styles.helpText, isRTL && styles.rtlText]}>{t('multiplayer.joinRoomScreen.help4')}</Text>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    position: 'relative',
  },
  leaveButton: {
    padding: SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  placeholder: {
    position: 'absolute',
    right: SPACING.lg,
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
    borderWidth: 1,
    borderColor: '#666666',
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default JoinRoomScreen;

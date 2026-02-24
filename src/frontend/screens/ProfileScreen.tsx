import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Switch, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedAlert from '../utils/themedAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarDisplay from '../components/AvatarDisplay';
import HowToPlayModal from '../components/HowToPlayModal';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { ProfileScreenProps } from '../../shared/types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { useLanguage } from '../contexts/LanguageContext';
import { InputValidator } from '../../backend/utils/inputValidator';
import { RateLimitService } from '../../backend/services/rateLimitService';
import { logger } from '../../backend/utils/logger';
import { toAppError } from '../../shared/errors';
import useAppTranslation from '../../hooks/useTranslation';
import { EmailService } from '../../backend/services/emailService';


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut, updateUserProfile, updateUserAvatar } = useAuth();
  const { isSFXEnabled, isMusicEnabled, toggleSFX, toggleMusic, playButtonClick } = useAudio();
  const { language, setLanguage } = useLanguage();
  const { t: tScreens } = useAppTranslation('screens');
  const { t: tErrors } = useAppTranslation('errors');
  const { t: tCommon, isRTL, isRTLRestartRequired } = useAppTranslation();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [updatedDisplayName, setUpdatedDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isFeedbackSending, setIsFeedbackSending] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
      setUpdatedDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  const profileHeaderStyle = useMemo(
    () => [styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5), paddingBottom: SPACING.xs }, isRTL && styles.rtlRow],
    [insets.top, isRTL]
  );

  const handleBackPress = useCallback(() => {
    playButtonClick();
    navigation.goBack();
  }, [playButtonClick, navigation]);

  const handleHowToPlayPress = useCallback(() => {
    playButtonClick();
    setShowHowToPlay(true);
  }, [playButtonClick]);

  const handleSaveProfile = async () => {
    if (user?.id) {
      const rateLimitResult = await RateLimitService.checkRateLimit(
        user.id,
        'profileUpdate',
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      if (!rateLimitResult.allowed) {
        ThemedAlert.warning(
          tScreens('profile.rateLimitExceeded'),
          rateLimitResult.error || tScreens('profile.rateLimitMessage')
        );
        return;
      }
    }
    
    const validation = InputValidator.validateDisplayName(displayName);
    
    if (!validation.valid) {
      ThemedAlert.error(tErrors('validation.validationError'), validation.errors.join('\n'));
      return;
    }
    
    if (user?.id) {
      const moderationResult = await InputValidator.moderateContent(
        displayName.trim(),
        'displayName',
        user.id,
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      if (!moderationResult.approved) {
        ThemedAlert.warning(tErrors('validation.contentNotApproved'), moderationResult.errors.join('\n'));
        return;
      }
    }
    
    const sanitizedDisplayName = InputValidator.sanitizeText(displayName.trim(), 30);
    
    try {
      await updateUserProfile({ displayName: sanitizedDisplayName });
      if (user?.id) {
        await RateLimitService.recordAction(user.id, 'profileUpdate', { ipAddress: 'unknown', userAgent: 'mobile' }).catch(() => {});
      }
      setUpdatedDisplayName(sanitizedDisplayName);
      ThemedAlert.success(tCommon('success'), tScreens('profile.profileUpdateSuccess'));
      setIsEditing(false);
    } catch (error) {
      const appError = toAppError(error, {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update profile',
        userMessage: tErrors('profile.updateFailed')
      });
      logger.error('Profile update error:', appError);
      ThemedAlert.error(tErrors('general'), appError.userMessage ?? appError.message);
    }
  };

  const handleSignOut = async () => {
    try {
      logger.log('ProfileScreen: Starting sign-out...');
      await signOut();
      logger.log('ProfileScreen: Sign-out completed successfully');
    } catch (error) {
      const appError = toAppError(error, {
        code: 'PROFILE_SIGNOUT_FAILED',
        message: 'Failed to sign out',
        userMessage: tErrors('profile.signOutFailed')
      });
      logger.error('ProfileScreen: Sign-out error:', appError);
      ThemedAlert.error(
        tScreens('profile.signOutError'),
        appError.userMessage ?? appError.message
      );
    }
  };

  const feedbackEmail = 'gameapptop10@gmail.com';

  const handleFeedback = () => {
    playButtonClick();
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      ThemedAlert.warning(
        tScreens('profile.feedbackEmpty'),
        tScreens('profile.feedbackEmptyMessage')
      );
      return;
    }
    if (isFeedbackSending) return;

    playButtonClick();
    setIsFeedbackSending(true);

    try {
      // Get user info
      const userEmail = user?.email || 'Unknown User';
      const userName = user?.displayName || 'User';
      
      // The user's message is the main content - format it clearly
      const feedbackBody = `${feedbackText.trim()}\n\n---\nFrom: ${userName}\nEmail: ${userEmail}`;

      // Send via EmailService (automatically sends, no tabs/windows open)
      const result = await EmailService.sendFeedbackEmail({
        to: feedbackEmail,
        subject: tScreens('profile.appFeedback'),
        body: feedbackBody,
        fromEmail: userEmail,
        fromName: userName
      });

      if (result.success) {
        // Email sent successfully
        setShowFeedbackModal(false);
        setFeedbackText('');
        ThemedAlert.success(
          tScreens('profile.feedbackSent'),
          tScreens('profile.feedbackSentSuccess')
        );
      } else {
        // Failed to send
        ThemedAlert.error(
          tScreens('profile.feedbackSendError'),
          result.error || tScreens('profile.feedbackSendError')
        );
      }
    } catch (error) {
      logger.error('Error sending feedback:', error);
      ThemedAlert.error(
        tErrors('general'),
        tScreens('profile.feedbackSendError')
      );
    } finally {
      setIsFeedbackSending(false);
    }
  };

  const handleCancelFeedback = () => {
    playButtonClick();
    setShowFeedbackModal(false);
    setFeedbackText('');
  };

  const getMemberSinceText = () => {
    if (!user?.createdAt) return '';
    const date = new Date(user.createdAt);
    const formatted = `${date.getMonth() + 1}/${date.getFullYear()}`;
    return tScreens('profile.memberSince', { date: formatted });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <HowToPlayModal
        visible={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (scrolls away with content) - reduced top inset so title sits higher */}
        <View style={profileHeaderStyle}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <View style={styles.backButtonContent}>
              <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
              <View style={styles.backButtonDash} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{tScreens('profile.title')}</Text>
          </View>
          <TouchableOpacity
            onPress={handleHowToPlayPress}
            style={styles.howToPlayButton}
            accessibilityLabel={tScreens('profile.howToPlay')}
          >
            <Text style={styles.howToPlayButtonText}>❓</Text>
          </TouchableOpacity>
        </View>

        {/* User Information Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            onPress={() => { playButtonClick(); navigation.navigate('AvatarSelection' as never); }} 
            style={styles.avatarContainer}
          >
            <View style={styles.avatarWrapper}>
              <AvatarDisplay 
                avatarId={user?.selectedAvatar}
                size={120}
                showBorder={false}
                fallbackText={user?.displayName?.charAt(0)?.toUpperCase() || tScreens('profile.user').charAt(0)}
              />
            </View>
            <View style={styles.editIconOverlay}>
              <View style={styles.editIconCircle}>
                <Text style={styles.editIconText}>✏️</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => { playButtonClick(); setIsEditing(true); }} 
            style={[styles.userNameContainer, isRTL && styles.rtlRow]}
            activeOpacity={0.7}
          >
            <Text style={styles.userName}>
              {updatedDisplayName || user?.displayName || tScreens('profile.user')}
            </Text>
            <Text style={styles.nameEditIcon}>✏️</Text>
          </TouchableOpacity>
          
          <Text style={styles.userEmail}>{user?.email || ''}</Text>

          {user?.hasVIPBadge && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>👑 {tScreens('profile.vipBadge', { defaultValue: 'VIP' })}</Text>
            </View>
          )}

          {user?.createdAt && (
            <Text style={styles.memberSince}>
              {getMemberSinceText()}
            </Text>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{tScreens('profile.settings')}</Text>
          
          {/* Sound Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsCardTitle}>{tScreens('profile.sound')}</Text>
            
            <View style={[styles.settingRow, isRTL && styles.rtlRow]}>
              <View style={[styles.settingInfo, isRTL && styles.rtlRow]}>
                <Text style={styles.settingIcon}>🔊</Text>
                <View>
                  <Text style={styles.settingLabel}>{tScreens('profile.soundEffects')}</Text>
                  <Text style={styles.settingDescription}>{tScreens('profile.soundEffectsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={isSFXEnabled}
                onValueChange={() => {
                  playButtonClick();
                  toggleSFX();
                }}
                trackColor={{ false: '#4B5563', true: '#8B5CF6' }}
                thumbColor={isSFXEnabled ? '#FFFFFF' : '#9CA3AF'}
                ios_backgroundColor="#4B5563"
              />
            </View>
            
            <View style={[styles.settingRow, isRTL && styles.rtlRow]}>
              <View style={[styles.settingInfo, isRTL && styles.rtlRow]}>
                <Text style={styles.settingIcon}>🎵</Text>
                <View>
                  <Text style={styles.settingLabel}>{tScreens('profile.backgroundMusic')}</Text>
                  <Text style={styles.settingDescription}>{tScreens('profile.backgroundMusicDesc')}</Text>
                </View>
              </View>
              <Switch
                value={isMusicEnabled}
                onValueChange={() => {
                  playButtonClick();
                  toggleMusic();
                }}
                trackColor={{ false: '#4B5563', true: '#8B5CF6' }}
                thumbColor={isMusicEnabled ? '#FFFFFF' : '#9CA3AF'}
                ios_backgroundColor="#4B5563"
              />
            </View>
          </View>

          {/* Language Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsCardTitle}>{tScreens('profile.language')}</Text>
            
            <View style={[styles.settingRow, isRTL && styles.rtlRow]}>
              <View style={[styles.settingInfo, isRTL && styles.rtlRow]}>
                <Text style={styles.settingIcon}>🌐</Text>
                <View>
                  <Text style={styles.settingLabel}>{tScreens('profile.appLanguage')}</Text>
                  <Text style={styles.settingDescription}>{tScreens('profile.chooseLanguage')}</Text>
                </View>
              </View>
            </View>

            {/* Keep LTR order so English is always first (left); avoids RTL flipping and makes switching back reliable */}
            <View style={styles.languageButtonsContainer}>
              <TouchableOpacity
                onPress={() => {
                  playButtonClick();
                  setLanguage('en');
                }}
                accessibilityRole="button"
                accessibilityLabel={tScreens('profile.english')}
                accessibilityState={{ selected: language === 'en' }}
                style={[
                  styles.languageButton,
                  language === 'en' && styles.languageButtonActive
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'en' && styles.languageButtonTextActive
                ]}>
                  {tScreens('profile.english')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  playButtonClick();
                  setLanguage('ar');
                }}
                accessibilityRole="button"
                accessibilityLabel={tScreens('profile.arabic')}
                accessibilityState={{ selected: language === 'ar' }}
                style={[
                  styles.languageButton,
                  language === 'ar' && styles.languageButtonActive
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.languageButtonText,
                  language === 'ar' && styles.languageButtonTextActive
                ]}>
                  {tScreens('profile.arabic')}
                </Text>
              </TouchableOpacity>
            </View>
            {isRTLRestartRequired && (
              <Text style={[styles.restartHint, isRTL && styles.rtlText]}>{tCommon('restartForRTL')}</Text>
            )}
          </View>

          {/* Feedback Button */}
          <TouchableOpacity
            onPress={handleFeedback}
            style={[styles.feedbackButton, isRTL && styles.rtlRow]}
            activeOpacity={0.8}
          >
            <Text style={styles.feedbackIcon}>💬</Text>
            <Text style={styles.feedbackText}>{tScreens('profile.sendFeedback')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => { playButtonClick(); handleSignOut(); }}
            style={[styles.signOutButton, isRTL && styles.rtlRow]}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutIcon}>{isRTL ? '[←' : '[→'}</Text>
            <Text style={styles.signOutText}>{tScreens('profile.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{tScreens('profile.editDisplayName')}</Text>
            
            <TextInput
              placeholder={tScreens('auth.displayName')}
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              style={[styles.modalInput, isRTL && styles.rtlText]}
              autoFocus={true}
            />
            
            <View style={[styles.modalButtons, isRTL && styles.rtlRow]}>
              <TouchableOpacity 
                onPress={() => {
                  setDisplayName(user?.displayName || '');
                  setIsEditing(false);
                }}
                style={styles.modalCancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{tCommon('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveProfile}
                style={styles.modalSaveButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>{tCommon('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelFeedback}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{tScreens('profile.sendFeedback')}</Text>
            
            <TextInput
              placeholder={tScreens('profile.feedbackPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={feedbackText}
              onChangeText={setFeedbackText}
              style={[styles.feedbackInput, isRTL && styles.rtlText]}
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
              autoFocus={true}
            />
            
            <View style={[styles.modalButtons, isRTL && styles.rtlRow]}>
              <TouchableOpacity 
                onPress={handleCancelFeedback}
                style={styles.modalCancelButton}
                activeOpacity={0.8}
                disabled={isFeedbackSending}
              >
                <Text style={[styles.modalButtonText, isFeedbackSending && styles.modalButtonTextDisabled]}>{tCommon('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSubmitFeedback}
                style={[styles.modalSaveButton, isFeedbackSending && styles.modalSaveButtonDisabled]}
                activeOpacity={0.8}
                disabled={isFeedbackSending}
              >
                <Text style={styles.modalButtonText}>
                  {isFeedbackSending ? (tScreens('profile.sendingFeedback') || 'Sending…') : tScreens('profile.send')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonContent: {
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  backButtonDash: {},
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  howToPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    borderWidth: 0.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  howToPlayButtonText: {
    fontSize: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  editIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconText: {
    fontSize: 16,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  nameEditIcon: {
    fontSize: 16,
  },
  userEmail: {
    color: '#9CA3AF',
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  vipBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginTop: SPACING.sm,
  },
  vipBadgeText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  memberSince: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  settingsSection: {
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsCardTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  feedbackButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  feedbackIcon: {
    fontSize: 18,
  },
  feedbackText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  signOutIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#666666',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalInput: {
    backgroundColor: '#1e1e2e',
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666666',
    marginBottom: SPACING.lg,
  },
  feedbackInput: {
    backgroundColor: '#1e1e2e',
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666666',
    marginBottom: SPACING.lg,
    minHeight: 120,
    maxHeight: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextDisabled: {
    opacity: 0.7,
  },
  // Language settings styles
  languageButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  languageButton: {
    flex: 1,
    backgroundColor: '#2D2D3E',
    borderWidth: 2,
    borderColor: '#4B5563',
    borderRadius: 12,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  languageButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  languageButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  restartHint: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  // RTL styles
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default ProfileScreen;

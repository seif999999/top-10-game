import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Modal, Switch, Linking, Platform } from 'react-native';
import ThemedAlert from '../utils/themedAlert';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarDisplay from '../components/AvatarDisplay';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { ProfileScreenProps } from '../../shared/types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../contexts/AudioContext';
import { InputValidator } from '../../backend/utils/inputValidator';
import { RateLimitService } from '../../backend/services/rateLimitService';
import { logger } from '../../backend/utils/logger';
import { toAppError } from '../../shared/errors';


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut, updateUserProfile, updateUserAvatar } = useAuth();
  const { isSFXEnabled, isMusicEnabled, toggleSFX, toggleMusic, playButtonClick } = useAudio();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [updatedDisplayName, setUpdatedDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);


  // Sync displayName state with user.displayName from AuthContext
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
      setUpdatedDisplayName(user.displayName);
    }
  }, [user?.displayName]);


  const handleSaveProfile = async () => {
    // Check rate limiting for profile updates
    if (user?.id) {
      const rateLimitResult = await RateLimitService.checkRateLimit(
        user.id,
        'profileUpdate',
        { ipAddress: 'unknown', userAgent: 'mobile' }
      );
      
      if (!rateLimitResult.allowed) {
        ThemedAlert.warning('Rate Limit Exceeded', rateLimitResult.error || 'Too many profile updates. Please wait before trying again.');
        return;
      }
    }
    
    // Validate input using InputValidator
    const validation = InputValidator.validateDisplayName(displayName);
    
    if (!validation.valid) {
      ThemedAlert.error('Validation Error', validation.errors.join('\n'));
      return;
    }
    
    // Additional content moderation for display names
    if (user?.id) {
      const moderationResult = await InputValidator.moderateContent(
        displayName.trim(),
        'displayName',
        user.id,
        { ipAddress: 'unknown', userAgent: 'mobile' } // In production, get real metadata
      );
      
      if (!moderationResult.approved) {
        ThemedAlert.warning('Content Not Approved', moderationResult.errors.join('\n'));
        return;
      }
    }
    
    // Sanitize the input
    const sanitizedDisplayName = InputValidator.sanitizeText(displayName.trim(), 30);
    
    try {
      // Call the updateUserProfile function from AuthContext with proper object format
      await updateUserProfile({ displayName: sanitizedDisplayName });
      
      // Update the local state to show the change
      setUpdatedDisplayName(sanitizedDisplayName);
      ThemedAlert.success('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      const appError = toAppError(error, {
        code: 'PROFILE_UPDATE_FAILED',
        message: 'Failed to update profile',
        userMessage: 'Failed to update profile. Please try again.'
      });
      logger.error('Profile update error:', appError);
      ThemedAlert.error('Error', appError.userMessage ?? appError.message);
    }
  };

  const handleSignOut = async () => {
    try {
      logger.log('🚪 ProfileScreen: Starting sign-out...');
      await signOut();
      logger.log('✅ ProfileScreen: Sign-out completed successfully');
    } catch (error) {
      const appError = toAppError(error, {
        code: 'PROFILE_SIGNOUT_FAILED',
        message: 'Failed to sign out',
        userMessage: 'Failed to sign out. Please try again.'
      });
      logger.error('💥 ProfileScreen: Sign-out error:', appError);
      ThemedAlert.error(
        'Sign-Out Error', 
        appError.userMessage ?? appError.message
      );
    }
  };

  const handleFeedback = async () => {
    playButtonClick();
    
    const email = 'arahman.hazem@gmail.com';
    const subject = encodeURIComponent('App Feedback');
    const mailtoUrl = `mailto:${email}?subject=${subject}`;
    
    try {
      // Check if the device can open the mailto URL
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        logger.log('📧 Opened email client for feedback');
      } else {
        // Fallback for platforms that don't support mailto
        if (Platform.OS === 'web') {
          // On web, try opening in a new window
          window.open(mailtoUrl, '_blank');
        } else {
          ThemedAlert.warning(
            'Email Not Available',
            'No email client found. Please send feedback to: arahman.hazem@gmail.com'
          );
        }
      }
    } catch (error) {
      logger.error('Error opening email client:', error);
      ThemedAlert.error(
        'Error',
        'Could not open email client. Please send feedback to: arahman.hazem@gmail.com'
      );
    }
  };




  // Format member since date
  const getMemberSinceText = () => {
    if (!user?.createdAt) return '';
    const date = new Date(user.createdAt);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = date.getFullYear();
    return `Member since ${month}/${year}`;
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
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => { playButtonClick(); navigation.goBack(); }} style={styles.backButton}>
          <View style={styles.backButtonContent}>
            <Text style={styles.backButtonText}>←</Text>
            <View style={styles.backButtonDash} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                fallbackText={user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              />
            </View>
            {/* Edit Icon Overlay */}
            <View style={styles.editIconOverlay}>
              <View style={styles.editIconCircle}>
                <Text style={styles.editIconText}>✏️</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => { playButtonClick(); setIsEditing(true); }} 
            style={styles.userNameContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.userName}>
              {updatedDisplayName || user?.displayName || 'User'}
            </Text>
            <Text style={styles.nameEditIcon}>✏️</Text>
          </TouchableOpacity>
          
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              {getMemberSinceText()}
            </Text>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          
          {/* Sound Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsCardTitle}>Sound</Text>
            
            {/* Sound Effects Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔊</Text>
                <View>
                  <Text style={styles.settingLabel}>Sound Effects</Text>
                  <Text style={styles.settingDescription}>Button clicks and game sounds</Text>
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
            
            {/* Background Music Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🎵</Text>
                <View>
                  <Text style={styles.settingLabel}>Background Music</Text>
                  <Text style={styles.settingDescription}>Ambient music during gameplay</Text>
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
          
          {/* Feedback Button */}
          <TouchableOpacity
            onPress={handleFeedback}
            style={styles.feedbackButton}
            activeOpacity={0.8}
          >
            <Text style={styles.feedbackIcon}>💬</Text>
            <Text style={styles.feedbackText}>Send Feedback</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => { playButtonClick(); handleSignOut(); }}
            style={styles.signOutButton}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutIcon}>[→</Text>
            <Text style={styles.signOutText}>Sign Out</Text>
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
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            
            <TextInput
              placeholder="Display Name"
              placeholderTextColor="#9CA3AF"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.modalInput}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => {
                  setDisplayName(user?.displayName || '');
                  setIsEditing(false);
                }}
                style={styles.modalCancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveProfile}
                style={styles.modalSaveButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Save</Text>
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
    paddingBottom: SPACING.xl,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
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
  placeholder: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.xl,
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
  }
});

export default ProfileScreen;

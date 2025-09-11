import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';
import AvatarSelectionModal from '../components/AvatarSelectionModal';
import { COLORS, SPACING, COMPONENT_STYLES } from '../design-system';
import { ProfileScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { InputValidator } from '../utils/inputValidator';
import { RateLimitService } from '../services/rateLimitService';
import DataRetentionService from '../services/dataRetentionService';


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut, updateUserProfile, updateUserAvatar } = useAuth();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [updatedDisplayName, setUpdatedDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    // For now, use mock data until localStorage is properly set up
    setCurrentStreak(3);
    setBestStreak(5);
  }, []);

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
        Alert.alert('Rate Limit Exceeded', rateLimitResult.error || 'Too many profile updates. Please wait before trying again.');
        return;
      }
    }
    
    // Validate input using InputValidator
    const validation = InputValidator.validateDisplayName(displayName);
    
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
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
        Alert.alert('Content Not Approved', moderationResult.errors.join('\n'));
        return;
      }
    }
    
    // Sanitize the input
    const sanitizedDisplayName = InputValidator.sanitizeText(displayName.trim(), 30);
    
    try {
      // Call the updateUserProfile function from AuthContext
      await updateUserProfile(sanitizedDisplayName);
      
      // Update the local state to show the change
      setUpdatedDisplayName(sanitizedDisplayName);
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 ProfileScreen: Starting sign-out...');
      await signOut();
      console.log('✅ ProfileScreen: Sign-out completed successfully');
    } catch (error) {
      console.error('💥 ProfileScreen: Sign-out error:', error);
      Alert.alert(
        'Sign-Out Error', 
        error instanceof Error ? error.message : 'Failed to sign out. Please try again.'
      );
    }
  };

  const handleExportData = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Export Data',
      'This will export all your personal data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: async () => {
            try {
              const exportData = await DataRetentionService.exportUserData(user.id);
              Alert.alert(
                'Data Exported',
                'Your data has been exported successfully. Check the console for the data.',
                [{ text: 'OK' }]
              );
              console.log('Exported data:', exportData);
            } catch (error) {
              Alert.alert(
                'Export Failed',
                'Failed to export your data. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (!user?.id) return;
                      
                      const deletionRequest = await DataRetentionService.deleteUserData(
                        user.id,
                        'User requested account deletion'
                      );
                      
                      if (deletionRequest.status === 'completed') {
                        Alert.alert(
                          'Account Deleted',
                          'Your account and all data have been permanently deleted.',
                          [{ text: 'OK', onPress: signOut }]
                        );
                      } else {
                        Alert.alert(
                          'Deletion Failed',
                          deletionRequest.error || 'Failed to delete account. Please try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    } catch (error) {
                      Alert.alert(
                        'Deletion Failed',
                        'An error occurred while deleting your account. Please try again.',
                        [{ text: 'OK' }]
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleAchievements = () => {
    Alert.alert('Coming Soon', 'Achievements system will be available soon!');
  };

  const handleLeaderboard = () => {
    Alert.alert('Coming Soon', 'Global leaderboard will be available soon!');
  };

  const handleAvatarSelect = async (selectedAvatar: string | undefined) => {
    try {
      await updateUserAvatar(selectedAvatar);
      setShowAvatarModal(false);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar update error:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Text style={styles.backButtonArrow}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={() => setShowAvatarModal(true)} style={styles.avatarContainer}>
            <UserAvatar 
              user={user} 
              size={120} 
              showBorder={true}
              borderColor={COLORS.primary}
            />
            <View style={styles.avatarChangeButton}>
              <Text style={styles.avatarChangeText}>Change</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{updatedDisplayName || user?.displayName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Avatar Test Section - Temporary for testing */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Avatar Changes</Text>
          <View style={styles.testButtons}>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar('human-1')}
            >
              <Text style={styles.testButtonText}>Alex (Human 1)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar('human-2')}
            >
              <Text style={styles.testButtonText}>Sam (Human 2)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar('animal-1')}
            >
              <Text style={styles.testButtonText}>Whiskers (Cat)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar('animal-2')}
            >
              <Text style={styles.testButtonText}>Buddy (Dog)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar('animal-3')}
            >
              <Text style={styles.testButtonText}>Wise Owl</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => updateUserAvatar(undefined)}
            >
              <Text style={styles.testButtonText}>No Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Game Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎮</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statNumber}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                placeholder="Display Name"
                placeholderTextColor={COLORS.muted}
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
              />
              <View style={styles.editButtons}>
                <Button 
                  title="Save" 
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                />
                <Button 
                  title="Cancel" 
                  onPress={() => {
                    setDisplayName(user?.displayName || '');
                    setIsEditing(false);
                  }}
                  style={styles.cancelButton}
                />
              </View>
            </View>
          ) : (
            <Button 
              title="Edit Profile" 
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
              textStyle={styles.buttonText}
            />
          )}
          
          <Button 
            title="🏆 Achievements" 
            onPress={handleAchievements}
            style={styles.achievementsButton}
            textStyle={styles.buttonText}
          />
          
          <Button 
            title="🏅 Leaderboard" 
            onPress={handleLeaderboard}
            style={styles.leaderboardButton}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="Export My Data"
            onPress={handleExportData}
            style={styles.exportButton}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            style={styles.signOutButton}
            textStyle={styles.buttonText}
          />
          
        </View>
      </ScrollView>

      <AvatarSelectionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onAvatarSelect={(avatar) => handleAvatarSelect(avatar.id === 'no-avatar' ? undefined : avatar.id)}
        currentAvatarId={user?.selectedAvatar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonArrow: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: 'bold' as const,
    lineHeight: 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700'
  },
  placeholder: {
    width: 50
  },
  content: {
    flexGrow: 1,
    padding: SPACING.lg
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarChangeButton: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.background
  },
  avatarChangeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600'
  },
  userName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs
  },
  userEmail: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: SPACING.sm,
    fontWeight: '500'
  },
  memberSince: {
    color: COLORS.muted,
    fontSize: 14
  },
  testSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },
  testButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  statsSection: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md
  },
  statCard: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center'
  },
  settingsSection: {
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 50
  },
  editForm: {
    gap: SPACING.md
  },
  editButtons: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  saveButton: {
    flex: 1
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.card
  },
  editButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  achievementsButton: {
    backgroundColor: '#F59E0B', // Gold/Orange for achievements
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  leaderboardButton: {
    backgroundColor: '#10B981', // Green for leaderboard
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  exportButton: {
    backgroundColor: '#3B82F6', // Blue for export
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Red for delete
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  signOutButton: {
    backgroundColor: '#6B7280', // Gray for sign out
    borderWidth: 2,
    borderColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';
import AvatarDisplay from '../components/AvatarDisplay';
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

  const handleDataManagement = () => {
    Alert.alert(
      'Data Management',
      'What would you like to do with your data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export Data', 
          onPress: handleExportData
        },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: handleDeleteAccount
        }
      ]
    );
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
          <TouchableOpacity onPress={() => navigation.navigate('AvatarSelection' as never)} style={styles.avatarContainer}>
            <AvatarDisplay 
              avatarId={user?.selectedAvatar}
              size={120}
              showBorder={true}
              fallbackText={user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            />
            {/* Edit overlay */}
            <View style={styles.editOverlay}>
              <Text style={styles.editOverlayIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.userNameContainer}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{updatedDisplayName || user?.displayName || 'User'}</Text>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>



        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          
          <Button
            title="📤 Export & Delete Data"
            onPress={handleDataManagement}
            style={styles.dataManagementButton}
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
              placeholderTextColor={COLORS.muted}
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.modalInput}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => {
                  setDisplayName(user?.displayName || '');
                  setIsEditing(false);
                }}
                style={styles.modalCancelButton}
                textStyle={styles.modalButtonText}
              />
              <Button 
                title="Save" 
                onPress={handleSaveProfile}
                style={styles.modalSaveButton}
                textStyle={styles.modalButtonText}
              />
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
    width: 150,
    height: 150,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userNameContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
  editIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  editOverlayIcon: {
    fontSize: 14,
    color: COLORS.white,
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
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md
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
  dataManagementButton: {
    backgroundColor: '#3B82F6', // Blue for data management
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  modalInput: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[600],
    borderWidth: 2,
    borderColor: COLORS.gray[600],
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  }
});

export default ProfileScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import Button from '../components/Button';
import { COLORS, SPACING } from '../utils/constants';
import { ProfileScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';


const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [updatedDisplayName, setUpdatedDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

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
    // Validate input
    if (!displayName || displayName.trim() === '') {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }
    
    if (displayName.trim().length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters long');
      return;
    }
    
    try {
      // Call the updateUserProfile function from AuthContext
      await updateUserProfile(displayName.trim());
      
      // Update the local state to show the change
      setUpdatedDisplayName(displayName.trim());
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

  const handleAchievements = () => {
    Alert.alert('Coming Soon', 'Achievements system will be available soon!');
  };

  const handleLeaderboard = () => {
    Alert.alert('Coming Soon', 'Global leaderboard will be available soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(updatedDisplayName || user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.userName}>{updatedDisplayName || user?.displayName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          {user?.createdAt && (
            <Text style={styles.memberSince}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          )}
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
            />
          )}
          
          <Button 
            title="🏆 Achievements" 
            onPress={handleAchievements}
            style={styles.achievementsButton}
          />
          
          <Button 
            title="🏅 Leaderboard" 
            onPress={handleLeaderboard}
            style={styles.leaderboardButton}
          />
          
          <Button 
            title="Sign Out" 
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
          
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  backButton: {
    padding: SPACING.sm
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
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
    marginBottom: SPACING.xl
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '700'
  },
  userName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs
  },
  userEmail: {
    color: COLORS.muted,
    fontSize: 16,
    marginBottom: SPACING.sm
  },
  memberSince: {
    color: COLORS.muted,
    fontSize: 14
  },
  statsSection: {
    marginBottom: SPACING.xl
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
    minWidth: '45%'
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center'
  },
  settingsSection: {
    gap: SPACING.md
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
    backgroundColor: COLORS.card
  },
  achievementsButton: {
    backgroundColor: COLORS.card
  },
  leaderboardButton: {
    backgroundColor: COLORS.card
  },
  signOutButton: {
    backgroundColor: '#dc2626'
  }
});

export default ProfileScreen;

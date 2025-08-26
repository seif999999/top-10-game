import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING } from '../utils/constants';
import { ProfileScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = () => {
    // TODO: Implement profile update functionality
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
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

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
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
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                placeholder="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
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
            title="Sign Out" 
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        </View>
      </View>
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
    flex: 1,
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
  signOutButton: {
    backgroundColor: '#dc2626'
  }
});

export default ProfileScreen;

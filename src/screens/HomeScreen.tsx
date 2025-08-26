import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Modal, ScrollView, Dimensions } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleEditProfile = () => {
    setShowProfileMenu(false);
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile update functionality
    Alert.alert('Success', 'Profile updated successfully!');
    setShowEditProfile(false);
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

  const handleHelp = () => {
    Alert.alert(
      'Help',
      'How to play:\n\n1. Read the question carefully\n2. Type your answer in the input field\n3. Submit your answer\n4. You can submit multiple answers per question\n5. The closer your answer is to #1, the more points you get!\n\nGood luck!',
      [{ text: 'OK' }]
    );
  };

  const handleQuickPlay = () => {
    navigation.navigate('Categories');
  };

  const handleDailyChallenge = () => {
    Alert.alert('Coming Soon', 'Daily challenges will be available soon!');
  };

  const handleLeaderboard = () => {
    Alert.alert('Coming Soon', 'Global leaderboard will be available soon!');
  };

  const handleAchievements = () => {
    Alert.alert('Coming Soon', 'Achievements system will be available soon!');
  };

    return (
    <SafeAreaView style={styles.container}>
      {/* Header with Profile Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleProfileMenuToggle} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>TOP 10</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.welcome}>Welcome back, {user?.displayName || user?.email}!</Text>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoTop}>TOP</Text>
            <Text style={styles.logoNumber}>10</Text>
          </View>
          
          <Text style={styles.heroSubtitle}>Test your knowledge and compete for the top spot!</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Play</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleQuickPlay}>
              <Text style={styles.quickActionIcon}>🎯</Text>
              <Text style={styles.quickActionTitle}>Quick Play</Text>
              <Text style={styles.quickActionSubtitle}>Random questions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} onPress={handleDailyChallenge}>
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={styles.quickActionTitle}>Daily Challenge</Text>
              <Text style={styles.quickActionSubtitle}>New every day</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
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
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Game Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard} onPress={handleLeaderboard}>
              <Text style={styles.featureIcon}>🏅</Text>
              <Text style={styles.featureTitle}>Leaderboard</Text>
              <Text style={styles.featureSubtitle}>Global rankings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard} onPress={handleAchievements}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureTitle}>Achievements</Text>
              <Text style={styles.featureSubtitle}>Unlock badges</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.featureIcon}>📚</Text>
              <Text style={styles.featureTitle}>Categories</Text>
              <Text style={styles.featureSubtitle}>Choose topics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard} onPress={handleHelp}>
              <Text style={styles.featureIcon}>❓</Text>
              <Text style={styles.featureTitle}>How to Play</Text>
              <Text style={styles.featureSubtitle}>Game rules</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Play Button */}
        <View style={styles.mainPlaySection}>
          <TouchableOpacity style={styles.mainPlayButton} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.mainPlayIcon}>🎮</Text>
            <Text style={styles.mainPlayTitle}>Start Playing</Text>
            <Text style={styles.mainPlaySubtitle}>Choose your category and begin!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Menu */}
      {showProfileMenu && (
        <View style={styles.profileMenu}>
          <TouchableOpacity 
            style={styles.profileMenuItem}
            onPress={handleEditProfile}
          >
            <Text style={styles.profileMenuItemText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileMenuItem}
            onPress={handleHelp}
          >
            <Text style={styles.profileMenuItemText}>Help</Text>
          </TouchableOpacity>
          
          <View style={styles.profileMenuDivider} />
          
          <TouchableOpacity 
            style={styles.profileMenuItem}
            onPress={handleSignOut}
          >
            <Text style={[styles.profileMenuItemText, { color: '#dc2626' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.editProfileModal}>
          <View style={styles.editProfileContent}>
            <Text style={styles.editProfileTitle}>Edit Profile</Text>
            
            <View style={styles.editProfileField}>
              <Text style={styles.editProfileLabel}>Display Name</Text>
              <Input
                placeholder="Enter display name"
                value={newDisplayName}
                onChangeText={setNewDisplayName}
              />
            </View>
            
            <View style={styles.editProfileField}>
              <Text style={styles.editProfileLabel}>Email</Text>
              <Input
                placeholder="Enter email"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.editProfileButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowEditProfile(false)}
                style={{ backgroundColor: COLORS.muted }}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
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
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  profileButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700'
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationIcon: {
    fontSize: 18
  },
  scrollView: {
    flex: 1
  },
  heroSection: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginBottom: SPACING.lg
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg
  },
  logoTop: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: -6
  },
  logoNumber: {
    color: COLORS.text,
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8
  },
  welcome: {
    color: COLORS.muted,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: SPACING.md
  },
  heroSubtitle: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: SPACING.md
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    textAlign: 'center'
  },
  quickActionsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm
  },
  quickActionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center'
  },
  quickActionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center'
  },
  statsContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.sm
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'center'
  },
  featuresContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md
  },
  featureCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm
  },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center'
  },
  featureSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center'
  },
  mainPlaySection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl
  },
  mainPlayButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  mainPlayIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm
  },
  mainPlayTitle: {
    color: COLORS.background,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  mainPlaySubtitle: {
    color: COLORS.background,
    fontSize: 14,
    opacity: 0.9
  },
  profileMenu: {
    position: 'absolute',
    top: 80,
    left: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.xs
  },
  profileMenuItemText: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: SPACING.sm
  },
  profileMenuDivider: {
    height: 1,
    backgroundColor: COLORS.muted,
    marginVertical: SPACING.sm
  },
  editProfileModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg
  },
  editProfileContent: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400
  },
  editProfileTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    textAlign: 'center'
  },
  editProfileField: {
    marginBottom: SPACING.lg
  },
  editProfileLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm
  },
  editProfileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg
  }
});

export default HomeScreen;



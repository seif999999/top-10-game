import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import Button from '../components/Button';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';


const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(3);

  const handleProfileNavigation = () => {
    navigation.navigate('Profile');
  };



  const handleHelp = () => {
    Alert.alert(
      'Help',
      'How to play:\n\n1. Read the question carefully\n2. Type your answer in the input field\n3. Submit your answer\n4. You can submit multiple answers per question\n5. The closer your answer is to #1, the more points you get!\n\nGood luck!',
      [{ text: 'OK' }]
    );
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
        <TouchableOpacity onPress={handleProfileNavigation} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>
            {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>TOP 10</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.streakButton}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
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

        {/* Main Play Button */}
        <View style={styles.mainPlaySection}>
          <TouchableOpacity style={styles.mainPlayButton} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.mainPlayIcon}>🎮</Text>
            <Text style={styles.mainPlayTitle}>Start Playing</Text>
            <Text style={styles.mainPlaySubtitle}>Choose your category and begin!</Text>
          </TouchableOpacity>
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
            
            <TouchableOpacity style={styles.featureCard} onPress={() => {}}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureTitle}>Wins</Text>
              <Text style={styles.featureSubtitle}>Your victories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard} onPress={handleHelp}>
              <Text style={styles.featureIcon}>❓</Text>
              <Text style={styles.featureTitle}>How to Play</Text>
              <Text style={styles.featureSubtitle}>Game rules</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)'
  },
  streakIcon: {
    fontSize: 16,
    marginRight: SPACING.xs
  },
  streakText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700'
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

});

export default HomeScreen;



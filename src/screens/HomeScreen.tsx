import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import Button from '../components/Button';
import { COLORS, SPACING } from '../utils/constants';
import { HomeScreenProps } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Top10Game</Text>
        <Text style={styles.welcome}>Welcome back, {user?.displayName || user?.email}!</Text>
        
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Play Game" onPress={() => navigation.navigate('Categories')} />
          <Button title="Profile" onPress={() => navigation.navigate('Profile')} style={styles.secondaryButton} />
          <Button title="Sign Out" onPress={signOut} style={styles.signOutButton} />
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
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between'
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: SPACING.xl
  },
  welcome: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.sm
  },
  statsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.xl
  },
  statsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800'
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: SPACING.xs
  },
  buttonContainer: {
    gap: SPACING.md
  },
  secondaryButton: {
    backgroundColor: COLORS.card
  },
  signOutButton: {
    backgroundColor: '#dc2626'
  }
});

export default HomeScreen;



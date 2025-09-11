import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, ACCESSIBILITY } from '../utils/constants';

const { width, height } = Dimensions.get('window');

interface MultiplayerMenuScreenProps {}

const MultiplayerMenuScreen: React.FC<MultiplayerMenuScreenProps> = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleCreateRoom = () => {
    navigation.navigate('MultiplayerCategory' as never);
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to main menu"
        >
          <View style={styles.backButtonIcon}>
            <Text style={styles.backButtonArrow}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Multiplayer</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Multiplayer!</Text>
          <Text style={styles.welcomeSubtitle}>
            Create a room and invite friends, or join an existing game
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.createButton]}
            onPress={handleCreateRoom}
            accessibilityLabel="Create a new room"
            accessibilityHint="Opens room creation screen where you can select category and questions"
          >
            <Text style={styles.createButtonIcon}>🏠</Text>
            <Text style={styles.createButtonTitle}>Create Room</Text>
            <Text style={styles.createButtonSubtitle}>
              Host a new game and invite friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton]}
            onPress={handleJoinRoom}
            accessibilityLabel="Join an existing room"
            accessibilityHint="Opens room joining screen where you can enter a room code"
          >
            <Text style={styles.joinButtonIcon}>🚪</Text>
            <Text style={styles.joinButtonTitle}>Join Room</Text>
            <Text style={styles.joinButtonSubtitle}>
              Enter a room code to join a game
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Create a room to host a game with up to 8 players
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Share the room code with friends to invite them
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Host controls the game flow and can start/end games
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>•</Text>
              <Text style={styles.infoText}>
                Players submit answers and compete for the top score
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 20, // Extra padding for safe scrolling
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
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
  },
  placeholder: {
    width: 60, // Same width as back button for centering
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  joinButton: {
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  createButtonIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  createButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  createButtonSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  joinButtonIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  joinButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  joinButtonSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.muted,
    flex: 1,
    lineHeight: 20,
  },
});

export default MultiplayerMenuScreen;

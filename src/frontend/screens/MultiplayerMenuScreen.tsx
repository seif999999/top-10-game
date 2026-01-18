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
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';

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
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityHint="Returns to main menu"
        >
          <View style={styles.backButtonContent}>
            <Text style={styles.backButtonArrow}>←</Text>
            <View style={styles.backButtonDash} />
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
        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Create or join a room to play with friends online
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCreateRoom}
            activeOpacity={0.9}
            accessibilityLabel="Create a new room"
            accessibilityHint="Opens room creation screen where you can select category and questions"
          >
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>🏡</Text>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Create Room</Text>
                  <Text style={styles.cardSubtitle}>
                    Host a new game and invite friends
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleJoinRoom}
            activeOpacity={0.9}
            accessibilityLabel="Join an existing room"
            accessibilityHint="Opens room joining screen where you can enter a room code"
          >
            <LinearGradient
              colors={['#7C3AED', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardIcon}>🚪</Text>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>Join Room</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter a room code to join a game
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How it works Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.infoBulletDot} />
              <Text style={styles.infoText}>
                Create a room for up to 8 players
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBulletDot} />
              <Text style={styles.infoText}>
                Share the room code with your friends
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBulletDot} />
              <Text style={styles.infoText}>
                Host controls the game and questions
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBulletDot} />
              <Text style={styles.infoText}>
                Players compete for the top score
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
    backgroundColor: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  backButtonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600' as const,
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
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  descriptionSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  descriptionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.9,
  },
  buttonContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  actionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 48,
    marginRight: SPACING.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.80)',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#666666',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: SPACING.md,
    marginTop: 6,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
  },
});

export default MultiplayerMenuScreen;

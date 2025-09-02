import React, { useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, ANIMATIONS } from '../utils/constants';
import { MainMenuScreenProps } from '../types/navigation';

const { width } = Dimensions.get('window');

const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ navigation }) => {
  // Animation values
  const singlePlayerScale = useRef(new Animated.Value(1)).current;
  const multiplayerScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;

  const handleSinglePlayer = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(singlePlayerScale, {
        toValue: 0.95,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(singlePlayerScale, {
        toValue: 1,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      })
    ]).start();
    
    navigation.navigate('Categories', { gameMode: 'single' });
  };

  const handleMultiplayer = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(multiplayerScale, {
        toValue: 0.95,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(multiplayerScale, {
        toValue: 1,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      })
    ]).start();
    
    navigation.navigate('MultiplayerRoom', { categoryName: '', categoryId: '' });
  };

  const handleBackToHome = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(backButtonScale, {
        toValue: 0.9,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: ANIMATIONS.duration.fast,
        useNativeDriver: true,
      })
    ]).start();
    
    navigation.goBack();
  };



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <View style={styles.backButtonIcon}>
                <Text style={styles.backButtonArrow}>‹</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.headerCenter}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoTop}>TOP</Text>
              <Text style={styles.logoNumber}>10</Text>
            </View>
          </View>
        </View>

        {/* Game Mode Selection */}
        <View style={styles.modeSelection}>
          <Text style={styles.modeTitle}>Choose Your Game Mode</Text>
          
          {/* Single Player Card */}
          <Animated.View style={{ transform: [{ scale: singlePlayerScale }] }}>
            <TouchableOpacity style={styles.modeCard} onPress={handleSinglePlayer}>
              <View style={styles.modeIcon}>
                <Text style={styles.modeIconText}>🎮</Text>
              </View>
              <Text style={styles.modeName}>Single Player</Text>
              <Text style={styles.modeDescription}>
                Play solo and challenge yourself to find all the top answers
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Multiplayer Card */}
          <Animated.View style={{ transform: [{ scale: multiplayerScale }] }}>
            <TouchableOpacity style={styles.modeCard} onPress={handleMultiplayer}>
              <View style={styles.modeIcon}>
                <Text style={styles.modeIconText}>👥</Text>
              </View>
              <Text style={styles.modeName}>Multiplayer</Text>
              <Text style={styles.modeDescription}>
                Compete with friends in real-time multiplayer matches
              </Text>
            </TouchableOpacity>
          </Animated.View>


        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Test your knowledge with the most popular trivia game!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    position: 'relative',
  },
     backButton: {
     position: 'absolute',
     left: SPACING.sm,
     top: SPACING.md,
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingHorizontal: SPACING.md,
     paddingVertical: SPACING.sm,
     borderRadius: 22,
     backgroundColor: 'rgba(139, 92, 246, 0.08)',
     borderWidth: 1.5,
     borderColor: 'rgba(139, 92, 246, 0.3)',
     shadowColor: COLORS.primary,
     shadowOffset: { width: 0, height: 2 },
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
     fontWeight: TYPOGRAPHY.fontWeight.bold,
     lineHeight: 20,
   },

  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTop: {
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: -8,
  },
  logoNumber: {
    color: COLORS.text,
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
  },
  modeSelection: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.xl,
  },
     modeTitle: {
     fontSize: 24,
     fontWeight: TYPOGRAPHY.fontWeight.bold,
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     color: COLORS.text,
     textAlign: 'center',
     marginBottom: SPACING.xl,
     letterSpacing: 0.5,
   },
     modeCard: {
     backgroundColor: COLORS.card,
     borderRadius: 20,
     padding: SPACING.xl,
     alignItems: 'center',
     shadowColor: COLORS.primary,
     shadowOffset: {
       width: 0,
       height: 8,
     },
     shadowOpacity: 0.2,
     shadowRadius: 16,
     elevation: 12,
     borderWidth: 2,
     borderColor: 'rgba(139, 92, 246, 0.2)',
     transform: [{ scale: 1 }],
   },
     modeIcon: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: COLORS.primary,
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: SPACING.lg,
     shadowColor: COLORS.primary,
     shadowOffset: {
       width: 0,
       height: 4,
     },
     shadowOpacity: 0.4,
     shadowRadius: 8,
     elevation: 6,
   },
  modeIconText: {
    fontSize: 36,
  },
     modeName: {
     fontSize: 24,
     fontWeight: TYPOGRAPHY.fontWeight.bold,
     fontFamily: TYPOGRAPHY.fontFamily.primary,
     color: COLORS.text,
     marginBottom: SPACING.md,
     letterSpacing: 0.5,
   },
     modeDescription: {
     fontSize: 16,
     color: COLORS.muted,
     fontFamily: TYPOGRAPHY.fontFamily.secondary,
     fontWeight: TYPOGRAPHY.fontWeight.regular,
     textAlign: 'center',
     lineHeight: 24,
     letterSpacing: 0.2,
   },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
     footerText: {
     fontSize: 14,
     color: COLORS.muted,
     fontFamily: TYPOGRAPHY.fontFamily.secondary,
     fontWeight: TYPOGRAPHY.fontWeight.medium,
     textAlign: 'center',
     letterSpacing: 0.3,
   },
});

export default MainMenuScreen;

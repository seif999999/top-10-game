import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '../../backend/utils/constants';

const { width, height } = Dimensions.get('window');

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How to Play</Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Game Rules Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📄</Text>
                <Text style={styles.sectionTitle}>Game Rules</Text>
              </View>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Choose a category</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Guess top 10 answers</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>#1 answer = 1 point</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>#10 answer = 10 points</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Most points wins!</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Find less obvious answers in lower ranks for strategic advantage</Text>
                </View>
              </View>
            </View>

            {/* Game Modes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🎮</Text>
                <Text style={styles.sectionTitle}>Game Modes</Text>
              </View>
              <View style={styles.gameModeList}>
                <View style={styles.gameModeItem}>
                  <Text style={styles.gameModeTitle}>Single Player</Text>
                  <Text style={styles.gameModeSubtitle}>Host a local game with friends</Text>
                </View>
                <View style={styles.gameModeItem}>
                  <Text style={styles.gameModeTitle}>Multiplayer</Text>
                  <Text style={styles.gameModeSubtitle}>Create/join online rooms with code</Text>
                </View>
                <View style={styles.gameModeItem}>
                  <Text style={styles.gameModeTitle}>Custom</Text>
                  <Text style={styles.gameModeSubtitle}>Make your own questions and answers</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Got it Button */}
          <TouchableOpacity onPress={onClose} style={styles.gotItButton} activeOpacity={0.9}>
            <LinearGradient
              colors={['#4F46E5', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Got it!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 24,
    width: width * 0.80,
    maxHeight: height * 0.70,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#666666',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulletList: {
    paddingLeft: SPACING.md,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginRight: SPACING.md,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 15,
    color: '#E0E0E0',
    flex: 1,
    lineHeight: 22,
  },
  gameModeList: {
    paddingLeft: SPACING.md,
  },
  gameModeItem: {
    marginBottom: SPACING.md,
  },
  gameModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  gameModeSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  gotItButton: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default HowToPlayModal;

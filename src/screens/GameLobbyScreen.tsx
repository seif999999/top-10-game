import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Button from '../components/Button';
import { COLORS, SPACING } from '../utils/constants';
import { GameLobbyScreenProps } from '../types/navigation';
import { useGame } from '../contexts/GameContext';
import { getRandomQuestion } from '../services/questionsService';

const GameLobbyScreen: React.FC<GameLobbyScreenProps> = ({ navigation, route }) => {
  const { categoryId, categoryName, selectedQuestion } = route.params;
  const { startGame } = useGame();
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState(['You']);
  const [sampleQuestion, setSampleQuestion] = useState<any>(null);

  useEffect(() => {
    // Load a sample question for preview
    if (selectedQuestion) {
      setSampleQuestion(selectedQuestion);
    } else {
      const question = getRandomQuestion(categoryName);
      setSampleQuestion(question);
    }
  }, [categoryName, selectedQuestion]);

  const createRoom = () => {
    setIsHost(true);
    setPlayers(['You']);
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      setIsHost(false);
      setPlayers(['You', 'Player 2']);
    }
  };

  const handleStartGame = () => {
    startGame(categoryName, players, selectedQuestion);
    navigation.navigate('GameScreen', {
      roomId: 'demo-room',
      categoryId: categoryId
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.backButtonIcon}>
            <Text style={styles.backButtonArrow}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Game Lobby</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>Category selected</Text>
        </View>

        {/* Game Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Game Mode:</Text>
            <Text style={styles.settingValue}>Single Player - No Time Limit</Text>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Objective:</Text>
            <Text style={styles.settingValue}>Find all 10 correct answers per question</Text>
          </View>
        </View>

        {/* Sample Question Preview */}
        {sampleQuestion && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>
              {selectedQuestion ? 'Selected Question' : 'Sample Question'}
            </Text>
            <View style={styles.questionPreview}>
              <Text style={styles.questionTitle}>{sampleQuestion.title}</Text>
              <Text style={styles.questionHint}>
                Find the top 10 answers to this question!
              </Text>
            </View>
          </View>
        )}

        {/* Start Game Button */}
        <View style={styles.startSection}>
          <Button 
            title="Start Game" 
            onPress={handleStartGame}
            style={styles.startButton}
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
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  placeholder: {
    width: 60
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  categoryInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: SPACING.sm,
    textAlign: 'center'
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center'
  },
  settingsSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  settingValue: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md
  },
  previewSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl
  },
  questionPreview: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center'
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center'
  },
  questionHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center'
  },
  startSection: {
    marginBottom: SPACING.xl
  },
  startButton: {
    backgroundColor: COLORS.primary
  }
});

export default GameLobbyScreen;



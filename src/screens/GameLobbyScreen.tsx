import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
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
  const [timeLimit, setTimeLimit] = useState(60);
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
    startGame(categoryName, players, timeLimit, selectedQuestion);
    navigation.navigate('GameScreen', {
      roomId: 'demo-room',
      categoryId: categoryId
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Lobby</Text>
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
            <Text style={styles.settingLabel}>Timer Duration:</Text>
            <View style={styles.timerOptions}>
              {[30, 60, 90].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timerOption,
                    timeLimit === time && styles.timerOptionSelected
                  ]}
                  onPress={() => setTimeLimit(time)}
                >
                  <Text style={[
                    styles.timerOptionText,
                    timeLimit === time && styles.timerOptionTextSelected
                  ]}>
                    {time}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                {selectedQuestion ? 'Single question mode' : 'Try to guess the #1 answer!'}
              </Text>
            </View>
          </View>
        )}

        {!isHost && players.length === 1 ? (
          <View style={styles.roomOptions}>
            <Text style={styles.sectionTitle}>Join or Create Room</Text>
            
            <View style={styles.createSection}>
              <Text style={styles.optionTitle}>Create New Room</Text>
              <Button title="Create Room" onPress={createRoom} />
            </View>

            <View style={styles.joinSection}>
              <Text style={styles.optionTitle}>Join Existing Room</Text>
              <Input 
                placeholder="Enter room code" 
                value={roomCode} 
                onChangeText={setRoomCode}
              />
              <Button title="Join Room" onPress={joinRoom} />
            </View>
          </View>
        ) : (
          <View style={styles.roomInfo}>
            <Text style={styles.sectionTitle}>Room Info</Text>
            <Text style={styles.roomCode}>Room Code: {roomCode || 'ABC123'}</Text>
            
            <View style={styles.playersSection}>
              <Text style={styles.playersTitle}>Players ({players.length})</Text>
              {players.map((player, index) => (
                <Text key={index} style={styles.playerName}>
                  {player} {index === 0 ? '(You)' : ''}
                </Text>
              ))}
            </View>

            {isHost && (
              <Button 
                title="Start Game" 
                onPress={handleStartGame}
                disabled={players.length < 1}
              />
            )}
          </View>
        )}
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
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700'
  },
  placeholder: {
    width: 50
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
    fontWeight: '800'
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: SPACING.xs
  },
  roomOptions: {
    gap: SPACING.xl
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md
  },
  createSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  joinSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  optionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  roomInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  roomCode: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  playersSection: {
    gap: SPACING.sm
  },
  playersTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  playerName: {
    color: COLORS.muted,
    fontSize: 14,
    paddingLeft: SPACING.md
  },
  settingsSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  timerOptions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  timerOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.muted
  },
  timerOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  timerOptionText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '600'
  },
  timerOptionTextSelected: {
    color: COLORS.text
  },
  previewSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md
  },
  questionPreview: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderRadius: 8
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm
  },
  questionHint: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: 'center'
  }
});

export default GameLobbyScreen;



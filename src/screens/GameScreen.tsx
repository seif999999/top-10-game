import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING } from '../utils/constants';
import { GameScreenProps } from '../types/navigation';

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const { roomId, categoryId } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(10);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [players] = useState([
    { name: 'You', score: 0 },
    { name: 'Player 2', score: 0 }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up, submit answer
          submitAnswer();
          return 30; // Reset for next question
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const submitAnswer = () => {
    if (answer.trim()) {
      setScore(score + 10);
      setAnswer('');
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(30);
    }
  };

  const exitGame = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={exitGame}>
          <Text style={styles.exitButton}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Question {currentQuestion}/{totalQuestions}</Text>
        <Text style={styles.timer}>{timeLeft}s</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.questionSection}>
          <Text style={styles.questionTitle}>Top 10 in Category</Text>
          <Text style={styles.questionText}>
            What is the #1 item in this category?
          </Text>
        </View>

        <View style={styles.answerSection}>
          <Text style={styles.answerLabel}>Your Answer:</Text>
          <Input 
            placeholder="Enter your answer..." 
            value={answer} 
            onChangeText={setAnswer}
            style={styles.answerInput}
          />
          <Button 
            title="Submit Answer" 
            onPress={submitAnswer}
            disabled={!answer.trim()}
          />
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreTitle}>Your Score: {score}</Text>
        </View>

        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>Players</Text>
          {players.map((player, index) => (
            <View key={index} style={styles.playerRow}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerScore}>{player.score}</Text>
            </View>
          ))}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  exitButton: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700'
  },
  timer: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  questionSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  questionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md
  },
  questionText: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: 'center'
  },
  answerSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md
  },
  answerLabel: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  answerInput: {
    marginBottom: SPACING.sm
  },
  scoreSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  scoreTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800'
  },
  playersSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  playersTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs
  },
  playerName: {
    color: COLORS.text,
    fontSize: 14
  },
  playerScore: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default GameScreen;



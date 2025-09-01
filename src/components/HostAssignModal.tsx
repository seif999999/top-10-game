import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';
import { Team } from '../types/teams';
import { QuestionAnswer } from '../types';
import Button from './Button';

interface HostAssignModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (teamId: string, points: number) => void;
  answer: QuestionAnswer;
  answerIndex: number;
  teams: Team[];
  currentTeamIndex: number;
}

const HostAssignModal: React.FC<HostAssignModalProps> = ({
  visible,
  onClose,
  onAssign,
  answer,
  answerIndex,
  teams,
  currentTeamIndex,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[currentTeamIndex]?.id || '');
  const [points, setPoints] = useState(answer.points.toString());

  useEffect(() => {
    if (visible && teams[currentTeamIndex]) {
      setSelectedTeamId(teams[currentTeamIndex].id);
      setPoints(answer.points.toString());
    }
  }, [visible, currentTeamIndex, answer.points, teams]);

  const handleAssign = () => {
    try {
      console.log('🎯 HostAssignModal: Assigning answer:', {
        answerIndex,
        answer: answer.text,
        selectedTeamId,
        points: parseInt(points),
      });

      if (!selectedTeamId) {
        Alert.alert('Error', 'Please select a team');
        return;
      }

      const pointsValue = parseInt(points);
      if (isNaN(pointsValue) || pointsValue < 0) {
        Alert.alert('Error', 'Please enter a valid number of points');
        return;
      }

      onAssign(selectedTeamId, pointsValue);
      onClose();
    } catch (error) {
      console.error('❌ HostAssignModal: Error assigning answer:', error);
      Alert.alert('Error', 'Failed to assign answer. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🎯 Assign Answer</Text>
          
          {/* Answer Display */}
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>Answer #{answer.rank}:</Text>
            <Text style={styles.answerText}>{answer.text}</Text>
            <Text style={styles.answerPoints}>Worth {answer.points} points</Text>
          </View>

          {/* Team Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Team</Text>
            <View style={styles.teamSelector}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamButton,
                    selectedTeamId === team.id && styles.selectedTeamButton,
                  ]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <View
                    style={[
                      styles.teamColorIndicator,
                      { backgroundColor: team.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.teamButtonText,
                      selectedTeamId === team.id && styles.selectedTeamButtonText,
                    ]}
                  >
                    {team.name}
                  </Text>
                  <Text
                    style={[
                      styles.teamScore,
                      selectedTeamId === team.id && styles.selectedTeamButtonText,
                    ]}
                  >
                    {team.score} pts
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Points Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Points to Award</Text>
            <TextInput
              style={styles.pointsInput}
              value={points}
              onChangeText={setPoints}
              placeholder={answer.points.toString()}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
            />
            <Text style={styles.pointsHint}>
              Maximum {answer.points} points available
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button title="Cancel" onPress={onClose} style={styles.cancelButton} />
            <Button title="Assign" onPress={handleAssign} style={styles.assignButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  answerSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  answerText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  answerPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  teamSelector: {
    gap: SPACING.sm,
  },
  teamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  selectedTeamButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  teamColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  teamButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedTeamButtonText: {
    color: COLORS.background,
  },
  teamScore: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
  },
  pointsInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  pointsHint: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.error,
  },
  assignButton: {
    flex: 1,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
});

export default HostAssignModal;
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';
import { TeamSetupConfig, TEAM_COLORS, ROUND_TIMER_OPTIONS } from '../types/teams';

interface TeamSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onStartGame: (config: TeamSetupConfig) => void;
}

const TeamSetupModal: React.FC<TeamSetupModalProps> = ({
  visible,
  onClose,
  onStartGame,
}) => {
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2', 'Team 3', 'Team 4']);
  const [roundTimer, setRoundTimer] = useState(60);
  const [maxRounds, setMaxRounds] = useState<number | undefined>(undefined);

  const handleNumberOfTeamsChange = (value: number) => {
    console.log(`🎮 TeamSetupModal: Changing numberOfTeams from ${numberOfTeams} to ${value}`);
    console.log(`🎮 Current teamNames:`, teamNames);
    
    if (value >= 1 && value <= 4) {
      setNumberOfTeams(value);
      // Ensure we have enough team names
      const newTeamNames = [...teamNames];
      for (let i = teamNames.length; i < value; i++) {
        newTeamNames.push(`Team ${i + 1}`);
      }
      console.log(`🎮 Updated teamNames:`, newTeamNames);
      setTeamNames(newTeamNames);
    }
  };

  const handleTeamNameChange = (index: number, name: string) => {
    const newTeamNames = [...teamNames];
    newTeamNames[index] = name;
    setTeamNames(newTeamNames);
  };

  const handleStartGame = () => {
    try {
      console.log('🎮 TeamSetupModal: Starting team game with config:', {
        numberOfTeams,
        teamNames: teamNames.slice(0, numberOfTeams),
        roundTimer,
        maxRounds,
        isHostedLocal: true, // Always host
      });

      // Validate team names
      const validTeamNames = teamNames.slice(0, numberOfTeams).filter(name => name.trim() !== '');
      console.log(`🎮 TeamSetupModal validation:`, {
        numberOfTeams,
        originalTeamNames: teamNames,
        slicedTeamNames: teamNames.slice(0, numberOfTeams),
        validTeamNames,
        validCount: validTeamNames.length
      });
      
      if (validTeamNames.length !== numberOfTeams) {
        Alert.alert('Error', 'Please provide names for all teams');
        return;
      }

      const config: TeamSetupConfig = {
        numberOfTeams,
        teamNames: validTeamNames,
        roundTimer,
        maxRounds,
        isHostedLocal: true, // Always host
      };

      onStartGame(config);
    } catch (error) {
      console.error('❌ TeamSetupModal: Error starting team game:', error);
      Alert.alert('Error', 'Failed to start team game. Please try again.');
    }
  };

  console.log('🎮 TeamSetupModal: Rendering with visible =', visible);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
          <Text style={styles.title}>🎮 Team Setup</Text>
          
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Number of Teams */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Number of Teams</Text>
              <View style={styles.numberSelector}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numberButton,
                      numberOfTeams === num && styles.selectedNumberButton,
                    ]}
                    onPress={() => handleNumberOfTeamsChange(num)}
                  >
                    <Text
                      style={[
                        styles.numberButtonText,
                        numberOfTeams === num && styles.selectedNumberButtonText,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Team Names */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Team Names</Text>
              {teamNames.slice(0, numberOfTeams).map((name, index) => (
                <View key={index} style={styles.teamNameContainer}>
                  <View
                    style={[
                      styles.teamColorIndicator,
                      { backgroundColor: TEAM_COLORS[index] },
                    ]}
                  />
                  <TextInput
                    style={styles.teamNameInput}
                    value={name}
                    onChangeText={(text) => handleTeamNameChange(index, text)}
                    placeholder={`Team ${index + 1}`}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              ))}
            </View>

            {/* Round Timer */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Round Timer</Text>
              <View style={styles.timerSelector}>
                {ROUND_TIMER_OPTIONS.map((seconds) => (
                  <TouchableOpacity
                    key={seconds}
                    style={[
                      styles.timerButton,
                      roundTimer === seconds && styles.selectedTimerButton,
                    ]}
                    onPress={() => setRoundTimer(seconds)}
                  >
                    <Text
                      style={[
                        styles.timerButtonText,
                        roundTimer === seconds && styles.selectedTimerButtonText,
                      ]}
                    >
                      {seconds === 0 ? '∞' : `${seconds}s`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Max Rounds */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Max Rounds (Optional)</Text>
              <View style={styles.maxRoundsContainer}>
                <TouchableOpacity
                  style={[
                    styles.maxRoundsButton,
                    maxRounds === undefined && styles.selectedMaxRoundsButton,
                  ]}
                  onPress={() => setMaxRounds(undefined)}
                >
                  <Text
                    style={[
                      styles.maxRoundsButtonText,
                      maxRounds === undefined && styles.selectedMaxRoundsButtonText,
                    ]}
                  >
                    Unlimited
                  </Text>
                </TouchableOpacity>
                {[1, 3, 5].map((rounds) => (
                  <TouchableOpacity
                    key={rounds}
                    style={[
                      styles.maxRoundsButton,
                      maxRounds === rounds && styles.selectedMaxRoundsButton,
                    ]}
                    onPress={() => setMaxRounds(rounds)}
                  >
                    <Text
                      style={[
                        styles.maxRoundsButtonText,
                        maxRounds === rounds && styles.selectedMaxRoundsButtonText,
                      ]}
                    >
                      {rounds}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>


          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  content: {
    flex: 1,
    minHeight: 300,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.md,
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
  numberSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  numberButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.muted,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedNumberButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedNumberButtonText: {
    color: COLORS.background,
  },
  teamNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  teamColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: SPACING.sm,
  },
  teamNameInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
  },
  timerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timerButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  selectedTimerButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedTimerButtonText: {
    color: COLORS.background,
  },
  maxRoundsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  maxRoundsButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  selectedMaxRoundsButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  maxRoundsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedMaxRoundsButtonText: {
    color: COLORS.background,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.muted,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.muted + '20',
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  cancelButton: {
    marginRight: SPACING.sm,
    backgroundColor: COLORS.error,
  },
  cancelButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeamSetupModal;
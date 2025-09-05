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
    
    // Ensure value is within bounds (1-4)
    const clampedValue = Math.max(1, Math.min(4, value));
    
    if (clampedValue !== numberOfTeams) {
      setNumberOfTeams(clampedValue);
      // Ensure we have enough team names
      const newTeamNames = [...teamNames];
      for (let i = teamNames.length; i < clampedValue; i++) {
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
              <View style={styles.teamCounterContainer}>
                <TouchableOpacity
                  style={[
                    styles.counterButton,
                    numberOfTeams <= 1 && styles.disabledButton,
                  ]}
                  onPress={() => handleNumberOfTeamsChange(numberOfTeams - 1)}
                  disabled={numberOfTeams <= 1}
                >
                  <Text style={[
                    styles.counterButtonText,
                    numberOfTeams <= 1 && styles.disabledButtonText,
                  ]}>-</Text>
                </TouchableOpacity>
                
                <View style={styles.teamCountDisplay}>
                  <Text style={styles.teamCountText}>{numberOfTeams}</Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.counterButton,
                    numberOfTeams >= 4 && styles.disabledButton,
                  ]}
                  onPress={() => handleNumberOfTeamsChange(numberOfTeams + 1)}
                  disabled={numberOfTeams >= 4}
                >
                  <Text style={[
                    styles.counterButtonText,
                    numberOfTeams >= 4 && styles.disabledButtonText,
                  ]}>+</Text>
                </TouchableOpacity>
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
              <Text style={styles.sectionTitle}>Max Rounds</Text>
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
  teamCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  counterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: COLORS.muted,
    opacity: 0.5,
  },
  counterButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.background,
  },
  disabledButtonText: {
    color: COLORS.text,
  },
  teamCountDisplay: {
    width: 80,
    height: 60,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  teamCountText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
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
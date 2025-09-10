import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';

interface RoundTimeSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (timeInSeconds: number) => void;
  currentTime: number;
}

const ROUND_TIME_OPTIONS = [
  { label: '10 seconds', value: 10, description: 'Quick rounds' },
  { label: '20 seconds', value: 20, description: 'Fast paced' },
  { label: '40 seconds', value: 40, description: 'Balanced' },
  { label: '1 minute', value: 60, description: 'Default' },
];

const RoundTimeSelector: React.FC<RoundTimeSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  currentTime,
}) => {
  const [selectedTime, setSelectedTime] = useState(currentTime);

  const handleSelect = () => {
    onSelect(selectedTime);
    onClose();
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
          <Text style={styles.title}>Select Round Time</Text>
          <Text style={styles.subtitle}>
            Choose how long each player has to answer
          </Text>

          <View style={styles.optionsContainer}>
            {ROUND_TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  selectedTime === option.value && styles.selectedOption,
                ]}
                onPress={() => setSelectedTime(option.value)}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedTime === option.value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      selectedTime === option.value && styles.selectedOptionDescription,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                {selectedTime === option.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
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
    borderRadius: 16,
    padding: SPACING.lg,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  optionsContainer: {
    marginBottom: SPACING.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  selectedOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  selectedOptionText: {
    color: COLORS.background,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.muted,
  },
  selectedOptionDescription: {
    color: COLORS.background,
    opacity: 0.8,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    flex: 1,
    padding: SPACING.md,
    marginLeft: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  selectButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoundTimeSelector;

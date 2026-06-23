import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, COLORS } from '../../backend/utils/constants';
import useAppTranslation from '../../hooks/useTranslation';
import { AttemptRecord, partitionAttempts } from '../utils/answerAttempts';

interface AttemptedAnswersListProps {
  attempts: AttemptRecord[];
}

const AttemptedAnswersList: React.FC<AttemptedAnswersListProps> = ({ attempts }) => {
  const { t, isRTL } = useAppTranslation('game');
  const { correct, incorrect } = partitionAttempts(attempts);

  if (attempts.length === 0) {
    return null;
  }

  const renderSection = (
    title: string,
    items: AttemptRecord[],
    itemStyle: object,
    bulletColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{title}</Text>
        {items.map((item, index) => (
          <View
            key={`${title}-${item.text}-${index}`}
            style={[styles.itemRow, isRTL && styles.rtlRow]}
          >
            <View style={[styles.bullet, { backgroundColor: bulletColor }]} />
            <Text style={[styles.itemText, itemStyle, isRTL && styles.rtlText]}>{item.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderSection(
        t('answers.correctGuesses'),
        correct,
        styles.correctText,
        COLORS.success
      )}
      {renderSection(
        t('answers.incorrectGuesses'),
        incorrect,
        styles.incorrectText,
        COLORS.error
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  correctText: {
    color: COLORS.success,
  },
  incorrectText: {
    color: '#FCA5A5',
  },
});

export default AttemptedAnswersList;

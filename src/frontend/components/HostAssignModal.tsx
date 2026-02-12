import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { Team } from '../../shared/types/teams';
import { QuestionAnswer } from '../../shared/types';
import Button from './Button';
import { logger } from '../../backend/utils/logger';
import ThemedAlert from '../utils/themedAlert';
import useAppTranslation from '../../hooks/useTranslation';

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
  const { t } = useAppTranslation('components');
  const { t: tCommon } = useAppTranslation('common');
  const { isRTL } = useAppTranslation();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[currentTeamIndex]?.id || '');

  useEffect(() => {
    if (visible && teams[currentTeamIndex]) {
      setSelectedTeamId(teams[currentTeamIndex].id);
    }
  }, [visible, currentTeamIndex, teams]);

  const handleAssign = () => {
    try {
      logger.log('🎯 HostAssignModal: Assigning answer:', {
        answerIndex,
        answer: answer.text,
        selectedTeamId,
        points: answer.points,
      });

      if (!selectedTeamId) {
        ThemedAlert.warning(tCommon('error'), t('errors.selectTeam'));
        return;
      }

      // Use the fixed points value from the answer object
      onAssign(selectedTeamId, answer.points);
      onClose();
    } catch (error) {
      logger.error('❌ HostAssignModal: Error assigning answer:', error);
      ThemedAlert.error(tCommon('error'), t('errors.assignFailed'));
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
          <Text style={[styles.title, isRTL && styles.rtlText]}>🎯 {t('hostAssign.title')}</Text>
          
          {/* Answer Display */}
          <View style={[styles.answerSection, isRTL && styles.rtlText]}>
            <Text style={[styles.answerLabel, isRTL && styles.rtlText]}>{t('hostAssign.answerRank', { rank: answer.rank })}</Text>
            <Text style={[styles.answerText, isRTL && styles.rtlText]}>{answer.text}</Text>
            <Text style={[styles.answerPoints, isRTL && styles.rtlText]}>{t('hostAssign.worthPoints', { points: answer.points })}</Text>
          </View>

          {/* Team Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('hostAssign.selectTeam')}</Text>
            <View style={styles.teamSelector}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamButton,
                    isRTL && styles.rtlRow,
                    selectedTeamId === team.id && styles.selectedTeamButton,
                  ]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <View
                    style={[
                      styles.teamColorIndicator,
                      { backgroundColor: team.color },
                      isRTL && styles.teamColorIndicatorRTL,
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

          {/* Points Display - Read Only */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('hostAssign.pointsToAward')}</Text>
            <View style={styles.pointsDisplay}>
              <Text style={[styles.pointsDisplayText, isRTL && styles.rtlText]}>
                {answer.points} {t('resultsModal.pointsLabel')}
              </Text>
            </View>
            <Text style={[styles.pointsHint, isRTL && styles.rtlText]}>
              {t('hostAssign.pointsHint')}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actions, isRTL && styles.rtlRow]}>
            <Button title={tCommon('cancel')} onPress={onClose} style={styles.cancelButton} />
            <Button title={t('hostAssign.assign')} onPress={handleAssign} style={styles.assignButton} />
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
  pointsDisplay: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pointsDisplayText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  teamColorIndicatorRTL: {
    marginRight: 0,
    marginLeft: SPACING.sm,
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
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
import useAppTranslation from '../../hooks/useTranslation';

export type HowToPlayMode = 'general' | 'singlePlayer' | 'multiplayer';

const { width, height } = Dimensions.get('window');

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
  mode?: HowToPlayMode;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ visible, onClose, mode = 'general' }) => {
  const { t, isRTL } = useAppTranslation('components');
  const isModeSpecific = mode === 'singlePlayer' || mode === 'multiplayer';
  const modeKey = mode === 'singlePlayer' || mode === 'multiplayer' ? mode : null;

  const renderModeFlow = () => {
    if (!modeKey) return null;
    const steps = [
      t(`howToPlay.modes.${modeKey}.step1`),
      t(`howToPlay.modes.${modeKey}.step2`),
      t(`howToPlay.modes.${modeKey}.step3`),
      t(`howToPlay.modes.${modeKey}.step4`),
      t(`howToPlay.modes.${modeKey}.step5`),
      t(`howToPlay.modes.${modeKey}.step6`),
    ].filter(Boolean);

    return (
      <>
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.sectionIcon, isRTL && styles.sectionIconRTL]}>🎯</Text>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {t(`howToPlay.modes.${modeKey}.flowTitle`)}
            </Text>
          </View>
          <View style={[styles.bulletList, isRTL && styles.bulletListRTL]}>
            {steps.map((step, index) => (
              <View key={`${modeKey}-step-${index}`} style={[styles.bulletItem, isRTL && styles.rtlRow]}>
                <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
                <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
            <Text style={[styles.sectionIcon, isRTL && styles.sectionIconRTL]}>⭐</Text>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {t(`howToPlay.modes.${modeKey}.scoringTitle`)}
            </Text>
          </View>
          <View style={[styles.bulletList, isRTL && styles.bulletListRTL]}>
            <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
              <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
              <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.rank1Point')}</Text>
            </View>
            <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
              <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
              <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.rank10Points')}</Text>
            </View>
            <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
              <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
              <Text style={[styles.bulletText, isRTL && styles.rtlText]}>
                {t(`howToPlay.modes.${modeKey}.winCondition`)}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderGeneralContent = () => (
    <>
      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
          <Text style={[styles.sectionIcon, isRTL && styles.sectionIconRTL]}>📄</Text>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('howToPlay.gameRules')}</Text>
        </View>
        <View style={[styles.bulletList, isRTL && styles.bulletListRTL]}>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.chooseCategory')}</Text>
          </View>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.guessTop10')}</Text>
          </View>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.rank1Point')}</Text>
          </View>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.rank10Points')}</Text>
          </View>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.mostPointsWins')}</Text>
          </View>
          <View style={[styles.bulletItem, isRTL && styles.rtlRow]}>
            <View style={[styles.bulletDot, isRTL && styles.bulletDotRTL]} />
            <Text style={[styles.bulletText, isRTL && styles.rtlText]}>{t('howToPlay.strategicAdvantage')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
          <Text style={[styles.sectionIcon, isRTL && styles.sectionIconRTL]}>🎮</Text>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>{t('howToPlay.gameModes')}</Text>
        </View>
        <View style={[styles.gameModeList, isRTL && styles.bulletListRTL]}>
          <View style={styles.gameModeItem}>
            <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{t('howToPlay.singlePlayer')}</Text>
            <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{t('howToPlay.singlePlayerDesc')}</Text>
          </View>
          <View style={styles.gameModeItem}>
            <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{t('howToPlay.multiplayer')}</Text>
            <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{t('howToPlay.multiplayerDesc')}</Text>
          </View>
          <View style={styles.gameModeItem}>
            <Text style={[styles.gameModeTitle, isRTL && styles.rtlText]}>{t('howToPlay.custom')}</Text>
            <Text style={[styles.gameModeSubtitle, isRTL && styles.rtlText]}>{t('howToPlay.customDesc')}</Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.header, isRTL && styles.rtlRow]}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>
              {isModeSpecific && modeKey
                ? t(`howToPlay.modes.${modeKey}.title`)
                : t('howToPlay.title')}
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {isModeSpecific ? renderModeFlow() : renderGeneralContent()}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.gotItButton} activeOpacity={0.9}>
            <LinearGradient
              colors={['#4F46E5', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={[styles.buttonText, isRTL && styles.rtlText]}>{t('howToPlay.gotIt')}</Text>
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
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  sectionIconRTL: {
    marginRight: 0,
    marginLeft: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulletList: {
    paddingLeft: SPACING.md,
  },
  bulletListRTL: {
    paddingLeft: 0,
    paddingRight: SPACING.md,
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
  bulletDotRTL: {
    marginRight: 0,
    marginLeft: SPACING.md,
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

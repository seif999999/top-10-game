import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { CustomQuestionSlotsScreenProps } from '../../shared/types/navigation';
import CustomQuestionService from '../../backend/services/customQuestionService';
import type { CustomQuestion } from '../../shared/types';
import { useAudio } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import ThemedAlert from '../utils/themedAlert';
import { logger } from '../../backend/utils/logger';
import useAppTranslation from '../../hooks/useTranslation';
import { getUnlockedSlots, unlockSlot, isSlotUsable, getSlotUnlockCost } from '../../backend/services/customSlotUnlockService';

const NUM_SLOTS = CustomQuestionService.NUM_SLOTS;

const CustomQuestionSlotsScreen: React.FC<CustomQuestionSlotsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { playButtonClick } = useAudio();
  const { user } = useAuth();
  const { t: tScreens } = useAppTranslation('screens');
  const { t: tCommon } = useAppTranslation('common');
  const { isRTL } = useAppTranslation();
  const [slots, setSlots] = useState<(CustomQuestion | null)[]>(Array(NUM_SLOTS).fill(null));
  const [unlockedSlots, setUnlockedSlots] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockingSlot, setUnlockingSlot] = useState<number | null>(null);

  const loadSlots = useCallback(async () => {
    try {
      const service = CustomQuestionService.getInstance();
      const data = await service.getSlots();
      setSlots(data);
    } catch {
      setSlots(Array(NUM_SLOTS).fill(null));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadUnlockedSlots = useCallback(async () => {
    if (!user?.id) {
      setUnlockedSlots([]);
      return;
    }
    try {
      const list = await getUnlockedSlots(user.id);
      setUnlockedSlots(list);
    } catch {
      setUnlockedSlots([]);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadSlots();
      loadUnlockedSlots();
    }, [loadSlots, loadUnlockedSlots])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSlots();
    loadUnlockedSlots();
  };

  const handleSlotPress = async (slotIndex: number) => {
    playButtonClick();
    const usable = isSlotUsable(slotIndex, unlockedSlots, slots[slotIndex] != null);
    if (usable) {
      navigation.navigate('CreateCustomQuestion', { slotIndex });
      return;
    }
    // Locked paid slot
    if (!user?.id) {
      ThemedAlert.info(tScreens('customQuestionSlots.signInToUnlock'), '');
      return;
    }
    const cost = getSlotUnlockCost(slotIndex);
    ThemedAlert.alert(
      tScreens('customQuestionSlots.unlockSlotTitle', { number: slotIndex + 1 }),
      tScreens('customQuestionSlots.unlockSlotMessage', { cost }),
      [
        { text: tCommon('cancel'), style: 'cancel', onPress: () => {} },
        {
          text: tCommon('confirm'),
          onPress: async () => {
            setUnlockingSlot(slotIndex);
            try {
              const success = await unlockSlot(user.id, slotIndex);
              if (success) {
                setUnlockedSlots((prev) => [...prev, slotIndex].sort((a, b) => a - b));
                ThemedAlert.success(tCommon('success'), tScreens('customQuestionSlots.unlockSuccess', { number: slotIndex + 1 }));
                navigation.navigate('CreateCustomQuestion', { slotIndex });
              } else {
                ThemedAlert.warning(
                  tCommon('error'),
                  tScreens('customQuestionSlots.unlockInsufficientCoins', { cost }),
                  [
                    { text: tCommon('cancel'), style: 'cancel' },
                    { text: tScreens('customQuestionSlots.goToCoinShop', { defaultValue: 'Get Coins' }), onPress: () => navigation.navigate('CoinsShop') },
                  ]
                );
              }
            } catch (e) {
              logger.error('Unlock slot failed', e);
              ThemedAlert.error(
                tCommon('error'),
                tScreens('customQuestionSlots.unlockInsufficientCoins', { cost }),
                [
                  { text: tCommon('cancel'), style: 'cancel' },
                  { text: tScreens('customQuestionSlots.goToCoinShop', { defaultValue: 'Get Coins' }), onPress: () => navigation.navigate('CoinsShop') },
                ]
              );
            } finally {
              setUnlockingSlot(null);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    playButtonClick();
    ThemedAlert.alert(
      tScreens('customQuestionSlots.clearAllTitle'),
      tScreens('customQuestionSlots.clearAllMessage'),
      [
        {
          text: tCommon('cancel'),
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: tScreens('customQuestionSlots.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              const service = CustomQuestionService.getInstance();
              await service.clearAllCustomQuestions();
              setSlots(Array(NUM_SLOTS).fill(null));
              logger.log('✅ All custom question slots cleared');
              ThemedAlert.success(tCommon('success'), tScreens('customQuestionSlots.allCleared'));
            } catch (error) {
              logger.error('Error clearing custom questions:', error);
              ThemedAlert.error(tCommon('error'), tScreens('customQuestionSlots.clearError'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
        <TouchableOpacity onPress={() => { playButtonClick(); navigation.goBack(); }} style={styles.backButton}>
          <Text style={styles.backButtonText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{tScreens('customQuestionSlots.title')}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{tScreens('customQuestionSlots.subtitle')}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}
      >
        {loading ? (
          <Text style={styles.loadingText}>{tScreens('customQuestionSlots.loadingSlots')}</Text>
        ) : (
          Array.from({ length: NUM_SLOTS }, (_, i) => {
            const question = slots[i];
            const label = question ? question.question : tScreens('customQuestionSlots.slotEmpty', { number: i + 1 });
            const isFilled = question != null;
            const isLocked = !isSlotUsable(i, unlockedSlots, question != null);
            const isUnlocking = unlockingSlot === i;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => !isUnlocking && handleSlotPress(i)}
                disabled={isUnlocking}
                style={[styles.slotTouch, isLocked && styles.slotTouchLocked]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isLocked ? ['#1F2937', '#374151'] : isFilled ? ['#6D28D9', '#8B5CF6'] : ['#374151', '#4B5563']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.slotGradient, isRTL && styles.rtlRow]}
                >
                  <View style={[styles.slotNumberBadge, isRTL && { marginRight: 0, marginLeft: SPACING.md }]}>
                    <Text style={styles.slotNumberText}>{isLocked ? '🔒' : i + 1}</Text>
                  </View>
                  <View style={styles.slotLabelContainer}>
                    <Text style={[styles.slotLabel, isRTL && styles.rtlText]} numberOfLines={2}>
                      {isFilled ? label : tScreens('customQuestionSlots.slotLabel', { number: i + 1 })}
                    </Text>
                    <Text style={[styles.slotHint, isRTL && styles.rtlText]}>
                      {isLocked
                        ? tScreens('customQuestionSlots.unlockForCoins', { cost: getSlotUnlockCost(i) })
                        : isFilled
                          ? tScreens('customQuestionSlots.tapToEdit')
                          : tScreens('customQuestionSlots.tapToAdd')}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton} activeOpacity={0.8}>
          <Text style={styles.clearAllButtonText}>{tScreens('customQuestionSlots.clearAllSlots')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loadingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  slotTouch: {
    marginBottom: SPACING.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  slotTouchLocked: {
    borderColor: 'rgba(107, 114, 128, 0.5)',
    opacity: 0.9,
  },
  slotGradient: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  slotNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  slotNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  slotLabelContainer: {
    flex: 1,
  },
  slotLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  slotHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: SPACING.sm,
  },
  bottomButtonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  clearAllButton: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clearAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default CustomQuestionSlotsScreen;

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { CustomQuestionSlotsScreenProps } from '../../shared/types/navigation';
import CustomQuestionService from '../../backend/services/customQuestionService';
import type { CustomQuestion } from '../../shared/types';
import { useAudio } from '../contexts/AudioContext';
import ThemedAlert from '../utils/themedAlert';
import { logger } from '../../backend/utils/logger';

const NUM_SLOTS = CustomQuestionService.NUM_SLOTS;

const CustomQuestionSlotsScreen: React.FC<CustomQuestionSlotsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { playButtonClick } = useAudio();
  const [slots, setSlots] = useState<(CustomQuestion | null)[]>(Array(NUM_SLOTS).fill(null));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadSlots();
    }, [loadSlots])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadSlots();
  };

  const handleSlotPress = (slotIndex: number) => {
    playButtonClick();
    navigation.navigate('CreateCustomQuestion', { slotIndex });
  };

  const handleClearAll = () => {
    playButtonClick();
    ThemedAlert.alert(
      'Clear All Slots',
      'Are you sure you want to delete all your custom questions? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const service = CustomQuestionService.getInstance();
              await service.clearAllCustomQuestions();
              setSlots(Array(NUM_SLOTS).fill(null));
              logger.log('✅ All custom question slots cleared');
              ThemedAlert.success('Success', 'All slots have been cleared.');
            } catch (error) {
              logger.error('Error clearing custom questions:', error);
              ThemedAlert.error('Error', 'Failed to clear slots. Please try again.');
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

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => { playButtonClick(); navigation.goBack(); }} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Your Own</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>Choose a slot to create or edit your question</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading slots...</Text>
        ) : (
          Array.from({ length: NUM_SLOTS }, (_, i) => {
            const question = slots[i];
            const label = question ? question.question : `Slot ${i + 1} (empty)`;
            const isFilled = question != null;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSlotPress(i)}
                style={styles.slotTouch}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isFilled ? ['#6D28D9', '#8B5CF6'] : ['#374151', '#4B5563']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.slotGradient}
                >
                  <View style={styles.slotNumberBadge}>
                    <Text style={styles.slotNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.slotLabel} numberOfLines={2}>
                    {isFilled ? label : `Slot ${i + 1}`}
                  </Text>
                  <Text style={styles.slotHint}>{isFilled ? 'Tap to edit or play' : 'Tap to add question'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton} activeOpacity={0.8}>
          <Text style={styles.clearAllButtonText}>Clear All Slots</Text>
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
  slotLabel: {
    flex: 1,
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
});

export default CustomQuestionSlotsScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../shared/types/navigation';
import { COLORS, SPACING } from '../../backend/utils/constants';
import { useAudio } from '../contexts/AudioContext';

type CoinHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'CoinHistory'>;

const CoinHistoryScreen: React.FC<CoinHistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { playButtonClick } = useAudio();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={StyleSheet.absoluteFill} />
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }]}>
        <TouchableOpacity
          onPress={() => {
            playButtonClick();
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <LinearGradient colors={['#374151', '#1F2937']} style={styles.backButtonGradient}>
            <Text style={styles.backButtonText}>←</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coin History</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Coin history</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    width: 42,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  placeholderText: {
    color: COLORS.muted,
    fontSize: 16,
  },
});

export default CoinHistoryScreen;

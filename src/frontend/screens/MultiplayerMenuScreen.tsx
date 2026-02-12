import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../backend/utils/constants';
import useAppTranslation from '../../hooks/useTranslation';
import BannerAd from '../components/ads/BannerAd';

const { width, height } = Dimensions.get('window');

interface MultiplayerMenuScreenProps {}

const MultiplayerMenuScreen: React.FC<MultiplayerMenuScreenProps> = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useAppTranslation('screens');
  const { t: tCommon } = useAppTranslation('common');
  const { isRTL } = useAppTranslation();

  const handleCreateRoom = () => {
    navigation.navigate('MultiplayerCategory' as never);
  };

  const handleJoinRoom = () => {
    navigation.navigate('JoinRoom' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dark Purple Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f1e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(SPACING.xs, insets.top * 0.5) }, isRTL && styles.rtlRow]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel={tCommon('back')}
          accessibilityHint="Returns to main menu"
        >
          <View style={styles.backButtonContent}>
            <Text style={styles.backButtonArrow}>{isRTL ? '→' : '←'}</Text>
            <View style={styles.backButtonDash} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('multiplayer.title')}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.mainContent}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={[styles.descriptionText, isRTL && styles.rtlText]}>
            {t('multiplayer.menu.description')}
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCreateRoom}
            activeOpacity={0.9}
            accessibilityLabel={t('multiplayer.menu.createRoomTitle')}
            accessibilityHint="Opens room creation screen"
          >
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.cardContent, isRTL && styles.rtlRow]}>
                <Text style={[styles.cardIcon, isRTL && { marginRight: 0, marginLeft: SPACING.lg }]}>🏡</Text>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t('multiplayer.menu.createRoomTitle')}</Text>
                  <Text style={[styles.cardSubtitle, isRTL && styles.rtlText]}>{t('multiplayer.menu.createRoomSubtitle')}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleJoinRoom}
            activeOpacity={0.9}
            accessibilityLabel={t('multiplayer.menu.joinRoomTitle')}
            accessibilityHint="Opens room joining screen"
          >
            <LinearGradient
              colors={['#7C3AED', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.cardContent, isRTL && styles.rtlRow]}>
                <Text style={[styles.cardIcon, isRTL && { marginRight: 0, marginLeft: SPACING.lg }]}>🚪</Text>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t('multiplayer.menu.joinRoomTitle')}</Text>
                  <Text style={[styles.cardSubtitle, isRTL && styles.rtlText]}>{t('multiplayer.menu.joinRoomSubtitle')}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How it works Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, isRTL && styles.rtlText]}>{t('multiplayer.menu.howItWorks')}</Text>
          <View style={styles.infoList}>
            <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
              <View style={[styles.infoBulletDot, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t('multiplayer.menu.bullet1')}</Text>
            </View>
            <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
              <View style={[styles.infoBulletDot, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t('multiplayer.menu.bullet2')}</Text>
            </View>
            <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
              <View style={[styles.infoBulletDot, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t('multiplayer.menu.bullet3')}</Text>
            </View>
            <View style={[styles.infoItem, isRTL && styles.rtlRow]}>
              <View style={[styles.infoBulletDot, isRTL && { marginRight: 0, marginLeft: SPACING.md }]} />
              <Text style={[styles.infoText, isRTL && styles.rtlText]}>{t('multiplayer.menu.bullet4')}</Text>
            </View>
          </View>
        </View>
        </ScrollView>
        <BannerAd position="bottom" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600' as const,
    textShadowColor: 'rgba(173, 216, 230, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  descriptionSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  descriptionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.85,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.9,
  },
  buttonContainer: {
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
    marginTop: SPACING.lg,
  },
  actionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 48,
    marginRight: SPACING.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.80)',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#666666',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: SPACING.md,
    marginTop: 6,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 24,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default MultiplayerMenuScreen;

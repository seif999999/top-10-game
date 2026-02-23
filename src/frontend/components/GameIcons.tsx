import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface IconProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

/**
 * Single Player Icon
 * Clean, professional minimalist design - person silhouette with phone
 */
export const SinglePlayerIcon: React.FC<IconProps> = ({
  size = 80,
  primaryColor = '#8B5CF6',
  secondaryColor = '#A78BFA',
  accentColor = '#60A5FA',
}) => {
  const scale = size / 80;
  
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Professional minimalist design */}
      <View style={[styles.singlePlayerContainer, { transform: [{ scale }] }]}>
        {/* Person silhouette - simplified head and shoulders */}
        <View style={styles.singlePersonSilhouette}>
          {/* Head - simple circle */}
          <View style={[styles.singleHeadSimple, { backgroundColor: primaryColor }]} />
          
          {/* Shoulders/body - clean rounded rectangle */}
          <View style={styles.singleShoulders}>
            {/* Subtle gradient for depth */}
            <LinearGradient
              colors={[primaryColor, secondaryColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.singleShouldersGradient}
            />
          </View>
        </View>
        
        {/* Phone - prominent, modern design */}
        <View style={styles.singlePhoneModern}>
          <View style={styles.singlePhoneFrameModern}>
            {/* Screen with subtle gradient */}
            <LinearGradient
              colors={[accentColor, '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.singlePhoneScreenModern}
            >
              {/* Minimalist UI indicator */}
              <View style={styles.singlePhoneUI} />
            </LinearGradient>
          </View>
        </View>
        
        {/* Subtle glow effect for professionalism */}
        <View style={[styles.singleGlow, { 
          backgroundColor: primaryColor,
          opacity: 0.15,
          width: 60 * scale,
          height: 60 * scale,
          borderRadius: 30 * scale,
        }]} />
      </View>
    </View>
  );
};

/**
 * Multiplayer Icon
 * Multiple hands holding phones from different angles - diverse skin tones
 */
export const MultiplayerIcon: React.FC<IconProps> = ({
  size = 80,
  primaryColor = '#8B5CF6',
  secondaryColor = '#A78BFA',
  accentColor = '#60A5FA',
}) => {
  const scale = size / 80;
  
  // Different skin tones and sleeve colors - spread out more
  const hands = [
    { skin: '#FCD9B6', sleeve: '#6366F1', rotation: '-30deg', position: { top: -12, left: -12 } }, // Top-left, light skin, purple sleeve
    { skin: '#8D5524', sleeve: '#6366F1', rotation: '30deg', position: { top: -12, right: -12 } }, // Top-right, dark skin, purple sleeve  
    { skin: '#D4A574', sleeve: '#9CA3AF', rotation: '150deg', position: { bottom: -12, right: -12 } }, // Bottom-right, medium skin, gray sleeve
    { skin: '#FFDBAC', sleeve: '#3B82F6', rotation: '-150deg', position: { bottom: -12, left: -12 } }, // Bottom-left, fair skin, blue sleeve
  ];
  
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Center area where phones meet */}
      <View style={[styles.centerMeet, { 
        width: 24 * scale, 
        height: 24 * scale, 
        borderRadius: 12 * scale,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
      }]} />
      
      {/* Four hands with phones */}
      {hands.map((hand, index) => (
        <View 
          key={index}
          style={[
            styles.handWithPhone,
            {
              transform: [{ scale: scale * 0.85 }, { rotate: hand.rotation }],
              ...hand.position,
            }
          ]}
        >
          {/* Sleeve/Arm */}
          <View style={[styles.sleeve, { backgroundColor: hand.sleeve }]}>
            {/* Sleeve cuff pattern for sweater look */}
            <View style={styles.sleeveCuff} />
          </View>
          
          {/* Wrist */}
          <View style={[styles.wrist, { backgroundColor: hand.skin }]} />
          
          {/* Hand holding phone */}
          <View style={[styles.handBase, { backgroundColor: hand.skin }]}>
            {/* Thumb on side of phone */}
            <View style={[styles.thumb, { backgroundColor: hand.skin }]} />
            
            {/* Phone */}
            <View style={styles.multiPhone}>
              <View style={styles.multiPhoneFrame}>
                <LinearGradient
                  colors={['#E5E7EB', '#F3F4F6']}
                  style={styles.multiPhoneScreen}
                >
                  {/* App UI lines */}
                  <View style={styles.appHeader} />
                  <View style={styles.appLine} />
                  <View style={styles.appLine} />
                  <View style={[styles.appLine, { width: '60%' }]} />
                </LinearGradient>
              </View>
            </View>
            
            {/* Fingers wrapped around phone */}
            <View style={styles.fingersWrap}>
              <View style={[styles.fingerWrap, { backgroundColor: hand.skin }]} />
              <View style={[styles.fingerWrap, { backgroundColor: hand.skin }]} />
              <View style={[styles.fingerWrap, { backgroundColor: hand.skin }]} />
              <View style={[styles.fingerWrap, { backgroundColor: hand.skin }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Create Your Own Icon
 * Pencil and paper - creativity theme
 */
export const CreateIcon: React.FC<IconProps> = ({
  size = 80,
  primaryColor = '#8B5CF6',
  secondaryColor = '#A78BFA',
  accentColor = '#FBBF24',
}) => {
  const scale = size / 80;
  
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Paper background */}
      <View style={[styles.createPaper, { transform: [{ scale }, { rotate: '-5deg' }] }]}>
        <View style={styles.createPaperLine} />
        <View style={styles.createPaperLine} />
        <View style={styles.createPaperLine} />
        <View style={styles.createPaperLine} />
      </View>
      
      {/* Pencil */}
      <View style={[styles.createPencil, { transform: [{ scale }, { rotate: '40deg' }] }]}>
        {/* Eraser */}
        <View style={styles.createEraser} />
        <View style={styles.createBand} />
        
        {/* Body */}
        <LinearGradient
          colors={[primaryColor, secondaryColor]}
          style={styles.createPencilBody}
        />
        
        {/* Tip */}
        <View style={styles.createTipWood} />
        <View style={styles.createTipLead} />
      </View>
      
      {/* Sparkle accents */}
      <View style={[styles.createSparkle, { top: 8 * scale, right: 8 * scale, backgroundColor: accentColor }]} />
      <View style={[styles.createSparkle, { top: 18 * scale, left: 10 * scale, backgroundColor: '#F472B6', width: 4 * scale, height: 4 * scale }]} />
      <View style={[styles.createSparkle, { bottom: 15 * scale, right: 15 * scale, backgroundColor: '#34D399', width: 5 * scale, height: 5 * scale }]} />
    </View>
  );
};

/**
 * Shuffle/Random Icon
 * Crossed arrows shuffle animation feel
 */
export const ShuffleIcon: React.FC<IconProps> = ({
  size = 80,
  primaryColor = '#8B5CF6',
  secondaryColor = '#A78BFA',
  accentColor = '#22C55E',
}) => {
  const scale = size / 80;
  
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Background glow */}
      <View style={[styles.shuffleGlow, { 
        width: size * 0.7, 
        height: size * 0.7, 
        borderRadius: size * 0.35,
        backgroundColor: `${accentColor}20`,
      }]} />
      
      {/* Shuffle arrows container */}
      <View style={[styles.shuffleContainer, { transform: [{ scale }] }]}>
        {/* Top-right arrow */}
        <View style={styles.shuffleArrowGroup}>
          {/* Arrow line going up-right */}
          <View style={[styles.shuffleArrowLine, { backgroundColor: primaryColor }]} />
          {/* Arrowhead */}
          <View style={[styles.shuffleArrowHead, { 
            borderBottomColor: primaryColor,
            transform: [{ rotate: '45deg' }],
          }]} />
        </View>
        
        {/* Bottom-left arrow */}
        <View style={[styles.shuffleArrowGroup, { transform: [{ rotate: '180deg' }] }]}>
          {/* Arrow line going down-left */}
          <View style={[styles.shuffleArrowLine, { backgroundColor: secondaryColor }]} />
          {/* Arrowhead */}
          <View style={[styles.shuffleArrowHead, { 
            borderBottomColor: secondaryColor,
            transform: [{ rotate: '45deg' }],
          }]} />
        </View>
        
        {/* Cross point circle */}
        <View style={[styles.shuffleCrossPoint, { backgroundColor: accentColor }]} />
      </View>
      
      {/* Decorative dots */}
      <View style={[styles.shuffleDot, { top: 8 * scale, right: 12 * scale, backgroundColor: accentColor }]} />
      <View style={[styles.shuffleDot, { bottom: 10 * scale, left: 10 * scale, backgroundColor: '#F472B6', width: 5 * scale, height: 5 * scale }]} />
      <View style={[styles.shuffleDot, { top: 16 * scale, left: 14 * scale, backgroundColor: '#60A5FA', width: 4 * scale, height: 4 * scale }]} />
    </View>
  );
};

/**
 * How To Play Icon
 * Question mark with help theme
 */
export const HowToPlayIcon: React.FC<IconProps> = ({
  size = 80,
  primaryColor = '#8B5CF6',
  secondaryColor = '#A78BFA',
  accentColor = '#60A5FA',
}) => {
  const scale = size / 80;
  
  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <LinearGradient
        colors={[`${accentColor}30`, `${primaryColor}20`]}
        style={[styles.helpCircle, { 
          width: size * 0.85, 
          height: size * 0.85, 
          borderRadius: size * 0.425,
        }]}
      />
      
      {/* Question mark made of shapes */}
      <View style={[styles.questionContainer, { transform: [{ scale }] }]}>
        {/* Curved top of ? */}
        <View style={styles.questionCurve}>
          <View style={[styles.questionCurveInner, { borderColor: primaryColor }]} />
        </View>
        {/* Stem */}
        <View style={[styles.questionStem, { backgroundColor: primaryColor }]} />
        {/* Dot */}
        <View style={[styles.questionDot, { backgroundColor: primaryColor }]} />
      </View>
      
      {/* Decorative elements */}
      <View style={[styles.helpDot, { top: 10 * scale, left: 12 * scale, backgroundColor: accentColor }]} />
      <View style={[styles.helpDot, { bottom: 12 * scale, right: 10 * scale, backgroundColor: '#F472B6', width: 5 * scale, height: 5 * scale }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  
  // ========== SINGLE PLAYER STYLES ==========
  singlePlayerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
    height: 80,
  },
  singleGlow: {
    position: 'absolute',
    zIndex: 0,
  },
  singlePersonSilhouette: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    marginBottom: 8,
  },
  singleHeadSimple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  singleShoulders: {
    width: 32,
    height: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  singleShouldersGradient: {
    width: '100%',
    height: '100%',
  },
  singlePhoneModern: {
    position: 'absolute',
    bottom: 8,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  singlePhoneFrameModern: {
    width: 18,
    height: 28,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  singlePhoneScreenModern: {
    flex: 1,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singlePhoneUI: {
    width: 8,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 1,
  },
  
  // ========== MULTIPLAYER STYLES ==========
  centerMeet: {
    position: 'absolute',
    zIndex: 0,
  },
  handWithPhone: {
    position: 'absolute',
    alignItems: 'center',
  },
  sleeve: {
    width: 22,
    height: 16,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    position: 'relative',
  },
  sleeveCuff: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
  },
  wrist: {
    width: 16,
    height: 6,
    marginTop: -1,
  },
  handBase: {
    width: 24,
    height: 20,
    borderRadius: 4,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },
  thumb: {
    position: 'absolute',
    left: -4,
    top: 6,
    width: 6,
    height: 10,
    borderRadius: 3,
  },
  multiPhone: {
    zIndex: 2,
  },
  multiPhoneFrame: {
    width: 20,
    height: 32,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    padding: 2,
  },
  multiPhoneScreen: {
    flex: 1,
    borderRadius: 2,
    padding: 3,
  },
  appHeader: {
    width: '100%',
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 1,
    marginBottom: 3,
  },
  appLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
    marginBottom: 2,
  },
  fingersWrap: {
    position: 'absolute',
    right: -2,
    top: 4,
    gap: 2,
  },
  fingerWrap: {
    width: 5,
    height: 6,
    borderRadius: 2,
  },
  
  // ========== CREATE ICON STYLES ==========
  createPaper: {
    position: 'absolute',
    width: 36,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    bottom: 5,
    left: 8,
  },
  createPaperLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    marginBottom: 5,
  },
  createPencil: {
    position: 'absolute',
    alignItems: 'center',
    top: 5,
    right: 10,
  },
  createEraser: {
    width: 12,
    height: 8,
    backgroundColor: '#EC4899',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  createBand: {
    width: 12,
    height: 3,
    backgroundColor: '#9CA3AF',
  },
  createPencilBody: {
    width: 12,
    height: 32,
  },
  createTipWood: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F59E0B',
  },
  createTipLead: {
    width: 0,
    height: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#374151',
    marginTop: -1,
  },
  createSparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  // ========== HELP ICON STYLES ==========
  helpCircle: {
    position: 'absolute',
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionCurve: {
    width: 28,
    height: 20,
    overflow: 'hidden',
  },
  questionCurveInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 6,
    backgroundColor: 'transparent',
    marginTop: -8,
  },
  questionStem: {
    width: 6,
    height: 12,
    borderRadius: 3,
    marginTop: -4,
    marginLeft: 8,
  },
  questionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginLeft: 8,
  },
  helpDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  // ========== SHUFFLE ICON STYLES ==========
  shuffleGlow: {
    position: 'absolute',
  },
  shuffleContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shuffleArrowGroup: {
    position: 'absolute',
    width: 40,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shuffleArrowLine: {
    width: 32,
    height: 6,
    borderRadius: 3,
  },
  shuffleArrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: -4,
  },
  shuffleCrossPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
  },
  shuffleDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default {
  SinglePlayerIcon,
  MultiplayerIcon,
  CreateIcon,
  HowToPlayIcon,
  ShuffleIcon,
};

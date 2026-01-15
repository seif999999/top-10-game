import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/constants';
import { logger } from '../utils/logger';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onAccept,
  onDecline,
  onClose,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!hasScrolledToBottom) {
      Alert.alert(
        'Please Read the Privacy Policy',
        'You must scroll to the bottom of the privacy policy before accepting.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsAccepting(true);
    try {
      // Simulate acceptance process
      await new Promise(resolve => setTimeout(resolve, 500));
      onAccept();
    } catch (error) {
      logger.error('Error accepting privacy policy:', error);
      Alert.alert('Error', 'Failed to accept privacy policy. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Privacy Policy Required',
      'You must accept the privacy policy to use this app. Would you like to read it again?',
      [
        { text: 'Read Again', style: 'default' },
        { text: 'Exit App', style: 'destructive', onPress: onDecline }
      ]
    );
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            Please read and accept our privacy policy to continue
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.content}>
            <Text style={styles.lastUpdated}>
              Last Updated: {new Date().toLocaleDateString()}
            </Text>

            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information you provide directly to us, such as when you create an account, 
              play games, or contact us for support. This includes:
            </Text>
            <Text style={styles.bulletPoint}>
              • Account information (email address, display name, avatar selection)
            </Text>
            <Text style={styles.bulletPoint}>
              • Game data (scores, game history, multiplayer room participation)
            </Text>
            <Text style={styles.bulletPoint}>
              • Device information (device type, operating system, app version)
            </Text>
            <Text style={styles.bulletPoint}>
              • Usage data (game sessions, features used, performance metrics)
            </Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use the information we collect to:
            </Text>
            <Text style={styles.bulletPoint}>
              • Provide and maintain our gaming services
            </Text>
            <Text style={styles.bulletPoint}>
              • Process your game scores and maintain leaderboards
            </Text>
            <Text style={styles.bulletPoint}>
              • Enable multiplayer functionality and room management
            </Text>
            <Text style={styles.bulletPoint}>
              • Improve our app and develop new features
            </Text>
            <Text style={styles.bulletPoint}>
              • Provide customer support and respond to your inquiries
            </Text>
            <Text style={styles.bulletPoint}>
              • Ensure app security and prevent abuse
            </Text>

            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
            <Text style={styles.sectionText}>
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              except in the following circumstances:
            </Text>
            <Text style={styles.bulletPoint}>
              • With your explicit consent
            </Text>
            <Text style={styles.bulletPoint}>
              • To comply with legal obligations
            </Text>
            <Text style={styles.bulletPoint}>
              • To protect our rights and prevent fraud
            </Text>
            <Text style={styles.bulletPoint}>
              • With service providers who assist in app operations (under strict confidentiality)
            </Text>

            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate security measures to protect your personal information:
            </Text>
            <Text style={styles.bulletPoint}>
              • Encryption of data in transit and at rest
            </Text>
            <Text style={styles.bulletPoint}>
              • Regular security audits and updates
            </Text>
            <Text style={styles.bulletPoint}>
              • Access controls and authentication
            </Text>
            <Text style={styles.bulletPoint}>
              • Rate limiting and abuse prevention
            </Text>

            <Text style={styles.sectionTitle}>5. Data Retention</Text>
            <Text style={styles.sectionText}>
              We retain your information for as long as necessary to provide our services:
            </Text>
            <Text style={styles.bulletPoint}>
              • Account data: Until you delete your account
            </Text>
            <Text style={styles.bulletPoint}>
              • Game data: 2 years after last activity
            </Text>
            <Text style={styles.bulletPoint}>
              • Analytics data: 1 year after collection
            </Text>
            <Text style={styles.bulletPoint}>
              • Support data: 3 years after resolution
            </Text>

            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:
            </Text>
            <Text style={styles.bulletPoint}>
              • Access your personal information
            </Text>
            <Text style={styles.bulletPoint}>
              • Correct inaccurate information
            </Text>
            <Text style={styles.bulletPoint}>
              • Delete your account and data
            </Text>
            <Text style={styles.bulletPoint}>
              • Export your data
            </Text>
            <Text style={styles.bulletPoint}>
              • Withdraw consent at any time
            </Text>

            <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
            <Text style={styles.sectionText}>
              Our app is designed for users of all ages. We do not knowingly collect personal 
              information from children under 13 without parental consent. If you believe we 
              have collected information from a child under 13, please contact us immediately.

              Parents can request to review, delete, or stop the collection of their child's 
              information at any time.
            </Text>

            <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
            <Text style={styles.sectionText}>
              Our app uses the following third-party services:
            </Text>
            <Text style={styles.bulletPoint}>
              • Firebase (Google) - Authentication and data storage
            </Text>
            <Text style={styles.bulletPoint}>
              • Google Sign-In - Authentication option
            </Text>
            <Text style={styles.bulletPoint}>
              • Content Moderation APIs - Content filtering
            </Text>
            <Text style={styles.sectionText}>
              These services have their own privacy policies, which we encourage you to review.
            </Text>

            <Text style={styles.sectionTitle}>9. Changes to This Policy</Text>
            <Text style={styles.sectionText}>
              We may update this privacy policy from time to time. We will notify you of any 
              material changes by posting the new policy in the app and updating the "Last Updated" 
              date. Your continued use of the app after such changes constitutes acceptance of the 
              new policy.
            </Text>

            <Text style={styles.sectionTitle}>10. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have any questions about this privacy policy or our data practices, please 
              contact us at:
            </Text>
            <Text style={styles.contactInfo}>
              Email: privacy@top10game.com{'\n'}
              Address: [Your Company Address]{'\n'}
              Phone: [Your Contact Number]
            </Text>

            <View style={styles.scrollIndicator}>
              <Text style={styles.scrollText}>
                {hasScrolledToBottom ? '✓ You have read the entire policy' : 'Please scroll to the bottom to continue'}
              </Text>
              {!hasScrolledToBottom && (
                <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
                  <Text style={styles.scrollButtonText}>Scroll to Bottom</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={isAccepting}
          >
            <Text style={styles.declineButtonText}>Decline & Exit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              !hasScrolledToBottom && styles.disabledButton
            ]}
            onPress={handleAccept}
            disabled={!hasScrolledToBottom || isAccepting}
          >
            <Text style={styles.acceptButtonText}>
              {isAccepting ? 'Accepting...' : 'Accept & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  contactInfo: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: 'monospace',
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  scrollIndicator: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: 'center',
  },
  scrollText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  scrollButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  scrollButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.muted,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: COLORS.muted,
    opacity: 0.5,
  },
  declineButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  acceptButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PrivacyPolicyModal;

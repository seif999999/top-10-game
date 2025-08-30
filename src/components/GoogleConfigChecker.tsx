import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getGoogleConfigStatus, isGoogleSignInConfigured } from '../config/google';
import { COLORS, SPACING } from '../utils/constants';

interface GoogleConfigCheckerProps {
  onConfigure?: () => void;
}

const GoogleConfigChecker: React.FC<GoogleConfigCheckerProps> = ({ onConfigure }) => {
  const configStatus = getGoogleConfigStatus();
  const isConfigured = isGoogleSignInConfigured();

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure();
    } else {
      Alert.alert(
        'Google Sign-In Setup',
        'To set up Google Sign-In:\n\n1. Go to Google Cloud Console\n2. Create OAuth 2.0 credentials\n3. Update your .env file\n4. Restart the app\n\nSee GOOGLE_SIGNIN_SETUP.md for detailed instructions.',
        [
          { text: 'OK' },
          { text: 'Open Setup Guide', onPress: () => console.log('Open setup guide') }
        ]
      );
    }
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? '#4CAF50' : '#F44336';
  };

  const getStatusText = (isValid: boolean) => {
    return isValid ? '✅ Configured' : '❌ Not Configured';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Sign-In Configuration</Text>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.platform}>Web Platform</Text>
          <Text style={[styles.status, { color: getStatusColor(configStatus.web) }]}>
            {getStatusText(configStatus.web)}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.platform}>iOS Platform</Text>
          <Text style={[styles.status, { color: getStatusColor(configStatus.ios) }]}>
            {getStatusText(configStatus.ios)}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.platform}>Android Platform</Text>
          <Text style={[styles.status, { color: getStatusColor(configStatus.android) }]}>
            {getStatusText(configStatus.android)}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.platform}>Client Secret</Text>
          <Text style={[styles.status, { color: getStatusColor(configStatus.clientSecret) }]}>
            {getStatusText(configStatus.clientSecret)}
          </Text>
        </View>
      </View>

      <View style={styles.currentPlatform}>
        <Text style={styles.currentPlatformText}>
          Current Platform: <Text style={styles.platformValue}>{configStatus.currentPlatform}</Text>
        </Text>
        <Text style={styles.currentPlatformText}>
          Client ID: <Text style={styles.platformValue}>{configStatus.currentClientId}</Text>
        </Text>
      </View>

      {!isConfigured && (
        <TouchableOpacity style={styles.configureButton} onPress={handleConfigure}>
          <Text style={styles.configureButtonText}>Configure Google Sign-In</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        Note: Google Sign-In requires proper OAuth 2.0 credentials from Google Cloud Console.
        See GOOGLE_SIGNIN_SETUP.md for detailed setup instructions.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  platform: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  currentPlatform: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  currentPlatformText: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  platformValue: {
    color: COLORS.text,
    fontWeight: '600',
  },
  configureButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  configureButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default GoogleConfigChecker;

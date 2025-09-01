import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING } from '../utils/constants';

interface SignOutButtonProps {
  style?: any;
  iconStyle?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'text' | 'button';
}

const SignOutButton: React.FC<SignOutButtonProps> = ({
  style,
  iconStyle,
  size = 'medium',
  variant = 'icon'
}) => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) return;
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            setIsLoading(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, borderRadius: 16 };
      case 'large':
        return { width: 48, height: 48, borderRadius: 24 };
      default:
        return { width: 40, height: 40, borderRadius: 20 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  if (variant === 'text') {
    return (
      <TouchableOpacity style={[styles.textButton, style]} onPress={handleSignOut} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <Text style={[styles.textButtonText, iconStyle]}>Sign Out</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'button') {
    return (
      <TouchableOpacity style={[styles.fullButton, style]} onPress={handleSignOut} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={[styles.fullButtonText, iconStyle]}>Sign Out</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Default icon variant
  return (
    <TouchableOpacity 
      style={[styles.iconButton, getSizeStyles(), style]} 
      onPress={handleSignOut}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.text} />
      ) : (
        <Text style={[styles.iconText, { fontSize: getIconSize() }, iconStyle]}>🚪</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  textButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  textButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  fullButton: {
    backgroundColor: '#dc2626',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fullButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignOutButton;

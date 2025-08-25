import React from 'react';
import { ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/constants';

const LoadingSpinner: React.FC = () => {
  return <ActivityIndicator color={COLORS.primary} />;
};

export default LoadingSpinner;



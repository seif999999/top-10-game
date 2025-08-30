import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { GameProvider } from './src/contexts/GameContext';
import { MultiplayerProvider } from './src/contexts/MultiplayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text } from 'react-native';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }
  
  componentDidCatch(error: Error) {
    console.error(error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text>Something went wrong.</Text>
          {this.state.message ? <Text>{this.state.message}</Text> : null}
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GameProvider>
          <MultiplayerProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </MultiplayerProvider>
        </GameProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}



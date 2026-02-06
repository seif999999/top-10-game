import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/frontend/contexts/AuthContext';
import { GameProvider } from './src/frontend/contexts/GameContext';
import { MultiplayerProvider } from './src/frontend/contexts/MultiplayerContext';
import { AudioProvider } from './src/frontend/contexts/AudioContext';
import { GlobalUIProvider } from './src/frontend/contexts/GlobalUIContext';
import { LanguageProvider } from './src/frontend/contexts/LanguageContext';
import AppNavigator from './src/frontend/navigation/AppNavigator';
import { ThemedAlertModal } from './src/frontend/components/CrossPlatformAlert';
import { View, Text, StyleSheet } from 'react-native';


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
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <AudioProvider>
              <GameProvider>
                <MultiplayerProvider>
                  <ThemedAlertModal />
                  <View style={styles.navigationWrapper}>
                  <NavigationContainer
                    theme={{
                      ...DarkTheme,
                      colors: {
                        ...DarkTheme.colors,
                        background: '#1a1a2e',
                        card: '#1a1a2e',
                        text: '#FFFFFF',
                        border: '#666666',
                        notification: '#8B5CF6',
                        primary: '#8B5CF6',
                      },
                    }}
                  >
                    <GlobalUIProvider>
                      <StatusBar style="light" />
                      <AppNavigator />
                    </GlobalUIProvider>
                  </NavigationContainer>
                </View>
              </MultiplayerProvider>
            </GameProvider>
          </AudioProvider>
        </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaProvider: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  navigationWrapper: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});


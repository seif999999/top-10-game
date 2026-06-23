import React, { useRef, useEffect } from 'react';
import { LogBox } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { NavigationContainer, DarkTheme, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Suppress in-app error/warning overlays on device; logs still appear in Metro terminal only
LogBox.ignoreAllLogs(true);

// CRITICAL: Must run at app startup so OAuth redirect from auth.expo.io is handled
WebBrowser.maybeCompleteAuthSession();
import { AuthProvider } from './src/frontend/contexts/AuthContext';
import { AdProvider } from './src/frontend/contexts/AdContext';
import { GameProvider } from './src/frontend/contexts/GameContext';
import { MultiplayerProvider } from './src/frontend/contexts/MultiplayerContext';
import { AudioProvider } from './src/frontend/contexts/AudioContext';
import { GlobalUIProvider } from './src/frontend/contexts/GlobalUIContext';
import { LanguageProvider } from './src/frontend/contexts/LanguageContext';
import AppNavigator from './src/frontend/navigation/AppNavigator';
import { ThemedAlertModal } from './src/frontend/components/CrossPlatformAlert';
import { setupDeepLinking } from './src/frontend/utils/deepLinking';
import type { RootStackParamList } from './src/shared/types/navigation';
import { View, Text, StyleSheet } from 'react-native';
import { IconPreloader } from './src/frontend/components/IconPreloader';

// Initialize i18next — must be imported before any component that uses translations
import i18n from './src/config/i18n';
import * as Sentry from '@sentry/react-native';

const navigationIntegration = Sentry.reactNavigationIntegration();

Sentry.init({
  dsn: 'https://2218add77c6c7748aad41b6de8765405@o4511586706128896.ingest.de.sentry.io/4511586724479056',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  enableLogs: true,

  integrations: [navigationIntegration],

  // Session replay + feedback need a new native dev build (EAS). Enable after rebuilding.
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1,
  // integrations: [navigationIntegration, Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

// Error Boundary Component
// Uses the i18n instance directly (not hooks) because it renders above LanguageProvider.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
    if (__DEV__) {
      console.error(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#1a1a2e' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
            {i18n.t('somethingWentWrong', { ns: 'common' })}
          </Text>
          {this.state.message ? (
            <Text style={{ color: '#9CA3AF', marginTop: 8 }}>{this.state.message}</Text>
          ) : null}
        </View>
      );
    }
    return this.props.children;
  }
}

export default Sentry.wrap(function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const deepLinkCleanupRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    return () => {
      deepLinkCleanupRef.current?.remove();
      deepLinkCleanupRef.current = null;
    };
  }, []);

  return (
    <SafeAreaProvider style={styles.safeAreaProvider}>
      <ErrorBoundary>
        <AuthProvider>
          <LanguageProvider>
            <AudioProvider>
              <AdProvider>
                <GameProvider>
                  <MultiplayerProvider>
                    <ThemedAlertModal />
                    <View style={styles.navigationWrapper}>
                    <NavigationContainer
                    ref={navigationRef}
                    onReady={() => {
                      navigationIntegration.registerNavigationContainer(navigationRef);
                      if (navigationRef.current) {
                        deepLinkCleanupRef.current = setupDeepLinking(navigationRef.current);
                      }
                    }}
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
                      <IconPreloader />
                      <StatusBar style="light" />
                      <AppNavigator />
                    </GlobalUIProvider>
                    </NavigationContainer>
                    </View>
                  </MultiplayerProvider>
                </GameProvider>
              </AdProvider>
            </AudioProvider>
          </LanguageProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
});

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

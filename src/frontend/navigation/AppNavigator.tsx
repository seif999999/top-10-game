import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../shared/types/navigation';
import useAppTranslation from '../../hooks/useTranslation';

// Eager-load first-paint screens
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import RegisterScreen from '../screens/AuthScreens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/AuthScreens/ForgotPasswordScreen';
import PasswordResetSuccessScreen from '../screens/AuthScreens/PasswordResetSuccessScreen';
import ResetPasswordScreen from '../screens/AuthScreens/ResetPasswordScreen';

// Lazy-load secondary screens for faster initial bundle
const QuestionSelectionScreen = lazy(() => import('../screens/QuestionSelectionScreen'));
const GameSetupScreen = lazy(() => import('../screens/GameSetupScreen'));
const GameScreen = lazy(() => import('../screens/GameScreen'));
const MultiplayerMenuScreen = lazy(() => import('../screens/MultiplayerMenuScreen'));
const CreateRoomScreen = lazy(() => import('../screens/CreateRoomScreen'));
const MultiplayerCategoryScreen = lazy(() => import('../screens/MultiplayerCategoryScreen'));
const MultiplayerQuestionsScreen = lazy(() => import('../screens/MultiplayerQuestionsScreen'));
const JoinRoomScreen = lazy(() => import('../screens/JoinRoomScreen'));
const RoomLobbyScreen = lazy(() => import('../screens/RoomLobbyScreen'));
const AvatarSelectionScreen = lazy(() => import('../screens/AvatarSelectionScreen'));
const CustomQuestionSlotsScreen = lazy(() => import('../screens/CustomQuestionSlotsScreen'));
const CustomQuestionScreen = lazy(() => import('../screens/CustomQuestionScreen'));
const MissionsScreen = lazy(() => import('../screens/MissionsScreen'));
const CoinShopScreen = lazy(() => import('../screens/CoinShopScreen'));
const CoinHistoryScreen = lazy(() => import('../screens/CoinHistoryScreen'));

const ScreenFallback = () => (
  <View style={screenFallbackStyles.container}>
    <ActivityIndicator size="large" color="#8B5CF6" />
  </View>
);
const screenFallbackStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
});

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user } = useAuth();
  const { isRTL } = useAppTranslation();

  return (
    <Suspense fallback={<ScreenFallback />}>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // Animation flips for RTL; native gesture direction is handled
        // automatically by I18nManager.forceRTL() in our i18n config.
        animation: isRTL ? 'slide_from_left' : 'slide_from_right',
        contentStyle: {
          backgroundColor: '#1a1a2e',
        },
        animationDuration: 250,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Missions" component={MissionsScreen} />
          <Stack.Screen name="CoinsShop" component={CoinShopScreen} />
          <Stack.Screen name="CoinHistory" component={CoinHistoryScreen} />
          <Stack.Screen name="Categories" component={GameSetupScreen} />
          <Stack.Screen name="QuestionSelection" component={QuestionSelectionScreen} />
          <Stack.Screen name="GameScreen" component={GameScreen} />
          <Stack.Screen name="MultiplayerMenu" component={MultiplayerMenuScreen} />
          <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
          <Stack.Screen name="MultiplayerCategory" component={MultiplayerCategoryScreen} />
          <Stack.Screen name="MultiplayerQuestions" component={MultiplayerQuestionsScreen} />
          <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
          <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
          <Stack.Screen name="AvatarSelection" component={AvatarSelectionScreen} />
          <Stack.Screen name="CustomQuestionSlots" component={CustomQuestionSlotsScreen} />
          <Stack.Screen name="CreateCustomQuestion" component={CustomQuestionScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="PasswordResetSuccess" component={PasswordResetSuccessScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
    </Suspense>
  );
};

export default AppNavigator;

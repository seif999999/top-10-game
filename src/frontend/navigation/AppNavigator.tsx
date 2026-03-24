import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../shared/types/navigation';
import useAppTranslation from '../../hooks/useTranslation';
import LoadingPage from '../components/LoadingPage';

// Eager-load screens to avoid Metro "unknown module" / lazy resolve-to-undefined errors
// (Lazy loading can fail with circular deps or cache corruption on iOS/Android)
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import RegisterScreen from '../screens/AuthScreens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/AuthScreens/ForgotPasswordScreen';
import PasswordResetSuccessScreen from '../screens/AuthScreens/PasswordResetSuccessScreen';
import ResetPasswordScreen from '../screens/AuthScreens/ResetPasswordScreen';
import QuestionSelectionScreen from '../screens/QuestionSelectionScreen';
import GameSetupScreen from '../screens/GameSetupScreen';
import GameScreen from '../screens/GameScreen';
import MultiplayerMenuScreen from '../screens/MultiplayerMenuScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import MultiplayerCategoryScreen from '../screens/MultiplayerCategoryScreen';
import MultiplayerQuestionsScreen from '../screens/MultiplayerQuestionsScreen';
import JoinRoomScreen from '../screens/JoinRoomScreen';
import RoomLobbyScreen from '../screens/RoomLobbyScreen';
import AvatarSelectionScreen from '../screens/AvatarSelectionScreen';
import CustomQuestionSlotsScreen from '../screens/CustomQuestionSlotsScreen';
import CustomQuestionScreen from '../screens/CustomQuestionScreen';
import MissionsScreen from '../screens/MissionsScreen';
import CoinShopScreen from '../screens/CoinShopScreen';
import CoinHistoryScreen from '../screens/CoinHistoryScreen';
import ShopScreen from '../screens/ShopScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { isRTL } = useAppTranslation();

  // Block routing until auth init finishes (keeps MultiplayerProvider mounted under AuthProvider)
  if (loading) {
    return <LoadingPage message="Signing you in…" />;
  }

  return (
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
          <Stack.Screen name="Shop" component={ShopScreen} />
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
  );
};

export default AppNavigator;

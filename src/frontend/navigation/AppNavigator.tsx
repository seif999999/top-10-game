import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../shared/types/navigation';
import { logger } from '../../backend/utils/logger';

// Import screens
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import RegisterScreen from '../screens/AuthScreens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuestionSelectionScreen from '../screens/QuestionSelectionScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import CategoriesCarouselScreen from '../screens/CategoriesCarouselScreen';
import GameScreen from '../screens/GameScreen';
import ForgotPasswordScreen from '../screens/AuthScreens/ForgotPasswordScreen';
import PasswordResetSuccessScreen from '../screens/AuthScreens/PasswordResetSuccessScreen';
import ResetPasswordScreen from '../screens/AuthScreens/ResetPasswordScreen';
import MultiplayerMenuScreen from '../screens/MultiplayerMenuScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import MultiplayerCategoryScreen from '../screens/MultiplayerCategoryScreen';
import MultiplayerQuestionsScreen from '../screens/MultiplayerQuestionsScreen';
import JoinRoomScreen from '../screens/JoinRoomScreen';
import RoomLobbyScreen from '../screens/RoomLobbyScreen';
import AvatarSelectionScreen from '../screens/AvatarSelectionScreen';
import CustomQuestionScreen from '../screens/CustomQuestionScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  logger.log('AppNavigator: Current user:', user?.email || 'null');
  logger.log('AppNavigator: Loading:', loading);

  return (
    <>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: '#1a1a2e',
          },
          cardStyle: {
            backgroundColor: '#1a1a2e',
          },
          animationDuration: 250,
          fullScreenGestureEnabled: true,
          gestureDirection: 'horizontal',
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#1a1a2e',
          detachPreviousScreen: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Categories" component={CategoriesCarouselScreen} />
            <Stack.Screen name="QuestionSelection" component={QuestionSelectionScreen} />
            <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
            <Stack.Screen name="GameScreen" component={GameScreen} />
            <Stack.Screen name="MultiplayerMenu" component={MultiplayerMenuScreen} />
            <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
            <Stack.Screen name="MultiplayerCategory" component={MultiplayerCategoryScreen} />
            <Stack.Screen name="MultiplayerQuestions" component={MultiplayerQuestionsScreen} />
            <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
            <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} />
            <Stack.Screen name="AvatarSelection" component={AvatarSelectionScreen} />
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
    </>
  );
};

export default AppNavigator;



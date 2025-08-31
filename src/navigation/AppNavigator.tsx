import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// Import screens
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import RegisterScreen from '../screens/AuthScreens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import QuestionSelectionScreen from '../screens/QuestionSelectionScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import MainMenuScreen from '../screens/MainMenuScreen';
import CategoriesCarouselScreen from '../screens/CategoriesCarouselScreen';
import GameScreen from '../screens/GameScreen';
import ForgotPasswordScreen from '../screens/AuthScreens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('AppNavigator: Current user:', user?.email || 'null');
  console.log('AppNavigator: Loading:', loading);

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MainMenu" component={MainMenuScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Categories" component={CategoriesCarouselScreen} />
          <Stack.Screen name="QuestionSelection" component={QuestionSelectionScreen} />
          <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
          <Stack.Screen name="GameScreen" component={GameScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;



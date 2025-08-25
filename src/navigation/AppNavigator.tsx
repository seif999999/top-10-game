import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// Import screens
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import RegisterScreen from '../screens/AuthScreens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import GameScreen from '../screens/GameScreen';

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
        // Authenticated Stack
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Categories" component={CategoriesScreen} />
          <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
          <Stack.Screen name="GameScreen" component={GameScreen} />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;



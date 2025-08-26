import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth Stack Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Stack Navigation Types  
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  Categories: undefined;
  GameLobby: { categoryId: string; categoryName: string };
  GameScreen: { roomId: string; categoryId: string };
};

// Combined Root Stack Types
export type RootStackParamList = AuthStackParamList & MainStackParamList;

// Screen Props Types
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type CategoriesScreenProps = NativeStackScreenProps<RootStackParamList, 'Categories'>;
export type GameLobbyScreenProps = NativeStackScreenProps<RootStackParamList, 'GameLobby'>;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'GameScreen'>;

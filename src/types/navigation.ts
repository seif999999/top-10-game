import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Auth Stack Navigation Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PasswordResetSuccess: undefined;
  ResetPassword: { oobCode: string };
};

// Main Stack Navigation Types  
export type MainStackParamList = {
  Home: undefined;
  MainMenu: undefined;
  Profile: undefined;
  Categories: { gameMode: 'single' | 'multiplayer' };
  QuestionSelection: { categoryName: string; gameMode?: 'single' | 'multiplayer' };
  GameLobby: { categoryId: string; categoryName: string; selectedQuestion?: any };
  GameScreen: { roomId: string; categoryId: string; categoryName?: string; selectedQuestion?: any; isMultiplayer?: boolean; teamConfig?: any; gameMode?: 'single' | 'multiplayer'; roomCode?: string; customQuestion?: any; isCustomQuestion?: boolean };
  MultiplayerMenu: undefined;
  CreateRoom: undefined;
  MultiplayerCategory: undefined;
  MultiplayerQuestions: { categoryName: string };
  JoinRoom: undefined;
  RoomLobby: { roomCode: string; turnDuration?: number };
  AvatarSelection: undefined;
  CreateCustomQuestion: undefined;
};

// Combined Root Stack Types
export type RootStackParamList = AuthStackParamList & MainStackParamList;

// Screen Props Types
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;
export type PasswordResetSuccessScreenProps = NativeStackScreenProps<RootStackParamList, 'PasswordResetSuccess'>;
export type ResetPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type MainMenuScreenProps = NativeStackScreenProps<RootStackParamList, 'MainMenu'>;
export type CategoriesScreenProps = NativeStackScreenProps<RootStackParamList, 'Categories'>;
export type QuestionSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'QuestionSelection'>;
export type GameLobbyScreenProps = NativeStackScreenProps<RootStackParamList, 'GameLobby'>;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'GameScreen'>;
export type MultiplayerMenuScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerMenu'>;
export type CreateRoomScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;
export type MultiplayerCategoryScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerCategory'>;
export type MultiplayerQuestionsScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerQuestions'>;
export type JoinRoomScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;
export type RoomLobbyScreenProps = NativeStackScreenProps<RootStackParamList, 'RoomLobby'>;
export type CustomQuestionScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateCustomQuestion'>;

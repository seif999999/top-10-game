import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GameQuestion, CustomQuestion } from './index';
import type { TeamSetupConfig } from './teams';

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
  Profile: undefined;
  Missions: undefined;
  Categories: { gameMode: 'single' | 'multiplayer' };
  QuestionSelection: { categoryName: string; gameMode?: 'single' | 'multiplayer'; teamConfig?: TeamSetupConfig };
  GameScreen: { roomId: string; categoryId: string; categoryName?: string; selectedQuestion?: GameQuestion; isMultiplayer?: boolean; teamConfig?: TeamSetupConfig; gameMode?: 'single' | 'multiplayer'; roomCode?: string; customQuestion?: CustomQuestion; isCustomQuestion?: boolean };
  MultiplayerMenu: undefined;
  CreateRoom: undefined;
  MultiplayerCategory: undefined;
  MultiplayerQuestions: { categoryName: string };
  JoinRoom: undefined;
  RoomLobby: { roomCode: string; turnDuration?: number };
  AvatarSelection: undefined;
  CustomQuestionSlots: undefined;
  CreateCustomQuestion: { slotIndex: number };
  CoinsShop: undefined;
  CoinHistory: undefined;
  Shop: undefined;
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
export type MissionsScreenProps = NativeStackScreenProps<RootStackParamList, 'Missions'>;
export type CategoriesScreenProps = NativeStackScreenProps<RootStackParamList, 'Categories'>;
export type QuestionSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'QuestionSelection'>;
export type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'GameScreen'>;
export type MultiplayerMenuScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerMenu'>;
export type CreateRoomScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateRoom'>;
export type MultiplayerCategoryScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerCategory'>;
export type MultiplayerQuestionsScreenProps = NativeStackScreenProps<RootStackParamList, 'MultiplayerQuestions'>;
export type JoinRoomScreenProps = NativeStackScreenProps<RootStackParamList, 'JoinRoom'>;
export type RoomLobbyScreenProps = NativeStackScreenProps<RootStackParamList, 'RoomLobby'>;
export type CustomQuestionSlotsScreenProps = NativeStackScreenProps<RootStackParamList, 'CustomQuestionSlots'>;
export type CustomQuestionScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateCustomQuestion'>;

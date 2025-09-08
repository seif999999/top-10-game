import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateRoomScreen from '../CreateRoomScreen';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { AuthService } from '../../services/authService';

// Mock the MultiplayerContext
jest.mock('../../contexts/MultiplayerContext');
const mockUseMultiplayer = useMultiplayer as jest.MockedFunction<typeof useMultiplayer>;

// Mock AuthService
jest.mock('../../services/authService');
const mockAuthService = {
  ensureAuthenticated: jest.fn().mockResolvedValue(undefined),
  getInstance: jest.fn(() => mockAuthService)
};
(AuthService.getInstance as jest.Mock).mockReturnValue(mockAuthService);

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({
        width: 400,
        height: 800,
      })),
    },
  };
});

describe('CreateRoomScreen Integration', () => {
  const mockCreateRoom = jest.fn();
  const mockSetCategory = jest.fn();
  const mockSetQuestions = jest.fn();
  const mockLeaveRoom = jest.fn();
  const mockResetAll = jest.fn();
  const mockCleanup = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    mockUseMultiplayer.mockReturnValue({
      selectedCategory: null,
      selectedQuestions: [],
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: false,
      error: null,
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    mockCreateRoom.mockClear();
    mockSetCategory.mockClear();
    mockSetQuestions.mockClear();
    mockLeaveRoom.mockClear();
    mockResetAll.mockClear();
    mockCleanup.mockClear();
    mockClearError.mockClear();
  });

  it('renders CategoryCarousel component', () => {
    const { getByText } = render(<CreateRoomScreen />);
    
    expect(getByText('Choose a Category')).toBeTruthy();
    expect(getByText('Swipe to browse categories • Tap to select')).toBeTruthy();
  });

  it('displays categories with correct data', () => {
    const { getByText } = render(<CreateRoomScreen />);
    
    // Check if categories are rendered (these should come from sampleQuestions)
    expect(getByText('Sports')).toBeTruthy();
    expect(getByText('Movies')).toBeTruthy();
    expect(getByText('Music')).toBeTruthy();
  });

  it('calls setCategory when category is selected', async () => {
    const { getByText } = render(<CreateRoomScreen />);
    
    // Find and press a category
    const sportsCategory = getByText('Sports');
    fireEvent.press(sportsCategory);
    
    await waitFor(() => {
      expect(mockSetCategory).toHaveBeenCalledWith('Sports');
    });
  });

  it('shows question selection after category is selected', async () => {
    mockUseMultiplayer.mockReturnValue({
      selectedCategory: 'Sports',
      selectedQuestions: [],
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: false,
      error: null,
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    const { getByText } = render(<CreateRoomScreen />);
    
    expect(getByText('Select a Question')).toBeTruthy();
  });

  it('calls createRoom when create button is pressed with valid data', async () => {
    const mockQuestions = [
      { id: '1', title: 'Test Question', answers: [{ text: 'Answer 1' }], category: 'Sports', difficulty: 'easy' }
    ];

    mockUseMultiplayer.mockReturnValue({
      selectedCategory: 'Sports',
      selectedQuestions: mockQuestions,
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: false,
      error: null,
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    mockCreateRoom.mockResolvedValue('ROOM123');

    const { getByText } = render(<CreateRoomScreen />);
    
    const createButton = getByText('Create Room');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalledWith('Sports', expect.any(Array));
    });
  });

  it('disables create button when no category is selected', () => {
    const { getByText } = render(<CreateRoomScreen />);
    
    const createButton = getByText('Create Room');
    expect(createButton.parent?.props.disabled).toBe(true);
  });

  it('disables create button when no questions are selected', () => {
    mockUseMultiplayer.mockReturnValue({
      selectedCategory: 'Sports',
      selectedQuestions: [],
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: false,
      error: null,
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    const { getByText } = render(<CreateRoomScreen />);
    
    const createButton = getByText('Create Room');
    expect(createButton.parent?.props.disabled).toBe(true);
  });

  it('shows loading state when creating room', () => {
    mockUseMultiplayer.mockReturnValue({
      selectedCategory: 'Sports',
      selectedQuestions: [{ id: '1', title: 'Test', answers: [], category: 'Sports', difficulty: 'easy' }],
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: true,
      error: null,
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    const { getByTestId } = render(<CreateRoomScreen />);
    
    // Check if loading indicator is shown
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('handles leave room functionality', async () => {
    const { getByText } = render(<CreateRoomScreen />);
    
    const leaveButton = getByText('Leave Room');
    fireEvent.press(leaveButton);
    
    await waitFor(() => {
      expect(mockLeaveRoom).toHaveBeenCalled();
      expect(mockResetAll).toHaveBeenCalled();
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  it('displays error messages when present', () => {
    mockUseMultiplayer.mockReturnValue({
      selectedCategory: null,
      selectedQuestions: [],
      setCategory: mockSetCategory,
      setQuestions: mockSetQuestions,
      createRoom: mockCreateRoom,
      loading: false,
      error: 'Test error message',
      clearError: mockClearError,
      leaveRoom: mockLeaveRoom,
      resetAll: mockResetAll,
      cleanup: mockCleanup,
    } as any);

    const { getByText } = render(<CreateRoomScreen />);
    
    expect(getByText('Test error message')).toBeTruthy();
  });
});

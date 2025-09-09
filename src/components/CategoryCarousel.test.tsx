import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryCarousel, { Category } from './CategoryCarousel';

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

const mockCategories: Category[] = [
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
    description: 'Athletics, games, and competitions',
    color: '#FF6B6B',
    questions: 10
  },
  {
    id: 'movies',
    name: 'Movies',
    icon: '🎬',
    description: 'Films, television, and entertainment',
    color: '#4ECDC4',
    questions: 15
  },
  {
    id: 'music',
    name: 'Music',
    icon: '🎵',
    description: 'Songs, artists, and musical genres',
    color: '#45B7D1',
    questions: 8
  }
];

describe('CategoryCarousel', () => {
  const mockOnCategorySelect = jest.fn();

  beforeEach(() => {
    mockOnCategorySelect.mockClear();
  });

  it('renders correctly with categories', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('Sports')).toBeTruthy();
    expect(getByText('Movies')).toBeTruthy();
    expect(getByText('Music')).toBeTruthy();
  });

  it('displays category descriptions', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('Athletics, games, and competitions')).toBeTruthy();
    expect(getByText('Films, television, and entertainment')).toBeTruthy();
    expect(getByText('Songs, artists, and musical genres')).toBeTruthy();
  });

  it('displays question counts', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('10 Questions')).toBeTruthy();
    expect(getByText('15 Questions')).toBeTruthy();
    expect(getByText('8 Questions')).toBeTruthy();
  });

  it('calls onCategorySelect when category is pressed', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    fireEvent.press(getByText('Sports'));
    expect(mockOnCategorySelect).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('shows selected category with visual feedback', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        selectedCategory="sports"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const sportsCard = getByText('Sports').parent?.parent;
    expect(sportsCard).toBeTruthy();
  });

  it('displays custom instructions text', () => {
    const customInstructions = 'Custom swipe instructions';
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        instructionsText={customInstructions}
      />
    );

    expect(getByText(customInstructions)).toBeTruthy();
  });

  it('hides instructions when showInstructions is false', () => {
    const { queryByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        showInstructions={false}
      />
    );

    expect(queryByText('Swipe to browse categories • Tap to select')).toBeNull();
  });

  it('displays custom button text', () => {
    const customButtonText = 'Custom Select';
    const { getAllByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        buttonText={customButtonText}
      />
    );

    expect(getAllByText(customButtonText)).toHaveLength(3);
  });

  it('hides question count when showQuestionCount is false', () => {
    const { queryByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        showQuestionCount={false}
      />
    );

    expect(queryByText('10 Questions')).toBeNull();
    expect(queryByText('15 Questions')).toBeNull();
    expect(queryByText('8 Questions')).toBeNull();
  });

  it('applies custom card dimensions', () => {
    const customWidth = 300;
    const customHeight = 400;
    
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        cardWidth={customWidth}
        cardHeight={customHeight}
      />
    );

    const sportsCard = getByText('Sports').parent?.parent;
    expect(sportsCard).toBeTruthy();
  });

  it('handles empty categories array', () => {
    const { queryByText } = render(
      <CategoryCarousel
        categories={[]}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(queryByText('Sports')).toBeNull();
    expect(queryByText('Movies')).toBeNull();
    expect(queryByText('Music')).toBeNull();
  });

  it('renders with default props', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('Swipe to browse categories • Tap to select')).toBeTruthy();
    expect(getByText('🎯 Select')).toBeTruthy();
    expect(getByText('10 Questions')).toBeTruthy();
  });

  it('renders FlatList with correct props', () => {
    const { UNSAFE_getByType } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    const flatList = UNSAFE_getByType(require('react-native').FlatList);
    expect(flatList.props.horizontal).toBe(true);
    expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    expect(flatList.props.decelerationRate).toBe('fast');
  });

  it('applies correct snap interval based on card width', () => {
    const customWidth = 300;
    const { UNSAFE_getByType } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        cardWidth={customWidth}
      />
    );

    const flatList = UNSAFE_getByType(require('react-native').FlatList);
    expect(flatList.props.snapToInterval).toBe(customWidth + 20); // CARD_SPACING = 20
  });

  it('handles multiple category selections', () => {
    const { getByText } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
      />
    );

    fireEvent.press(getByText('Sports'));
    fireEvent.press(getByText('Movies'));
    fireEvent.press(getByText('Music'));

    expect(mockOnCategorySelect).toHaveBeenCalledTimes(3);
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(1, mockCategories[0]);
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(2, mockCategories[1]);
    expect(mockOnCategorySelect).toHaveBeenNthCalledWith(3, mockCategories[2]);
  });

  it('maintains selection state correctly', () => {
    const { getByText, rerender } = render(
      <CategoryCarousel
        categories={mockCategories}
        selectedCategory="sports"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('Sports')).toBeTruthy();

    rerender(
      <CategoryCarousel
        categories={mockCategories}
        selectedCategory="movies"
        onCategorySelect={mockOnCategorySelect}
      />
    );

    expect(getByText('Movies')).toBeTruthy();
  });

  it('applies custom styles correctly', () => {
    const customStyle = { backgroundColor: 'red' };
    const customContentStyle = { paddingTop: 20 };
    
    const { UNSAFE_getByType } = render(
      <CategoryCarousel
        categories={mockCategories}
        onCategorySelect={mockOnCategorySelect}
        style={customStyle}
        contentContainerStyle={customContentStyle}
      />
    );

    const container = UNSAFE_getByType(require('react-native').View);
    const flatList = UNSAFE_getByType(require('react-native').FlatList);
    
    expect(container.props.style).toContain(customStyle);
    expect(flatList.props.contentContainerStyle).toContain(customContentStyle);
  });
});

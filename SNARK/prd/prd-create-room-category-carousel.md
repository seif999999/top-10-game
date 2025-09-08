# Product Requirements Document: Create Room Category Carousel

## Introduction/Overview

This feature enhances the Create Room screen by replacing the current grid-based category selection with a swipeable carousel interface that matches the single player mode's category selection experience. The goal is to provide a consistent and more intuitive way for users to browse and select categories when creating multiplayer rooms.

## Goals

1. **Consistency**: Provide the same category selection experience across single player and multiplayer modes
2. **Improved UX**: Replace the current 2x2 grid layout with a more engaging swipeable carousel
3. **Visual Appeal**: Use the same attractive card design with colors, icons, and descriptions from the single player mode
4. **Intuitive Navigation**: Allow users to swipe left/right to browse categories easily

## User Stories

- **As a room host**, I want to swipe through categories in a carousel format so that I can easily browse and select a category for my multiplayer game
- **As a room host**, I want the category selection to look and feel the same as single player mode so that I have a consistent experience across the app
- **As a room host**, I want to see category descriptions and question counts so that I can make an informed choice about which category to use

## Functional Requirements

1. **Replace Grid with Carousel**: The system must replace the current 2x2 grid category layout with a horizontal swipeable carousel
2. **Reuse Single Player Design**: The system must use the exact same card design, colors, icons, and styling from CategoriesCarouselScreen
3. **Horizontal Scrolling**: The system must allow users to swipe left and right to browse through categories
4. **Snap to Cards**: The system must snap to individual category cards when scrolling stops
5. **Visual Selection**: The system must highlight the currently selected category with visual feedback
6. **Category Data**: The system must use the same category data structure and styling as the single player mode
7. **Maintain Functionality**: The system must preserve all existing category selection logic and room creation flow
8. **Responsive Design**: The system must work properly on different screen sizes

## Non-Goals (Out of Scope)

- Changes to the question selection interface that follows category selection
- Modifications to the room creation logic or API calls
- Changes to the overall Create Room screen layout beyond the category selection section
- New category data or different category information
- Changes to the single player category selection screen

## Design Considerations

- **Reuse Existing Component**: Leverage the existing CategoriesCarouselScreen component design and styling
- **Card Dimensions**: Use the same card width (80% of screen width) and spacing as single player mode
- **Color Scheme**: Maintain the same category-specific colors and visual hierarchy
- **Typography**: Use consistent font sizes, weights, and colors from the single player implementation
- **Animations**: Include the same smooth scrolling and snap-to-card animations
- **Accessibility**: Ensure proper accessibility labels and touch targets

## Technical Considerations

- **Component Reuse**: Extract the carousel logic from CategoriesCarouselScreen into a reusable component
- **Data Source**: Use the same category data structure and mapping as the single player mode
- **State Management**: Maintain the existing selectedCategory state and selection logic
- **Performance**: Ensure smooth scrolling performance with proper FlatList optimization
- **Integration**: Seamlessly integrate with the existing CreateRoomScreen without breaking current functionality

## Success Metrics

- **User Experience**: Users can successfully swipe through categories and select one for room creation
- **Visual Consistency**: The category selection looks identical to the single player mode
- **Functionality**: All existing room creation features continue to work without issues
- **Performance**: Smooth scrolling and responsive touch interactions

## Open Questions

- Should we create a shared CategoryCarousel component that both screens can use?
- Are there any specific accessibility requirements beyond the current implementation?
- Should we add any loading states or error handling specific to the carousel?

---

**Target Audience**: Junior developers implementing this feature
**Priority**: Medium
**Estimated Effort**: 2-3 days
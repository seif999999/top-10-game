# FIGMA DESIGN PROMPT - TOP 10 GAME MOBILE APP
## Complete Design Specification for All Screens and Features

---

## 📱 PROJECT OVERVIEW

**App Name:** Top 10 Game  
**Platform:** Mobile Game App (iOS & Android)  
**Type:** Multiplayer Trivia Game  
**Core Concept:** Players guess the top 10 answers to questions, competing for points based on answer ranking (1-10 points per answer)

---

## 🎨 DESIGN SYSTEM

### Color Palette
- **Primary:** #4F46E5 (Indigo)
- **Secondary:** #8B5CF6 (Purple)
- **Background:** #0A0A0A (Near Black)
- **Surface/Card:** #1C1C1E (Dark Gray)
- **Text:** #FFFFFF (White)
- **Muted Text:** #8E8E93 (Light Gray)
- **Success:** #10B981 (Green)
- **Error:** #EF4444 (Red)
- **Warning:** #F59E0B (Orange)
- **Info:** #3B82F6 (Blue)
- **Border:** #374151 (Medium Gray)
- **Accent:** #FF6B6B (Coral)

### Typography
- **Font Family:** System (San Francisco for iOS, Roboto for Android)
- **Display Font:** Bold, 48-64px for logo
- **Headings:** Bold/Semibold, 20-28px
- **Body:** Regular/Medium, 14-18px
- **Small Text:** Regular, 12-14px

### Spacing System
- **XS:** 4px
- **SM:** 8px
- **MD:** 12px
- **LG:** 16px
- **XL:** 24px
- **XXL:** 32px

### Component Styles
- **Border Radius:** 12-20px for cards, 8px for buttons
- **Shadows:** Subtle elevation with purple glow for primary actions
- **Touch Targets:** Minimum 44x44px for accessibility

---

## 📄 SCREENS & FEATURES

### 1. LOGIN SCREEN
**Purpose:** User authentication entry point

**Features:**
- Email input field with validation
- Password input field with show/hide toggle
- "Sign In" button (primary action)
- "Forgot Password?" link
- "Sign up" link/button at bottom
- Google Sign-In button (optional)
- Error message display area (below form)
- Loading state (button shows spinner)
- Form validation errors (inline, below each field)

**Layout:**
- Centered logo/branding at top
- Form fields stacked vertically
- Primary button full-width
- Secondary actions at bottom
- Safe area padding for notches

**States:**
- Default (empty form)
- Validation errors (red text below fields)
- Loading (disabled inputs, spinner on button)
- Error (Firebase/auth error message)
- Success (navigates to Home)

---

### 2. REGISTER SCREEN
**Purpose:** New user account creation

**Features:**
- Display Name input field
- Email input field
- Password input field with show/hide toggle
- Confirm Password input field with show/hide toggle
- Password strength indicator (optional)
- Privacy Policy checkbox with link to modal
- "Sign Up" button (primary action)
- "Already have an account? Sign in" link
- Google Sign-In button (optional)
- Form validation errors (inline)
- Error message display area

**Layout:**
- Similar to Login but with additional fields
- Privacy policy checkbox prominent
- Scrollable if keyboard appears

**States:**
- Default
- Validation errors
- Password mismatch error
- Privacy policy not accepted
- Loading
- Error
- Success (navigates to Home)

---

### 3. FORGOT PASSWORD SCREEN
**Purpose:** Password reset initiation

**Features:**
- Email input field
- "Send Reset Link" button
- Back to login link
- Success message (after email sent)
- Error message display
- Instructions text

**Layout:**
- Centered form
- Clear instructions
- Success state shows confirmation

---

### 4. RESET PASSWORD SCREEN
**Purpose:** Set new password after clicking reset link

**Features:**
- New Password input field
- Confirm Password input field
- Password requirements list
- "Reset Password" button
- Error message display

**Layout:**
- Similar to password fields in Register
- Clear requirements visible

---

### 5. PASSWORD RESET SUCCESS SCREEN
**Purpose:** Confirmation after password reset email sent

**Features:**
- Success icon/illustration
- Confirmation message
- Instructions (check email, spam folder)
- "Back to Login" button

**Layout:**
- Centered content
- Clear success messaging

---

### 6. HOME SCREEN
**Purpose:** Main menu and game mode selection

**Features:**
- Header with:
  - Profile avatar button (top left, circular, 48px)
  - "How to Play" button (top right, question mark icon)
- Hero section:
  - Large "TOP 10" logo (stacked: "TOP" smaller, "10" large)
  - Welcome message: "Welcome back, [DisplayName] 👋"
  - Subtitle text
- Game mode cards (3 cards):
  1. **Single Player Card** (Purple #8B5CF6)
     - Icon: 🎯
     - Title: "Single Player"
     - Subtitle: "Play with friends offline and be the host"
  2. **Multiplayer Card** (Darker Purple #7C3AED)
     - Icon: 👥
     - Title: "Multiplayer"
     - Subtitle: "Create and join rooms using the code"
  3. **Create Your Own Card** (Darkest Purple #5B21B6)
     - Icon: ✏️
     - Title: "Create Your Own"
     - Subtitle: "Create your own questions with your own answers"

**Layout:**
- Full-screen with safe area
- Cards stacked vertically with spacing
- Each card: rounded corners, shadow, icon + text layout

**Interactions:**
- Cards are tappable with press feedback
- Profile button opens Profile screen
- How to Play shows alert modal

---

### 7. PROFILE SCREEN
**Purpose:** User profile management

**Features:**
- Header with back button and "Profile" title
- Profile section:
  - Large avatar display (120px, circular, with border)
  - Edit avatar overlay icon (bottom right corner)
  - Display name (editable, with edit icon)
  - Email address (read-only)
  - "Member since [date]" text
- Settings section:
  - "Sign Out" button (gray, destructive style)

**Layout:**
- Scrollable content
- Profile info centered at top
- Settings section below

**Modals:**
- **Edit Name Modal:**
  - Overlay background
  - Centered modal card
  - Text input for display name
  - Cancel and Save buttons
  - Validation errors

**States:**
- Default
- Editing name (modal open)
- Saving (loading state)
- Error state

---

### 8. AVATAR SELECTION SCREEN
**Purpose:** Choose user avatar

**Features:**
- Header with back button and "Select Avatar" title
- Grid of avatar options (2-3 columns)
- Each avatar:
  - Image/icon (128px)
  - Name label below
  - Selected state (border highlight, checkmark)
- "Save" button (bottom, fixed)
- Current selection highlighted

**Layout:**
- Scrollable grid
- 8 avatar options shown
- Save button fixed at bottom

**States:**
- Default (no selection)
- Avatar selected (highlighted)
- Saving (loading)

---

### 9. CATEGORIES CAROUSEL SCREEN (Single Player)
**Purpose:** Select category for single-player game

**Features:**
- Header with back button and "Select Category" title
- Horizontal scrolling carousel of category cards
- Each category card shows:
  - Icon/emoji (large, 48px)
  - Category name
  - Description
  - Question count
  - Color-coded background
- Selected category highlighted
- "Continue" button (enabled when category selected)

**Categories:**
- Sports ⚽ (Red #FF6B6B)
- Movies 🎬 (Cyan #4ECDC4)
- Music 🎵 (Blue #45B7D1)
- Science 🔬 (Purple #DDA0DD)
- History 📚 (Yellow #FFEAA7)
- Geography 🌍 (Green #96CEB4)
- Food & Drink 🍕 (Orange #FFB347)
- Technology 💻 (Light Blue #87CEEB)

**Layout:**
- Full-width carousel
- Cards snap to center
- Continue button at bottom

---

### 10. QUESTION SELECTION SCREEN (Single Player)
**Purpose:** Select specific question or play all

**Features:**
- Header with back button and category name
- List of questions for selected category
- Each question item:
  - Question text (truncated if long)
  - "Select" button
- "Play All Questions" option at top
- Loading state while fetching questions
- Empty state if no questions

**Layout:**
- Scrollable list
- Question cards with selection action

---

### 11. GAME LOBBY SCREEN (Single Player)
**Purpose:** Pre-game setup for single player

**Features:**
- Category name display
- Selected question display (if specific question chosen)
- Player list (showing host)
- "Start Game" button
- Back button

**Layout:**
- Simple centered layout
- Start button prominent

---

### 12. GAME SCREEN (Main Gameplay)
**Purpose:** Core gameplay interface

**Features:**
- **Header Section:**
  - Question number indicator (e.g., "Question 1 of 10")
  - Score display (current player's score)
  - Timer (if multiplayer, shows turn timer)
  - Back/Exit button (with confirmation)

- **Question Section:**
  - Large question text display
  - Progress indicator (answers found: "5/10")

- **Answer Grid (10 slots):**
  - Grid of 10 answer boxes (2 columns, 5 rows)
  - Each box shows:
    - Rank number (1-10) when revealed
    - Answer text when revealed
    - Points value when revealed
    - Player/team name if assigned (multiplayer)
    - Locked/unrevealed state (gray, shows "?")
  - Revealed answers highlighted
  - Correct answers show points earned

- **Input Section:**
  - Text input field for answer
  - "Submit Answer" button
  - Character counter (optional)
  - Validation feedback

- **Submitted Answers List:**
  - Shows player's submitted answers for current question
  - Each answer shows:
    - Answer text
    - Status (Correct/Incorrect)
    - Points earned (if correct)

- **Leaderboard (Multiplayer):**
  - Mini leaderboard showing:
    - Player rankings (1st, 2nd, 3rd with medals)
    - Player names
    - Scores
    - Current player highlighted

- **Turn Indicator (Multiplayer):**
  - Shows whose turn it is
  - Turn timer countdown
  - "Skip Turn" button (if allowed)

- **Action Buttons:**
  - "Next Question" (host only, when question complete)
  - "End Game" (host only)
  - "View Results" (when game ends)

- **Modals:**
  - **Results Modal:** Shows final scores, winner, game stats
  - **Ranking Overlay:** Shows answer rankings when revealed
  - **Toast Notifications:** Success/error messages

**Layout:**
- Scrollable content
- Answer grid prominent
- Input section fixed at bottom (with keyboard handling)
- Leaderboard sidebar (multiplayer)

**States:**
- Loading (fetching question)
- Question phase (input active)
- Answer revealed (shows points)
- Question complete (all answers revealed)
- Game ended (shows results)
- Turn waiting (multiplayer, not your turn)
- Turn active (multiplayer, your turn)

**Animations:**
- Answer reveal animation
- Points earned animation
- Score update animation
- Timer countdown animation
- Success/error feedback

---

### 13. MULTIPLAYER MENU SCREEN
**Purpose:** Multiplayer game mode selection

**Features:**
- Header with back button and "Multiplayer" title
- Welcome section:
  - Title: "Welcome to Multiplayer!"
  - Subtitle explaining multiplayer
- Two action buttons:
  1. **Create Room Button** (Primary purple)
     - Icon: 🏠
     - Title: "Create Room"
     - Subtitle: "Host a new game and invite friends"
  2. **Join Room Button** (Secondary purple)
     - Icon: 🚪
     - Title: "Join Room"
     - Subtitle: "Enter a room code to join a game"
- Info section:
  - "How it works:" heading
  - Bullet points explaining:
    - Create room for up to 8 players
    - Share room code
    - Host controls game
    - Players compete for top score

**Layout:**
- Scrollable content
- Buttons stacked vertically
- Info section at bottom

---

### 14. CREATE ROOM SCREEN
**Purpose:** Host creates a multiplayer room

**Features:**
- Header with back button and "Create Room" title
- Category selection (same carousel as single player)
- Question selection (after category):
  - List of questions for category
  - Select one question
- Round time selector:
  - Options: 30s, 45s, 60s, 90s, 120s
  - Selected time highlighted
  - Description for each option
- "Create Room" button (enabled when category and question selected)
- Loading state during room creation

**Layout:**
- Scrollable form
- Sections stacked vertically
- Create button fixed at bottom

**States:**
- Category selection
- Question selection
- Room creating (loading)
- Room created (navigates to Room Lobby)

---

### 15. JOIN ROOM SCREEN
**Purpose:** Player joins existing room with code

**Features:**
- Header with "Exit" button and "Join Room" title
- Instructions section:
  - Title: "Enter Room Code"
  - Subtitle explaining process
- Room code input:
  - Large text input (6 characters)
  - Uppercase auto-format
  - Validation feedback (green when valid, red when invalid)
  - Placeholder: "ABC123"
- Validation messages:
  - Error: "Room code must be 6 characters"
  - Success: "✓ Valid room code format"
- "Join Room" button (disabled until valid code)
- Help section:
  - "Need help?" heading
  - Bullet points with tips

**Layout:**
- Centered form
- Large input prominent
- Help section below

**States:**
- Empty input
- Invalid code (red)
- Valid code (green)
- Joining (loading)
- Error (room not found)
- Success (navigates to Room Lobby)

---

### 16. ROOM LOBBY SCREEN
**Purpose:** Waiting room before game starts

**Features:**
- **Header:**
  - Room code display (large, prominent, copyable)
  - "Leave Room" button
- **Player List:**
  - Shows all players in room
  - Each player shows:
    - Avatar
    - Display name
    - "Host" badge (for host)
    - Kick button (host only, for other players)
  - Player count indicator
- **Round Time Selector (Host only):**
  - Time options (30s, 45s, 60s, 90s, 120s)
  - Selected time highlighted
- **Action Buttons (Host only):**
  - "Start Game" button (enabled with 2+ players)
  - "End Game" button (if game in progress)
- **Status Messages:**
  - "Waiting for players..." (if < 2 players)
  - "Game in progress..." (if game started)
  - Player joined/left notifications

**Layout:**
- Room code at top (large, centered)
- Player list in middle (scrollable)
- Host controls at bottom
- Animated entrance

**States:**
- Waiting (lobby)
- Game starting (loading)
- Game in progress (shows status)
- Player joined animation
- Player left notification

---

### 17. MULTIPLAYER CATEGORY SCREEN
**Purpose:** Select category for multiplayer room

**Features:**
- Same as Categories Carousel Screen
- Used when creating room
- Category selection flows to question selection

---

### 18. MULTIPLAYER QUESTIONS SCREEN
**Purpose:** Select question for multiplayer room

**Features:**
- Same as Question Selection Screen
- Used in room creation flow
- Selects question for multiplayer game

---

### 19. MULTIPLAYER LEADERBOARD SCREEN
**Purpose:** Full-screen leaderboard view

**Features:**
- Header with back button
- Full leaderboard list:
  - Rank (with medals for top 3: 🥇🥈🥉)
  - Player avatar
  - Player name
  - Score
  - Current player highlighted
- "Back to Game" button

**Layout:**
- Scrollable list
- Large, clear rankings

---

### 20. CUSTOM QUESTION SCREEN
**Purpose:** Create custom question for single player

**Features:**
- Header with back button and "Create Your Own" title
- Question input section:
  - Label: "Question"
  - Large text input (multiline, 3 lines)
  - Placeholder: "Enter your question here..."
- Answers input section:
  - Label: "Answers (2-10)"
  - "+ Add Answer" button
  - List of answer inputs (2-10 answers)
  - Each answer has:
    - Text input
    - Remove button (×) if more than 2 answers
  - Answers ranked 1-10 (order matters)
- Tips section:
  - "💡 Tips" heading
  - Bullet points with instructions
- "Create & Play" button
- Team setup modal (if teams enabled):
  - Team configuration options
  - Start game button

**Layout:**
- Scrollable form
- Sections stacked
- Create button at bottom

**States:**
- Default (empty)
- Adding answers
- Validation errors
- Creating (loading)
- Success (navigates to game)

---

## 🧩 COMPONENTS

### Buttons
- **Primary Button:** Purple background, white text, rounded, shadow
- **Secondary Button:** Outlined, purple border, purple text
- **Destructive Button:** Red/gray background
- **Disabled State:** Reduced opacity, grayed out
- **Loading State:** Spinner replaces text

### Input Fields
- **Text Input:** Dark background, white text, rounded border
- **Focused State:** Purple border glow
- **Error State:** Red border, error message below
- **Success State:** Green border
- **Placeholder:** Muted gray text

### Cards
- **Category Card:** Colored background, icon, text, rounded corners
- **Question Card:** Dark background, question text, selection button
- **Player Card:** Avatar, name, score, status badges

### Modals
- **Overlay:** Dark semi-transparent background
- **Modal Card:** Centered, rounded, dark background
- **Close Button:** Top right or bottom action

### Leaderboard
- **Entry:** Rank icon, avatar, name, score
- **Top 3:** Special styling with medals
- **Current Player:** Highlighted background

### Toast Notifications
- **Success:** Green background, checkmark icon
- **Error:** Red background, X icon
- **Info:** Blue background, info icon
- **Warning:** Orange background, warning icon
- Appears at top, auto-dismisses

---

## 🔄 USER FLOWS

### Flow 1: Single Player Game
1. Home → Single Player
2. Categories → Select Category
3. Question Selection → Select Question or Play All
4. Game Lobby → Start Game
5. Game Screen → Play
6. Results Modal → Play Again or Back to Categories

### Flow 2: Multiplayer Game (Host)
1. Home → Multiplayer
2. Multiplayer Menu → Create Room
3. Create Room → Select Category → Select Question → Set Time → Create
4. Room Lobby → Wait for Players → Start Game
5. Game Screen → Play
6. Results → Back to Menu

### Flow 3: Multiplayer Game (Player)
1. Home → Multiplayer
2. Multiplayer Menu → Join Room
3. Join Room → Enter Code → Join
4. Room Lobby → Wait for Host
5. Game Screen → Play
6. Results → Back to Menu

### Flow 4: Custom Question
1. Home → Create Your Own
2. Custom Question Screen → Enter Question & Answers → Create
3. Game Screen → Play Custom Question
4. Results → Back to Home

### Flow 5: Profile Management
1. Home → Profile Button
2. Profile Screen → Edit Name or Avatar
3. Avatar Selection → Select → Save
4. Back to Profile → Back to Home

---

## 📱 MOBILE SPECIFICATIONS

### Screen Sizes
- **Primary:** iPhone 14 Pro (390x844px)
- **Also Design For:** 
  - iPhone SE (375x667px) - smaller
  - iPhone 14 Pro Max (430x932px) - larger
  - Android standard (360x640px to 412x915px)

### Safe Areas
- Top: 44-59px (notch/status bar)
- Bottom: 34px (home indicator)
- Sides: 0px (full width)

### Touch Targets
- Minimum: 44x44px
- Buttons: 48-56px height
- Icons: 24-32px with padding

### Gestures
- Swipe back: Navigate back
- Pull to refresh: (if applicable)
- Long press: Context menus (if applicable)

---

## 🎭 STATES & INTERACTIONS

### Loading States
- Skeleton screens for content loading
- Spinner for actions
- Progress indicators for long operations

### Error States
- Inline validation errors
- Toast notifications for API errors
- Empty states with helpful messages

### Success States
- Confirmation messages
- Celebration animations (confetti for wins)
- Smooth transitions

### Empty States
- "No questions available"
- "No players in room"
- Helpful guidance text

---

## ♿ ACCESSIBILITY

### Color Contrast
- Text on background: WCAG AA compliant (4.5:1)
- Large text: 3:1 ratio
- Interactive elements: Clear visual feedback

### Screen Readers
- All buttons have labels
- Form fields have descriptions
- Status messages are announced
- Navigation is clear

### Visual
- No color-only indicators
- Icons have text labels
- Clear focus states
- Adequate spacing

---

## 🎬 ANIMATIONS

### Transitions
- Screen transitions: Slide from right (0.3s)
- Modal: Fade + scale (0.3s)
- Button press: Scale down (0.1s)

### Gameplay Animations
- Answer reveal: Fade in + slide up
- Points earned: Number count-up + bounce
- Score update: Pulse animation
- Timer: Smooth countdown
- Success: Checkmark animation

### Micro-interactions
- Button hover/press feedback
- Input focus glow
- Card selection highlight
- List item animations

---

## 📋 DESIGN CHECKLIST

### Must Include:
- ✅ All 20 screens listed above
- ✅ All features per screen documented
- ✅ All states (loading, error, success, empty)
- ✅ All modals and overlays
- ✅ All button styles and states
- ✅ All input field styles and states
- ✅ Color system implementation
- ✅ Typography system
- ✅ Spacing system
- ✅ Component library
- ✅ Mobile-safe areas
- ✅ Touch target sizes
- ✅ Accessibility considerations

### Design Notes:
- Dark theme throughout (black/dark gray backgrounds)
- Purple/indigo primary color scheme
- Modern, clean, game-focused aesthetic
- Clear hierarchy and visual feedback
- Smooth, polished interactions
- Mobile-first, thumb-friendly design

---

## 🎯 FINAL NOTES

This is a **mobile game app** for iOS and Android. The design should be:
- **Engaging:** Fun, game-like aesthetic
- **Clear:** Easy to understand game flow
- **Responsive:** Works on various screen sizes
- **Accessible:** Meets WCAG standards
- **Polished:** Professional, production-ready

Create complete, pixel-perfect designs for all screens with all features, states, and interactions included. Each screen should be production-ready and include all UI elements, spacing, colors, and typography as specified.

---

**END OF PROMPT**




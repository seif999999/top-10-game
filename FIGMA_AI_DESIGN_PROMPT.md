# FIGMA AI DESIGN PROMPT - TOP 10 GAME
## Feature Requirements for Mobile Game App Design

---

## 🎨 COLOR PALETTE

**Primary Colors:**
- Primary: #4F46E5 (Indigo)
- Secondary: #8B5CF6 (Purple)
- Background: #0A0A0A (Near Black)
- Surface/Card: #1C1C1E (Dark Gray)
- Text: #FFFFFF (White)
- Muted Text: #8E8E93 (Light Gray)

**Accent Colors:**
- Success: #10B981 (Green)
- Error: #EF4444 (Red)
- Warning: #F59E0B (Orange)
- Info: #3B82F6 (Blue)
- Border: #374151 (Medium Gray)
- Accent: #FF6B6B (Coral)

**Theme:** Dark theme with purple/indigo primary colors

---

## 📱 APP CONTEXT

**App Type:** Mobile Trivia Game (iOS & Android)  
**Core Gameplay:** Players guess the top 10 answers to questions. Each answer is ranked 1-10, and players earn points based on the rank (1 point for rank 10, 10 points for rank 1).  
**Modes:** Single Player, Multiplayer (online rooms), Custom Questions

---

## 📄 PAGES & FEATURES

### 1. LOGIN SCREEN
**Features Required:**
- Email input field
- Password input field with show/hide toggle
- Sign In button
- Forgot Password link
- Sign up link/button
- Google Sign-In option
- Error message display
- Loading state

---

### 2. REGISTER SCREEN
**Features Required:**
- Display Name input
- Email input
- Password input with show/hide toggle
- Confirm Password input with show/hide toggle
- Privacy Policy checkbox with link
- Sign Up button
- Sign in link
- Google Sign-In option
- Form validation error display
- Loading state

---

### 3. FORGOT PASSWORD SCREEN
**Features Required:**
- Email input field
- Send Reset Link button
- Back to login link
- Success confirmation message
- Error message display
- Instructions text

---

### 4. RESET PASSWORD SCREEN
**Features Required:**
- New Password input
- Confirm Password input
- Password requirements list
- Reset Password button
- Error message display

---

### 5. PASSWORD RESET SUCCESS SCREEN
**Features Required:**
- Success confirmation message
- Instructions (check email)
- Back to Login button

---

### 6. HOME SCREEN
**Features Required:**
- Profile avatar button (top navigation)
- How to Play button (top navigation)
- App logo/branding
- Welcome message with user's display name
- Single Player game mode card/button
- Multiplayer game mode card/button
- Create Your Own question card/button
- Each game mode should show: icon, title, description

---

### 7. PROFILE SCREEN
**Features Required:**
- User avatar display (large, editable)
- Display name (editable)
- Email address (read-only)
- Member since date
- Sign Out button
- Edit name modal (text input, cancel, save buttons)
- Navigate to avatar selection

---

### 8. AVATAR SELECTION SCREEN
**Features Required:**
- Grid of avatar options (8 avatars)
- Each avatar shows: image/icon, name
- Selected state indicator
- Save button
- Back navigation

---

### 9. CATEGORIES CAROUSEL SCREEN (Single Player)
**Features Required:**
- Horizontal scrollable category cards
- Categories: Sports, Movies, Music, Science, History, Geography, Food & Drink, Technology
- Each category shows: icon/emoji, name, description, question count
- Category selection indicator
- Continue button (enabled when category selected)
- Back navigation

---

### 10. QUESTION SELECTION SCREEN (Single Player)
**Features Required:**
- List of questions for selected category
- Each question shows: question text, select button
- "Play All Questions" option
- Loading state
- Empty state message
- Back navigation

---

### 11. GAME LOBBY SCREEN (Single Player)
**Features Required:**
- Category name display
- Selected question display (if specific question chosen)
- Player list
- Start Game button
- Back navigation

---

### 12. GAME SCREEN (Main Gameplay)
**Features Required:**
- **Header:**
  - Question number indicator (e.g., "Question 1 of 10")
  - Current player's score display
  - Timer (for multiplayer turns)
  - Exit/back button

- **Question Display:**
  - Large question text
  - Progress indicator (answers found: "X/10")

- **Answer Grid:**
  - 10 answer slots (ranked 1-10)
  - Each slot shows: rank number, answer text (when revealed), points value, player/team name (multiplayer)
  - Unrevealed answers show as locked/hidden
  - Revealed answers highlighted

- **Answer Input:**
  - Text input field
  - Submit Answer button
  - Validation feedback

- **Submitted Answers List:**
  - Shows player's submitted answers for current question
  - Each shows: answer text, correct/incorrect status, points earned

- **Leaderboard (Multiplayer):**
  - Player rankings (top 3 with medals)
  - Player names and scores
  - Current player highlighted

- **Turn Indicator (Multiplayer):**
  - Shows whose turn it is
  - Turn timer countdown
  - Skip Turn button (if allowed)

- **Action Buttons:**
  - Next Question (host only, when question complete)
  - End Game (host only)
  - View Results (when game ends)

- **Modals:**
  - Results Modal: Final scores, winner, game statistics
  - Ranking Overlay: Shows answer rankings when revealed
  - Toast notifications: Success/error messages

- **States:**
  - Loading
  - Question phase (input active)
  - Answer revealed
  - Question complete
  - Game ended
  - Turn waiting (multiplayer)
  - Turn active (multiplayer)

---

### 13. MULTIPLAYER MENU SCREEN
**Features Required:**
- Welcome section with title and subtitle
- Create Room button (with icon, title, description)
- Join Room button (with icon, title, description)
- How it works info section with bullet points:
  - Create room for up to 8 players
  - Share room code
  - Host controls game
  - Players compete for top score
- Back navigation

---

### 14. CREATE ROOM SCREEN
**Features Required:**
- Category selection (same categories as single player)
- Question selection (after category selected)
- Round time selector (options: 30s, 45s, 60s, 90s, 120s)
- Create Room button
- Loading state
- Back navigation

---

### 15. JOIN ROOM SCREEN
**Features Required:**
- Instructions section
- Room code input field (6 characters, uppercase)
- Validation feedback (valid/invalid)
- Join Room button (disabled until valid code)
- Help section with tips
- Exit button
- Loading state
- Error messages

---

### 16. ROOM LOBBY SCREEN
**Features Required:**
- Room code display (large, prominent, copyable)
- Player list showing:
  - Avatar
  - Display name
  - Host badge (for host)
  - Kick button (host only, for other players)
- Player count indicator
- Round time selector (host only, options: 30s, 45s, 60s, 90s, 120s)
- Start Game button (host only, enabled with 2+ players)
- End Game button (host only, if game in progress)
- Leave Room button
- Status messages (waiting for players, game in progress)
- Player joined/left notifications

---

### 17. MULTIPLAYER CATEGORY SCREEN
**Features Required:**
- Same as Categories Carousel Screen (Single Player)
- Used in room creation flow

---

### 18. MULTIPLAYER QUESTIONS SCREEN
**Features Required:**
- Same as Question Selection Screen (Single Player)
- Used in room creation flow

---

### 19. MULTIPLAYER LEADERBOARD SCREEN
**Features Required:**
- Full leaderboard list
- Each entry shows: rank (with medals for top 3), avatar, player name, score
- Current player highlighted
- Back to Game button

---

### 20. CUSTOM QUESTION SCREEN
**Features Required:**
- Question input field (multiline)
- Answers input section:
  - Add Answer button
  - List of answer inputs (2-10 answers)
  - Remove button for each answer (if more than 2)
- Tips/instructions section
- Create & Play button
- Team setup modal (if teams enabled)
- Back navigation
- Loading state
- Validation errors

---

## 🎯 DESIGN REQUIREMENTS

**Platform:** Mobile (iOS & Android)  
**Theme:** Dark mode  
**Style:** Modern, game-focused, engaging  
**Accessibility:** Minimum 44px touch targets, WCAG AA color contrast

**Design Freedom:** Create a fresh, modern design using the provided colors. Focus on:
- Clear visual hierarchy
- Engaging game aesthetics
- Smooth user experience
- Mobile-optimized layouts
- Intuitive navigation

---

**Generate complete designs for all 20 pages with all listed features, using the provided color palette and maintaining a cohesive dark theme throughout.**


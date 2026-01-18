# Figma Design Prompt: Single Player Game Screen

## Overview
Design a complete single-player game screen for a trivia game where players guess the top 10 answers to questions. The screen should be modern, dark-themed, and highly interactive with real-time feedback.

---

## Screen Layout & Structure

### 1. HEADER SECTION
**Location:** Top of screen, fixed position
**Background:** Dark purple gradient (`#1a1a2e` to `#16213e` to `#0f0f1e`)
**Height:** ~80-100px (including safe area)

**Elements:**
- **Back Button (Left):**
  - White left arrow (←)
  - Font size: 24px
  - Font weight: 600
  - Text shadow: `rgba(173, 216, 230, 0.6)`, radius: 8px
  - Touchable area: 40x40px
  - Position: Left side, centered vertically

- **Title Area (Center):**
  - Optional: "Single Player" indicator (if needed)
  - Font size: 18px
  - Font weight: 700
  - Color: `#E2E8F0`

- **Exit Button (Right):**
  - Text: "Exit"
  - Background: `#EF4444` (red)
  - Border: `#DC2626`
  - Border radius: 12px
  - Padding: 8px vertical, 16px horizontal
  - Font size: 16px
  - Font weight: 600
  - Color: White
  - Touchable area: Minimum 44x44px

---

### 2. QUESTION CARD SECTION
**Location:** Below header, scrollable content
**Background:** Dark purple card (`#1E1B4B`)
**Border:** `rgba(139, 92, 246, 0.3)` (purple, 30% opacity)
**Border radius:** 12px
**Padding:** 20px
**Margin:** 16px horizontal, 12px vertical
**Shadow:** Purple glow (`#8B5CF6`, opacity: 0.3, radius: 6px)

**Question Header (Top of card):**
- **Question Number Badge (Left):**
  - Text: "Question 1", "Question 2", etc.
  - Font size: 14px
  - Font weight: 600
  - Color: `#8B5CF6` (purple)
  - Background: `rgba(139, 92, 246, 0.2)`
  - Padding: 6px vertical, 12px horizontal
  - Border radius: 20px

- **Category Badge (Right):**
  - Text: Category name (e.g., "Sports", "Movies")
  - Font size: 14px
  - Font weight: 500
  - Color: `#A78BFA` (light purple)
  - Background: `rgba(167, 139, 250, 0.2)`
  - Padding: 6px vertical, 12px horizontal
  - Border radius: 20px

**Question Text:**
- Font size: 18px
- Font weight: 600
- Color: `#E2E8F0` (light gray)
- Line height: 26px
- Margin top: 16px
- Text alignment: Left
- Example: "Name the top 10 most popular sports in the world"

---

### 3. TIMER SECTION (Optional - for timed modes)
**Location:** Between question card and answer grid
**Visibility:** Only shown in timed game modes (team mode or timed single player)
**Background:** `rgba(139, 92, 246, 0.1)` (purple tint)
**Border:** `rgba(139, 92, 246, 0.3)`, width: 2px
**Border radius:** 16px
**Padding:** 16px vertical, 24px horizontal
**Margin:** 16px bottom

**Timer States:**
- **Normal (>10 seconds):**
  - Background: `rgba(139, 92, 246, 0.1)`
  - Border: `rgba(139, 92, 246, 0.3)`
  - Label color: `#A78BFA`
  - Number color: `#8B5CF6`
  - Number size: 32px, weight: 900

- **Warning (≤10 seconds):**
  - Background: `rgba(251, 191, 36, 0.15)` (yellow tint)
  - Border: `rgba(251, 191, 36, 0.5)`
  - Label color: `#FBBF24`
  - Number color: `#FBBF24`
  - Animation: Gentle pulse (scale 1.0 to 1.05)

- **Critical (≤5 seconds):**
  - Background: `rgba(239, 68, 68, 0.15)` (red tint)
  - Border: `rgba(239, 68, 68, 0.5)`, width: 3px
  - Label color: `#EF4444`
  - Number color: `#EF4444`
  - Number size: 36px
  - Animation: Fast flash (opacity 0.7 to 1.0)

**Timer Elements:**
- **Label:** "Time Remaining"
  - Font size: 14px
  - Font weight: 700
  - Text transform: Uppercase
  - Letter spacing: 1px
  - Margin bottom: 8px

- **Number Display:**
  - Large, bold number (seconds remaining)
  - Or "∞" symbol for unlimited time
  - Text shadow: Matching color at 50% opacity

---

### 4. ANSWER GRID SECTION
**Location:** Below timer/question card
**Title:** "Answers" (centered, above grid)
  - Font size: 16px
  - Font weight: 600
  - Color: `#64748B` (gray)
  - Margin bottom: 12px

**Grid Layout:**
- 2 columns, 5 rows (10 answer cards total)
- Gap between cards: 8px
- Cards arranged in a flex wrap layout

**Answer Card States:**

#### A. Locked/Unrevealed State (Default)
- **Background:** `rgba(139, 92, 246, 0.2)` (purple tint)
- **Border:** `rgba(139, 92, 246, 0.8)`, width: 1px
- **Border radius:** 8px
- **Padding:** 12px
- **Shadow:** Purple glow (`#8B5CF6`, opacity: 0.2, radius: 3px)
- **Width:** 48% of container (2 columns)
- **Height:** Auto (minimum 60px)

**Card Content:**
- **Rank Badge (Left):**
  - Circular badge: 32x32px
  - Background: `#8B5CF6` (purple)
  - Border: `rgba(139, 92, 246, 0.5)`
  - Number: 1-10 (white, bold, 14px)
  - Position: Left side of card

- **Answer Text Area (Center/Right):**
  - Background: `rgba(139, 92, 246, 0.3)`
  - Border radius: 6px
  - Padding: 8px horizontal
  - Min height: 40px
  - **Text:** "🔒" (lock emoji)
  - Font size: 13px
  - Color: `#E2E8F0`
  - Text alignment: Center

#### B. Revealed/Correct State
- **Background:** `rgba(16, 185, 129, 0.2)` (green tint)
- **Border:** `rgba(16, 185, 129, 0.8)` (green)
- **Border radius:** 8px
- **Shadow:** Green glow (`#10B981`, opacity: 0.3)

**Card Content:**
- **Rank Badge:** Same as locked state
- **Answer Text Area:**
  - Background: `rgba(16, 185, 129, 0.3)` (green)
  - **Text:** Actual answer text (e.g., "Soccer")
  - Font size: 13px
  - Font weight: 500
  - Color: `#E2E8F0`
  - Text alignment: Center

---

### 5. ANSWER INPUT SECTION
**Location:** Fixed at bottom of screen (or scrollable if content is long)
**Background:** `rgba(139, 92, 246, 0.1)` (purple tint)
**Border:** `rgba(139, 92, 246, 0.3)`, width: 1px
**Border radius:** 12px
**Padding:** 16px
**Margin:** 16px horizontal, 12px vertical
**Shadow:** Purple glow (`#8B5CF6`, opacity: 0.2, radius: 6px)

**Answer Input Field:**
- **Container:**
  - Background: `#1E293B` (dark gray)
  - Border radius: 12px
  - Border width: 2px
  - Padding: 8px vertical, 16px horizontal
  - Margin bottom: 16px

- **Input States:**
  - **Default:**
    - Border color: `#9CA3AF` (muted gray)
    - Shadow: Subtle (opacity: 0.1, radius: 8px)

  - **Correct Answer Feedback:**
    - Border color: `#10B981` (green)
    - Shadow: Green glow (opacity: 0.6, radius: 20px)
    - Animation: Glow pulse

  - **Wrong Answer Feedback:**
    - Border color: `#EF4444` (red)
    - Shadow: Red glow (opacity: 0.6, radius: 20px)
    - Animation: Glow pulse

- **Placeholder Text:**
  - Text: "Enter your answer..."
  - Color: `#9CA3AF` (muted)
  - Font size: 16px

- **Input Text:**
  - Color: `#F1F5F9` (white)
  - Font size: 16px
  - Font weight: 500
  - Letter spacing: 0.3px

**Submit Button:**
- **Default State:**
  - Background: `#6D28D9` (dark purple)
  - Border radius: 12px
  - Padding: 16px vertical, 24px horizontal
  - Shadow: Purple glow (`#6D28D9`, opacity: 0.3, radius: 8px)
  - **Text:** "Submit Answer"
  - Font size: 16px
  - Font weight: 700
  - Color: White
  - Animation: Scale down to 0.95 on press

- **Disabled State:**
  - Background: `#94A3B8` (gray)
  - Shadow opacity: 0.1
  - **Text:** Same as default
  - Opacity: 0.6

- **Loading/Submitting State:**
  - Same as default but with loading spinner
  - Text: "Submitting..."

**Feedback Indicator (Below Submit Button):**
- **Correct Answer:**
  - Background: `rgba(16, 185, 129, 0.2)` (green tint)
  - Border: `#10B981` (green), width: 2px
  - Border radius: 12px
  - Padding: 8px vertical, 16px horizontal
  - **Text:** "Correct! +X points" (X = points earned)
  - Font size: 16px
  - Font weight: 600
  - Color: `#10B981`
  - Animation: Fade in/out, glow pulse

- **Wrong Answer:**
  - Background: `rgba(239, 68, 68, 0.2)` (red tint)
  - Border: `#EF4444` (red), width: 2px
  - **Text:** "Wrong Answer"
  - Color: `#EF4444`
  - Animation: Fade in/out, shake

---

### 6. SUBMITTED ANSWERS SECTION
**Location:** Below answer grid, above input section
**Visibility:** Only shown when user has submitted answers
**Background:** `#1E1B4B` (dark purple)
**Border:** `#8B5CF6` (purple), width: 1px
**Border radius:** 20px
**Padding:** 20px
**Margin:** 16px horizontal, 12px vertical

**Title:**
- Text: "Your Answers:"
- Font size: 18px
- Font weight: 700
- Color: `#F1F5F9`
- Margin bottom: 12px
- Text alignment: Center

**Answer List:**
- Each answer as a bullet point
- Format: "• [Answer text]"
- Font size: 16px
- Font weight: 500
- Color: `#E2E8F0`
- Padding left: 8px
- Line spacing: 4px

---

### 7. QUESTION COMPLETE SUCCESS MESSAGE
**Location:** Below answer grid, replaces input section when all 10 answers found
**Visibility:** Shown when all 10 correct answers are revealed
**Background:** `#0F172A` (dark blue)
**Border:** `#334155` (gray), width: 1px
**Border radius:** 20px
**Padding:** 20px
**Margin:** 16px horizontal, 12px vertical
**Alignment:** Center

**Elements:**
- **Title:**
  - Text: "Question Complete!"
  - Font size: 26px
  - Font weight: 800
  - Color: `#F1F5F9`
  - Margin bottom: 8px

- **Message:**
  - Text: "You found all 10 correct answers for this question!"
  - Font size: 18px
  - Color: `#94A3B8`
  - Margin bottom: 16px
  - Line height: 24px

- **Next Question Button:**
  - Background: `#8B5CF6` (purple)
  - Border: `#7C3AED`, width: 1px
  - Border radius: 12px
  - Padding: 12px vertical, 24px horizontal
  - **Text:** "Next Question"
  - Font size: 16px
  - Font weight: 700
  - Color: White

---

### 8. LOADING STATE
**Location:** Full screen overlay
**Background:** `#0F172A` (dark)
**Display:** Centered content

**Elements:**
- **Loading Text:**
  - Text: "Loading game..."
  - Font size: 18px
  - Font weight: 600
  - Color: `#94A3B8`
  - Margin top: 16px

- **Loading Spinner:**
  - Color: `#8B5CF6` (purple)
  - Size: 40x40px

---

### 9. RESULTS MODAL (Game End)
**Location:** Full screen modal overlay
**Background:** Semi-transparent dark overlay (`rgba(0, 0, 0, 0.8)`)
**Modal Card:**
- Background: `#1E293B` (dark gray)
- Border radius: 20px
- Padding: 24px
- Max width: 90% of screen
- Centered on screen

**Modal Content:**
- **Title:** "Game Complete!"
- **Final Score Display:** Large, prominent number
- **Statistics:**
  - Total questions answered
  - Correct answers count
  - Accuracy percentage
  - Total time played
- **Buttons:**
  - "Play Again" (primary, purple)
  - "Back to Home" (secondary, gray)

---

### 10. RANKING OVERLAY (Question End)
**Location:** Full screen overlay (tappable to dismiss)
**Background:** Semi-transparent dark overlay
**Content:** Shows all 10 answers in ranked order with indicators for:
- ✅ Correct answers (green)
- ❌ Missed answers (red)

**Auto-dismiss:** After 2.5 seconds (or tap to dismiss)

---

## Color Palette

### Primary Colors
- **Dark Purple Background:** `#1a1a2e`, `#16213e`, `#0f0f1e`
- **Purple Primary:** `#8B5CF6`
- **Purple Dark:** `#6D28D9`
- **Purple Light:** `#A78BFA`

### Accent Colors
- **Success/Green:** `#10B981`
- **Error/Red:** `#EF4444`
- **Warning/Yellow:** `#FBBF24`

### Text Colors
- **Primary Text:** `#F1F5F9`, `#E2E8F0`
- **Secondary Text:** `#94A3B8`
- **Muted Text:** `#64748B`, `#9CA3AF`

### Background Colors
- **Card Background:** `#1E1B4B`, `#1E293B`
- **Input Background:** `#1E293B`
- **Overlay Background:** `rgba(0, 0, 0, 0.8)`

---

## Typography

### Font Families
- **Primary:** System default (San Francisco on iOS, Roboto on Android)
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold), 900 (black)

### Font Sizes
- **Extra Large:** 32px, 36px (timer numbers)
- **Large:** 26px, 28px (titles)
- **Medium:** 18px, 20px (headings)
- **Regular:** 16px (body text, buttons)
- **Small:** 14px (labels, badges)
- **Extra Small:** 12px, 13px (answer cards)

---

## Spacing System

- **Extra Small:** 4px
- **Small:** 8px
- **Medium:** 12px, 16px
- **Large:** 20px, 24px
- **Extra Large:** 32px, 40px

---

## Animations & Interactions

### Button Press
- Scale down to 95% on press
- Duration: 100ms
- Easing: Ease-in-out

### Answer Feedback
- **Correct:** Green glow pulse (opacity 0.6 to 1.0, 2 seconds)
- **Wrong:** Red glow pulse + slight shake (2 seconds)

### Timer Animations
- **Warning (≤10s):** Gentle pulse (scale 1.0 to 1.05, 500ms loop)
- **Critical (≤5s):** Fast flash (opacity 0.7 to 1.0, 200ms loop)

### Answer Card Reveal
- Fade in + slide up animation
- Duration: 300ms
- Easing: Ease-out

### Modal/Overlay Entrance
- Fade in + scale up (0.8 to 1.0)
- Duration: 300ms
- Easing: Ease-out

---

## Scoring System Display

### Points Calculation
- **#1 Answer:** 1 point
- **#2 Answer:** 2 points
- **#3 Answer:** 3 points
- **...and so on up to #10:** 10 points

### Score Display (if shown in header)
- **Current Score:** Large number, prominent
- **Format:** "Score: 45" or just "45"
- **Color:** `#8B5CF6` (purple) or `#F1F5F9` (white)
- **Font size:** 20px, weight: 700

### Progress Indicator (if shown)
- **Format:** "Question 3 of 10" or "3/10"
- **Color:** `#A78BFA` (light purple)
- **Font size:** 14px

---

## Interactive Elements Specifications

### Touch Targets
- **Minimum size:** 44x44px (iOS/Android standard)
- **Button padding:** Minimum 12px vertical, 16px horizontal
- **Answer cards:** Full card is touchable (if interactive)

### Scrollable Areas
- **Main content:** ScrollView with all game elements
- **Padding bottom:** Extra padding (40px) to ensure input section is accessible

### Keyboard Handling
- **Answer input:** Keyboard appears when input is focused
- **Submit on Enter:** Optional - submit when user presses Enter/Return
- **Keyboard dismiss:** Auto-dismiss after successful submission

---

## States & Variations

### Game States
1. **Loading:** Spinner + "Loading game..." text
2. **Active Play:** Question card + answer grid + input section
3. **Question Complete:** Success message + "Next Question" button
4. **Game Complete:** Results modal overlay

### Answer Card States
1. **Locked:** Purple background, lock emoji
2. **Revealed:** Green background, answer text visible
3. **Team Mode Assigned:** (If applicable) Team color badge

### Input States
1. **Empty:** Default border, placeholder visible
2. **Typing:** Active border, text visible
3. **Correct Submission:** Green glow feedback
4. **Wrong Submission:** Red glow feedback

### Button States
1. **Default:** Purple background, white text
2. **Disabled:** Gray background, reduced opacity
3. **Pressed:** Scale down animation
4. **Loading:** Spinner + "Submitting..." text

---

## Accessibility Requirements

### Color Contrast
- **Text on dark backgrounds:** Minimum 4.5:1 contrast ratio
- **Interactive elements:** Clear visual feedback on press

### Screen Reader Support
- **Timer:** "Time remaining: X seconds"
- **Answer cards:** "Answer position X, [locked/revealed]"
- **Buttons:** Clear labels ("Submit Answer", "Next Question")

### Visual Indicators
- **Focus states:** Clear outline or glow on focused elements
- **Error states:** Red color + icon/text indicator
- **Success states:** Green color + icon/text indicator

---

## Responsive Considerations

### Screen Sizes
- **Minimum width:** 320px (small phones)
- **Optimal width:** 375px-414px (standard phones)
- **Tablet:** Scale up proportionally, maintain 2-column answer grid

### Safe Areas
- **Top:** Account for notch/status bar (use safe area insets)
- **Bottom:** Account for home indicator (use safe area insets)

---

## Additional Notes

### Design Philosophy
- **Dark theme:** Maintains consistency with app's dark purple gradient theme
- **Modern UI:** Rounded corners, subtle shadows, smooth animations
- **Clear hierarchy:** Question → Answers → Input → Actions
- **Immediate feedback:** Visual and animated responses to user actions

### Edge Cases to Design
1. **Very long question text:** Ensure card expands, text wraps
2. **Very long answer text:** Truncate with ellipsis or wrap within card
3. **Many submitted answers:** Scrollable list within submitted answers section
4. **Network errors:** Error message overlay (if applicable)

### Performance Considerations
- **Smooth animations:** Use native driver for transform/opacity animations
- **Optimized rendering:** Only render visible answer cards (if using virtualization)
- **Image optimization:** If using icons/images, optimize file sizes

---

## Deliverables Checklist

- [ ] Main game screen layout
- [ ] Question card component (all states)
- [ ] Answer grid (10 cards, locked and revealed states)
- [ ] Timer component (normal, warning, critical states)
- [ ] Answer input section (default, correct, wrong states)
- [ ] Submit button (default, disabled, loading states)
- [ ] Submitted answers section
- [ ] Question complete success message
- [ ] Loading state screen
- [ ] Results modal (game end)
- [ ] Ranking overlay (question end)
- [ ] All button states and interactions
- [ ] Animation specifications
- [ ] Color palette with hex codes
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component variants/states

---

**End of Design Prompt**

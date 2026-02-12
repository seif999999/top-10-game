# RTL Testing Checklist (Arabic)

Use this checklist to verify right-to-left (RTL) layout and Arabic language support before release.

---

## 1. Configuration & language switch

- [ ] **I18nManager**
  - When **Arabic** is selected: layout is RTL (content starts from the right).
  - When **English** is selected: layout is LTR (content starts from the left).
- [ ] **Language change**
  - In Settings, switch to Arabic → all visible text and layout direction update (on **web**).
  - On **native**: after switching language, if a “Restart required” message appears, note it; after restarting the app, layout direction matches the selected language.
- [ ] **Persistence**
  - Select Arabic, close app, reopen → app opens in Arabic with RTL layout (after one restart on native if needed).

---

## 2. Text alignment

- [ ] **Headers and titles**: Align to the correct reading side (right in RTL, left in LTR).
- [ ] **Body text**: Paragraphs and lists align correctly in both directions.
- [ ] **Centered text**: Remains centered (e.g. modals, buttons).
- [ ] **Numbers**: Eastern Arabic numerals (٠١٢٣…) when locale is Arabic (if implemented); otherwise at least no broken alignment.

---

## 3. Input fields

- [ ] **Text inputs**: Cursor and typed text start from the correct side (right in RTL).
- [ ] **Placeholders**: Align to the correct side.
- [ ] **Labels** above/beside inputs: On the correct side and not overlapping.
- [ ] **Error/success messages** under inputs: Readable and correctly aligned.

---

## 4. Lists and scrolling

- [ ] **Vertical lists** (e.g. categories, questions): Items align correctly; bullets or icons on the correct side.
- [ ] **Horizontal lists/carousels**: Scroll direction feels natural in RTL (e.g. first item on the right in RTL).
- [ ] **ScrollView**: No horizontal jump or wrong scroll position when switching to RTL.

---

## 5. Modals and overlays

- [ ] **Modals**: Title and content align correctly; close (×) button is on the correct “end” side (top-right in LTR, top-left in RTL).
- [ ] **Toasts**: Icon and text order and alignment correct in RTL; close button on the correct side.
- [ ] **Bottom sheets / slide-ups**: Content and buttons align correctly.

---

## 6. Navigation and back/arrows

- [ ] **Back button**: Arrow points in the correct “back” direction (← in LTR, → in RTL).
- [ ] **Forward/next arrows** (e.g. carousels): Point in the correct “forward” direction (→ in LTR, ← in RTL).
- [ ] **Header layout**: Back on start side, title centered, actions on end side in both LTR and RTL.

---

## 7. Buttons and actions

- [ ] **Primary actions**: Button label aligned correctly (center or end-aligned as designed).
- [ ] **Button rows** (e.g. Cancel | Confirm): Order and spacing correct in RTL (often mirrored).
- [ ] **Icon + text buttons**: Icon on the correct side of the text in both directions.

---

## 8. Specific screens (smoke test)

- [ ] **Auth**: Login, Register, Forgot password — all fields and buttons correct.
- [ ] **Home**: Game mode cards and arrows correct; “How to play” and other links correct.
- [ ] **Game setup**: Category carousel and arrows; duration selector; Start button.
- [ ] **Game screen**: Question text, input, submit, back/exit; multiplayer header and back arrow.
- [ ] **Results modal**: Title, scores, stats, “Play again” / “Back to categories” buttons.
- [ ] **Multiplayer**: Menu, Create room, Join room, Room lobby, Leaderboard — headers and back arrows.
- [ ] **Profile**: Settings, language selector, sign out; How to play modal.
- [ ] **Daily reward modal**: Days row, claim button, close button.
- [ ] **Avatar selection**: Header (Cancel / Done), grid layout.
- [ ] **Privacy policy**: Title, scroll hint, Accept/Decline buttons.

---

## 9. Edge cases

- [ ] **Long Arabic text**: No overflow or clipping; wrapping and alignment correct.
- [ ] **Mixed content**: Arabic + numbers or English (e.g. “Room code: ABC123”) — layout and alignment acceptable.
- [ ] **Rotation**: Portrait and landscape in both LTR and RTL (if supported).

---

## 10. Accessibility (optional)

- [ ] **Screen reader**: Announces content in the correct language and order in RTL.
- [ ] **Focus order**: Tab/focus moves in a logical order in RTL (start → end).

---

## Quick reference

| Area              | LTR (English)     | RTL (Arabic)       |
|-------------------|-------------------|--------------------|
| Text start        | Left              | Right              |
| Back arrow        | ←                 | →                  |
| Next/forward arrow| →                 | ←                  |
| Close button      | Top-right         | Top-left           |
| Row order         | Left → Right      | Right → Left       |

**Config:** `src/config/i18n.ts` (I18nManager, `applyRTL`, `isRTLRestartRequired`)  
**Hook:** `src/hooks/useTranslation.ts` (`isRTL`, `isRTLRestartRequired`)  
**RTL helpers:** `src/frontend/utils/rtlStyles.ts` (`backArrow`, `forwardArrow`, `marginStart`, `marginEnd`, etc.)  
**Component docs:** `src/frontend/components/README.md`

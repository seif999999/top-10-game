# Component Library — RTL-Ready & i18n

This directory contains reusable UI components that support **i18next** and **RTL (right-to-left)** layouts for English and Arabic.

---

## Overview

- **Translation:** Components that display text use the `useAppTranslation` hook and the `components` (or `common`) namespace. Parents can pass translated strings via props where components accept optional translation keys or labels.
- **RTL:** All components that lay out text or icons use `isRTL` from `useAppTranslation()` to apply:
  - `flexDirection: 'row-reverse'` where appropriate
  - `textAlign: 'right'` for text in RTL
  - Margin swaps (e.g. `marginRight` → `marginLeft`) for icon/text spacing in RTL

---

## RTL-Ready Components

### Buttons & actions

| Component | Path | i18n | RTL | Notes |
|-----------|------|------|-----|------|
| **Button** | `Button.tsx` | Title from props (parent translates) | ✅ `textAlign` | Generic button; no internal copy |
| **StandardButton** | `shared/StandardButton.tsx` | Title from props | ✅ `textAlign: isRTL ? 'right' : 'center'` | Variants, loading, accessibility |
| **GoogleSignInButton** | `GoogleSignInButton.tsx` | ✅ `components.googleSignIn.signInWithGoogle` | ✅ Row + icon margin swap | Single label |
| **SignOutButton** | `SignOutButton.tsx` | ✅ `components.signOut.*`, `common.cancel`, `common.error` | — | Alert text translated; icon/text variants |

### Modals & overlays

| Component | Path | i18n | RTL | Notes |
|-----------|------|------|-----|------|
| **DailyRewardModal** | `DailyRewardModal.tsx` | ✅ `components.dailyReward.*` | ✅ Header, days row, labels, claim CTA | Week/day/streak copy |
| **ResultsModal** | `ResultsModal.tsx` | ✅ `components.resultsModal.*` | ✅ Header, scores, stats rows, buttons | Game complete, winner, stats |
| **HostAssignModal** | `HostAssignModal.tsx` | ✅ `components.hostAssign.*`, `common.cancel` | ✅ Title, sections, team row, actions | Assign answer to team |
| **HowToPlayModal** | `HowToPlayModal.tsx` | ✅ `components.howToPlay.*` | ✅ Header, section headers, bullets, modes, button | Rules & modes |
| **AvatarSelectionModal** | `AvatarSelectionModal.tsx` | ✅ `components.avatarSelection.*` | ✅ Header row, Cancel/Done | Avatar names from data |
| **PrivacyPolicyModal** | `PrivacyPolicyModal.tsx` | ✅ `components.privacyPolicy.*`, `common.ok` | ✅ Header, footer, scroll hint, alerts | Policy body not in locale |
| **RankingOverlay** | `RankingOverlay.tsx` | ✅ `components.rankingOverlay.*` | ✅ Title, subtitle, progress, tap hint | In-game ranking strip |

### Forms & inputs

| Component | Path | i18n | RTL | Notes |
|-----------|------|------|-----|------|
| **Input** | `Input.tsx` | Placeholder/label from props | ✅ `textAlign: 'right'` | Thin wrapper around `TextInput` |
| **StandardInput** | `shared/StandardInput.tsx` | Label/placeholder/error from props | ✅ Input and label `textAlign` | Uses `COMPONENT_RESPONSIVE` |

### Feedback & loading

| Component | Path | i18n | RTL | Notes |
|-----------|------|------|-----|------|
| **ToastNotification** | `ToastNotification.tsx` | Title/message from props | ✅ Content row, icon/close margins | Caller passes translated strings |
| **LoadingPage** | `LoadingPage.tsx` | ✅ `common.loadingMessage` or prop | — | Full-screen loader |
| **LoadingSpinner** | `LoadingSpinner.tsx` | — | — | No text |
| **ErrorPage** | `ErrorPage.tsx` | ✅ `errors.page.*`, `common.retry`, `common.goHome` | — | Full-screen error |

---

## Usage patterns

### 1. Using the translation hook

```tsx
import useAppTranslation from '../../hooks/useTranslation';

const MyComponent = () => {
  const { t } = useAppTranslation('components');
  const { isRTL } = useAppTranslation();

  return (
    <View style={isRTL && styles.rtlRow}>
      <Text style={[styles.label, isRTL && styles.rtlText]}>{t('mySection.label')}</Text>
    </View>
  );
};
```

### 2. Optional translation key props

Components that can be reused with different copy accept optional keys or raw text:

- **Button / StandardButton:** `title` — parent passes `t('common.save')` or any string.
- **ToastNotification:** `title`, `message` — parent passes translated strings.
- **Input / StandardInput:** `placeholder`, `label`, `error` — parent passes translated strings.

### 3. RTL styles

- **Row layout:** `flexDirection: 'row-reverse'` for horizontal rows (header, actions, icon+text).
- **Text:** `textAlign: 'right'` for labels, titles, body.
- **Spacing:** Use `isRTL && { marginRight: 0, marginLeft: SPACING.md }` (or a named style like `iconRTL`) so the leading edge of content stays correct in RTL.

---

## Locales

- **Namespace:** `components` — used for all component-specific strings (modals, buttons, errors).
- **Namespace:** `common` — used for shared terms (cancel, done, ok, error, retry, goHome, loading, etc.).
- **Files:** `src/locales/en/components.json`, `src/locales/ar/components.json`.

When adding new copy, add keys under `components` (or `common`) and use `t('key')` or `t('section.key')` with the appropriate namespace.

---

## Checklist for new components

1. If the component renders text, use `useAppTranslation` and translate all user-visible strings (or accept them via props).
2. Use `isRTL` to set `flexDirection`, `textAlign`, and icon/text margins so layout and reading order are correct in Arabic.
3. Prefer passing translation keys or translated strings from the parent for maximum reusability (e.g. button title, toast title/message).
4. Add new keys to both `src/locales/en/components.json` and `src/locales/ar/components.json` (and optionally `common.json`).

---

## Related

- **Hook:** `src/hooks/useTranslation.ts` — `useAppTranslation(ns?)` returns `t`, `currentLanguage`, `changeLanguage`, `isRTL`, `isRTLRestartRequired`.
- **Config:** `src/config/i18n.ts` — RTL set via `I18nManager` and `document.documentElement.dir`; `isRTLRestartRequired()` for native restart prompt.
- **RTL helpers:** `src/frontend/utils/rtlStyles.ts` — `backArrow(isRTL)`, `forwardArrow(isRTL)`, `marginStart`, `marginEnd`, `positionEnd`, etc.
- **Locales:** `src/locales/index.ts` — registers `components` and other namespaces.
- **RTL testing:** `docs/RTL_TESTING_CHECKLIST.md` — checklist for testing Arabic/RTL layout and language switch.

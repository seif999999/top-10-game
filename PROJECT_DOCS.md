# Project Documentation

Central reference for Top 10 Game architecture, features, and subsystems. See also `README.md`, `KEEP_UPDATED.md`, and `docs/` for workflow-specific guides.

---

## Features

- **Auth & profile:** Firebase Auth (Email/Password, optional Google), user profiles with display name and avatar, persisted in Firestore.
- **Gameplay:** Single-player and real-time multiplayer; unified scoring; turn-based play with synchronized timers; fuzzy answer matching and aliases.
- **Multiplayer:** Create/join rooms by code; host controls (start, end, next question, kick); host migration and room termination handling.
- **Custom content:** Create-your-own questions and answers; team mode with configurable turn duration.
- **Localization:** English and Arabic with RTL support; i18next namespaces (see `docs/TRANSLATION_WORKFLOW.md`).
- **Coins & ads:** In-app coin economy (earn via progressive rewarded ads, daily rewards, missions); tiered slot unlock costs; premium coin packages (EGP); optional interstitial and banner ads; premium (ad-free) support.

---

## Coin System & Monetization

### Overview

The coin system provides an in-app currency that rewards engagement and supports future monetization. Coins are used to:

- **Earn:** Users earn coins by watching rewarded video ads (three packages), receiving a one-time welcome bonus (100 coins), and an optional migration bonus (50 coins) for existing users. Daily rewards and missions can also grant coins.
- **Earn (updated):** Progressive ads (10→15→20→25→30 coins, 5/hour); daily rewards capped at 32; missions. No welcome/migration bonuses. **Spend:** Tiered slots 5,100 total. **Premium:** 600–6,000 coins for 30–250 EGP.
- **Packages (deprecated):** Three rewarded-ad packages with different cooldowns:
  - **50 coins:** No cooldown (“Quick Coins”); watch a short ad anytime.
  - **100 coins:** 2-hour cooldown (“Coin Bundle”).
  - **200 coins:** 24-hour cooldown (“Daily Jackpot”).
- **Cooldowns:** Enforced client-side via AsyncStorage (`coin_ad_cooldown_50`, `coin_ad_cooldown_100`, `coin_ad_cooldown_200`) and optionally validated server-side for integrity. Cooldown timers are shown in the Coin Shop UI.

Future spending features (e.g. avatars, power-ups, premium rooms) are planned; see `COIN_SYSTEM_ROADMAP.md`.

### Technical Implementation

- **CoinService** (`src/backend/services/CoinService.ts`): Singleton that:
  - Reads/writes coin balance on `userProfiles/{userId}`.
  - Adds coins with `addCoins(userId, amount, reason)` and records an “earned” transaction.
  - Deducts coins with `deductCoins(userId, amount, reason)` when spending is implemented; records “spent” transactions.
  - `initializeCoins(userId)` grants 100 coins and logs “Welcome bonus” (idempotent).
  - `grantMigrationBonusIfNeeded(userId)` grants 50 coins “Account upgrade bonus” once for users with zero balance and no prior migration transaction.
  - Fetches recent transactions via `getCoinTransactions(userId, limit)`; prunes old transactions (keeps last 100 per user).
- **AdContext** (`src/frontend/contexts/AdContext.tsx`): Integrates with AdService and coin flow:
  - `showRewardedAdForCoins(coinAmount, onSuccess)` loads/shows rewarded ad, then calls CoinService `addCoins` with reason (e.g. “Watched ad”) and updates cooldown via `recordCoinAdClaim(packageId)`.
  - Progressive tracking in `coinAdCooldown.ts` (hour-bucket AsyncStorage).
- **Components:**
  - **CoinDisplay** (`src/frontend/components/CoinDisplay.tsx`): Shows balance and optional “Get more” navigation to Coin Shop; sizes small/medium/large; animates on balance increase.
  - **CoinsShopScreen** (`src/frontend/screens/CoinShopScreen.tsx`): Lists the three packages, cooldown timers, “View History,” and success/error states; triggers rewarded flow via AdContext.
  - **CoinHistoryScreen** (`src/frontend/screens/CoinHistoryScreen.tsx`): Lists recent earned/spent transactions from CoinService.
  - **CoinShopOnboarding** (`src/frontend/components/CoinShopOnboarding.tsx`): First-time modal explaining the coin shop; shown once (AsyncStorage flag).
- **Interstitial & banner ads:** InterstitialAdLoader shows after every 3 single-player game completions (frequency cap 5 min); BannerAd on Home and Multiplayer Menu only. Both respect AdContext `isPremium` (no ads for premium users). See `COIN_TESTING_CHECKLIST.md` for ad test cases.

### Firestore Structure

- **userProfiles/{userId}**
  - `coins` (number): Current balance. Default 0; set/updated by CoinService.
  - Other profile fields (displayName, avatar, stats, etc.) as defined in `userProfileService` and types.
- **userProfiles/{userId}/coinTransactions** (subcollection)
  - Each document: `amount` (number; positive for earned, negative for spent), `type` (`"earned"` | `"spent"`), `reason` (string), `timestamp` (serverTimestamp).
  - Used for history and idempotency (e.g. welcome/migration bonus). Last 100 transactions kept per user.

Security: `firestore.rules` allow read/write on `userProfiles/{userId}` and `userProfiles/{userId}/coinTransactions/{txId}` only when `request.auth.uid == userId`.

### Coin Economy

- **Earning:** Progressive ads up to 100/hour; daily rewards capped at 32; missions 5–250. Casual (1 ad/day × 60 days) ≈2,470 coins; active (4 ads/day × 60 days) ≈6,250 coins.
- **Spending:** Tiered slots 5,100 total; premium packages 600–6,000 coins for 30–250 EGP.

### Monetization Strategy Breakdown

- **Rewarded video (coin ads):** Primary driver; ~60–70% of ad revenue. User chooses to watch for coins; high completion and positive UX when cooldowns and messaging are clear.
- **Interstitial:** ~20–30%. Shown after every 3 single-player game completions with a 5-minute minimum interval; never after multiplayer or during gameplay.
- **Banner:** ~5–10%. Shown on menu screens (Home, Multiplayer Menu) only; not during gameplay, loading, or multiplayer turns. Adaptive size, bottom placement, safe area respected.

Premium (ad-free) users see no interstitials or banners; rewarded coin ads remain available by choice.

### Privacy Compliance

- **iOS ATT (App Tracking Transparency):** Consent is collected via AdMob/Google UMP (AdConsentService). Ad requests and personalization follow user choice; non-personalized ads used when required.
- **GDPR-ready:** Consent flow and ad initialization (AdConsentService, AdContext) support consent-before-load where applicable. User data in Firestore (coins, transactions) is scoped to auth and covered by privacy policy and data retention practices.

### Files Added/Modified (Coin System)

| Area | Files |
|------|--------|
| **Services** | `src/backend/services/CoinService.ts`, `src/backend/utils/coinAdCooldown.ts`, `src/backend/utils/gameCompletionStorage.ts` |
| **Context** | `src/frontend/contexts/AdContext.tsx` |
| **Screens** | `src/frontend/screens/CoinShopScreen.tsx`, `src/frontend/screens/CoinHistoryScreen.tsx`, `src/frontend/screens/GameScreen.tsx` (interstitial trigger), `src/frontend/screens/HomeScreen.tsx`, `src/frontend/screens/MultiplayerMenuScreen.tsx` (banners) |
| **Components** | `src/frontend/components/CoinDisplay.tsx`, `src/frontend/components/CoinShopOnboarding.tsx`, `src/frontend/components/ads/BannerAd.tsx`, `src/frontend/components/ads/InterstitialAdLoader.tsx`, `src/frontend/components/ads/RewardedAdButton.tsx` |
| **Types** | `src/shared/types/index.ts` (CoinTransaction, UserProfile.coins), `src/shared/types/ads.ts` |
| **Locales** | `src/locales/en/screens.json`, `src/locales/en/components.json`, `src/locales/ar/screens.json`, `src/locales/ar/components.json` (coin shop, history, display, onboarding, welcome) |
| **Config / Data** | `src/backend/utils/constants.ts` (COLLECTIONS.USER_PROFILES), Firestore rules for `userProfiles` and `coinTransactions` |

---

For testing the coin system and ads, use `COIN_TESTING_CHECKLIST.md`. For planned spending features and economy balance, see `COIN_SYSTEM_ROADMAP.md`.

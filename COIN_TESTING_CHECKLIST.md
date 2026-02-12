# Coin System Testing Checklist

Use this checklist to verify the coin system, rewarded ads, interstitials, and banners before release. Test on all target platforms and device sizes where applicable.

---

## 1. Coin Earning

- [ ] **All 3 ad packages work correctly**
  - [ ] 50-coin package: ad loads, plays, and grants 50 coins on completion.
  - [ ] 100-coin package: ad loads, plays, and grants 100 coins on completion.
  - [ ] 200-coin package: ad loads, plays, and grants 200 coins on completion.
- [ ] **Cooldowns enforce properly**
  - [ ] 50 coins: no cooldown; can claim again immediately (subject to ad load).
  - [ ] 100 coins: after claim, button disabled for 2 hours; timer shows countdown.
  - [ ] 200 coins: after claim, button disabled for 24 hours; timer shows countdown.
- [ ] **Coins add to Firestore balance**
  - [ ] After each successful rewarded ad, `userProfiles/{userId}.coins` increases by the correct amount.
- [ ] **Transactions log correctly**
  - [ ] Each earned claim creates a document in `userProfiles/{userId}/coinTransactions` with correct `amount`, `type: "earned"`, `reason`, and `timestamp`.
- [ ] **Cooldown timers count down accurately**
  - [ ] “Available in {time}” (or equivalent) updates every second and reaches “Unlimited” or “Ready” when cooldown expires (or test by advancing device time in a controlled way if supported).
- [ ] **Button disabled during cooldown**
  - [ ] Package button is disabled and shows cooldown time when within cooldown period.
- [ ] **Closing ad early: no coins, no cooldown**
  - [ ] If user closes rewarded ad before completion, no coins are added and cooldown for that package is not applied.
- [ ] **Ad failure: no coins, no cooldown**
  - [ ] If ad fails to load or show, no coins are added and cooldown is not applied; error message or retry is shown.

---

## 2. Coin Display

- [ ] **Shows correct balance everywhere**
  - [ ] Home, Profile, Coin Shop, and any other screen that shows coins display the same balance as in Firestore (after sync).
- [ ] **Updates in real-time**
  - [ ] After earning coins (e.g. from Coin Shop), balance updates without requiring navigation away and back.
- [ ] **Animation on coin increase**
  - [ ] When balance increases, the coin display plays the intended animation (e.g. scale or pulse).
- [ ] **Navigation to shop works**
  - [ ] “Get more” / shop button (when present) navigates to Coin Shop screen.
- [ ] **All sizes render correctly**
  - [ ] Small, medium, and large CoinDisplay variants render without clipping or layout issues.

---

## 3. Coin Shop

- [ ] **Packages display correctly**
  - [ ] All three packages show correct title, description, and coin amount; labels and timers are readable in both LTR and RTL.
- [ ] **Timers update every second**
  - [ ] Cooldown countdown in the UI updates at least every second when a package is on cooldown.
- [ ] **Success animations play**
  - [ ] After a successful rewarded ad, the success state (e.g. “+X coins earned!”) and any animation play as designed.
- [ ] **Error handling works**
  - [ ] Ad failed / load error shows a clear message; offline or consent issues do not crash the screen.
- [ ] **Onboarding shows once**
  - [ ] Coin shop onboarding (or first-time modal) appears only once per install (or per cleared storage); after dismissal it does not show again until storage is reset.
- [ ] **Welcome bonus granted to new users**
  - [ ] New user (or user without prior welcome transaction) receives 100 coins and a “Welcome bonus” transaction; balance and history reflect this.

---

## 4. Edge Cases

- [ ] **Offline mode handling**
  - [ ] With no network, coin balance still shows last synced value; rewarded ads are disabled or show an appropriate message; no crash.
- [ ] **Multi-device sync (Firestore)**
  - [ ] Log in on two devices; earn or spend coins on one; other device reflects updated balance (after refresh or listener update).
- [ ] **Clock manipulation protection**
  - [ ] Cooldowns are based on server timestamp or resilient to small clock skew; document behavior if only client time is used (e.g. user cannot bypass cooldown by changing device time in a way that matters).
- [ ] **Premium user handling**
  - [ ] Premium (ad-free) users: no interstitials, no banners; rewarded coin ads still available if offered; coin balance and shop behave normally.
- [ ] **First-time user initialization**
  - [ ] New user gets 100 welcome coins and one “Welcome bonus” transaction; existing user with 0 balance and no migration transaction can receive migration bonus (50 coins) once.

---

## 5. Interstitial & Banner Ads

- [ ] **Interstitials after every 3 games**
  - [ ] Complete 3 single-player games; interstitial is shown (subject to 5-min cap and ad load). Not shown after 1st or 2nd game.
- [ ] **Frequency capping (5 min minimum)**
  - [ ] Two interstitials do not show within 5 minutes of each other (e.g. complete 3 games, see ad; complete 3 more within 5 min — second interstitial not shown until 5 min have passed).
- [ ] **Banners on menu screens only**
  - [ ] Banner appears on Home and Multiplayer Menu (bottom, adaptive); does not appear during gameplay (GameScreen), during multiplayer turns, or on loading screens.
- [ ] **No ads during gameplay**
  - [ ] No interstitial and no banner while in an active game (single or multiplayer).

---

## 6. Performance

- [ ] **Fast loading**
  - [ ] Coin Shop and Coin History screens load without noticeable delay; balance appears quickly.
- [ ] **No memory leaks**
  - [ ] Repeated navigation to/from Coin Shop and ad flows does not cause growing memory (observe in dev tools or profiler).
- [ ] **Optimized Firestore reads**
  - [ ] Balance and transactions are not over-fetched (e.g. no unnecessary re-reads on every render); listeners or one-time reads are used appropriately.
- [ ] **Smooth animations**
  - [ ] Coin increase animation and any success/UI animations run smoothly (e.g. 60fps on target devices).

---

## 7. Test on Devices

- [ ] **Android phone**
  - [ ] All sections above verified on at least one Android phone (recommended: mid-range, different screen size).
- [ ] **Android tablet**
  - [ ] Layout and banners on tablet; coin display and shop usable; no overlap or truncation.
- [ ] **iPhone**
  - [ ] All sections above verified on at least one iPhone; ATT/consent flow if applicable.
- [ ] **iPad**
  - [ ] Layout and banners on iPad; coin display and shop usable; safe areas and notched devices if applicable.

---

*For RTL and localization checks, use `docs/RTL_TESTING_CHECKLIST.md` and translation validation scripts.*

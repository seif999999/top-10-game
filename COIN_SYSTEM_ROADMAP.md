# Coin System Roadmap

This document outlines **planned** coin spending features and economy balance. It is for planning and prioritization only; implementation details may change.

---

## Future Spending Features

### 1. Purchase custom avatars

| Field | Value |
|-------|--------|
| **Coin cost** | 100–500 coins per avatar (tiered: common 100, rare 250, exclusive 500) |
| **Value to player** | Personalization; visible in profile and multiplayer; status. |
| **Priority** | Phase 1 |
| **Technical requirements** | Avatar asset IDs and coin tiers in config; `CoinService.deductCoins`; unlock state in user profile or subcollection; AvatarSelectionScreen/Profile to show locked/unlocked and purchase flow. |

---

### 2. Unlock extra custom question slots

| Field | Value |
|-------|--------|
| **Coin cost** | 200 coins per additional slot (e.g. beyond first 3 free slots) |
| **Value to player** | More custom content; replay and variety. |
| **Priority** | Phase 1 |
| **Technical requirements** | Max slots per user in profile or config; one-time purchase per slot; CustomQuestionSlotsScreen and save/load logic to respect slot limit. |

---

### 3. Power-ups (in-game)

| Power-up | Coin cost | Value to player | Priority |
|----------|-----------|------------------|----------|
| Skip question | 50 | Skip one question without penalty (e.g. in single-player or timed rounds). | Phase 2 |
| Freeze timer | 30 | Pause or extend turn timer once per game. | Phase 2 |
| Double points | 75 | Double points for next correct answer (one use per game). | Phase 2 |

| Field | Value |
|-------|--------|
| **Technical requirements** | Power-up definitions (id, cost, effect); `deductCoins` at use; GameContext/GameScreen to apply effect (skip, timer freeze, points multiplier); UI to buy/use before or during game; optional “power-up slot” limit per game. |

---

### 4. Premium multiplayer rooms (entry fee, winner takes all)

| Field | Value |
|-------|--------|
| **Coin cost** | 25 coins entry per player; pot distributed to winner(s). |
| **Value to player** | Stakes and competition; higher engagement in multiplayer. |
| **Priority** | Phase 2 |
| **Technical requirements** | Room type or flag “coin entry”; collect entry via `deductCoins` on join; hold pot in room doc or server; on game end, credit winner(s) via `addCoins`; tie handling (split or single winner). Firestore transactions to avoid double-spend. |

---

### 5. Daily bonus multiplier

| Field | Value |
|-------|--------|
| **Coin cost** | 150 coins one-time purchase for 2× coins for 24 hours. |
| **Value to player** | Higher earn rate for a day; encourages return and ad watches. |
| **Priority** | Phase 2 |
| **Technical requirements** | User-scoped “multiplier active until” timestamp; CoinService or AdContext applies multiplier when crediting rewarded ad coins; UI in Coin Shop to buy and show remaining time. |

---

### 6. Exclusive question packs

| Field | Value |
|-------|--------|
| **Coin cost** | 300 coins per pack (one-time unlock). |
| **Value to player** | New categories/questions; extended content. |
| **Priority** | Phase 3 |
| **Technical requirements** | Pack IDs and mapping to question sets; “unlocked packs” in user profile; category/question loading respects unlocks; store or content service to define packs. |

---

## Coin Economy Balance Notes

### Design goals

- **Rewarded but not infinite:** Users should feel they can earn meaningful coins (welcome bonus, daily rewarded ads) and afford at least one or two Phase 1 items (e.g. an avatar or a slot) within a few days. Earning should not be so high that all content is trivial to unlock, nor so low that engagement drops.
- **Earn vs spend:** Target average daily earn (e.g. 150–250 coins for active users) vs average spend (e.g. 50–150 coins/day once power-ups and rooms exist). Adjust cooldowns, costs, and new earn channels (missions, daily rewards) to keep a slight surplus for engaged users while encouraging return and ad views.
- **Engagement metrics to track:**
  - Coin balance distribution (median, percentiles).
  - Earn events per user per day (rewarded ad claims by package).
  - Spend events (by product: avatar, slot, power-up, room entry, multiplier, pack).
  - Conversion: % of users who make at least one coin spend.
  - Retention: correlation between coin-earn/spend and D1/D7/D30 retention.
  - Ad revenue per DAU and per coin-earn event (to tune reward amounts and cooldowns).

### Phases summary

| Phase | Focus |
|-------|--------|
| **Phase 1** | Avatars, extra slots — low risk, clear value, simple deduct + unlock. |
| **Phase 2** | Power-ups, premium rooms, daily multiplier — game balance and server logic. |
| **Phase 3** | Question packs and other content — content pipeline and unlock model. |

---

*This roadmap is planning only. Scope, costs, and priorities may change with product and analytics.*

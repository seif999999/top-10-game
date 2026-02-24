# REWARD SYSTEM ANALYSIS & REBALANCING PROPOSAL

**Read-only analysis. No code changes have been made. Confirm findings before implementing.**

---

## EXECUTIVE SUMMARY

- **Current balance:** Does **not** meet the 70/30 target. Rewards are **too generous** for the stated goal: active players can unlock all custom slots in ~30–40 days; casual players in ~4–5 months.
- **Main issues:**
  1. **Fixed 50 coins per game** (single + multiplayer) with no cap and optional double (100 with ad) makes game completion the dominant income.
  2. **One-time missions** (795 coins) plus **repeatable missions** and **daily rewards** (week 6+: 32/day) give a large one-time and recurring boost.
  3. **Total slot cost (5,100 coins)** is reachable by active free players in under 60 days.
- **Recommended direction:** Reduce per-game rewards and/or add soft caps, slightly reduce or cap daily progression, and/or increase total slot cost so that casual players need 6–12 months (or premium) and active players 45–60 days to unlock all.

---

## PART 1: CURRENT REWARD STRUCTURE

### Task 1.1: Single-Player Game Rewards

**Location:**  
- `src/backend/utils/constants.ts` line 107: `GAME_COMPLETION_COIN_REWARD = 50`  
- `src/frontend/screens/GameScreen.tsx` lines 593–664 (effect when `gameState?.gamePhase === 'finished'`), 651–661 (addCoins), 1978–1988 (double-reward ad callback)

**Current reward structure:**
- **Base reward:** 50 coins per game completion (win or “finish” – all answers revealed).
- **Losing:** Same 50 coins if the game completes (all 10 answers found). No separate “lose” path; completion grants 50.
- **Perfect score bonus:** None (fixed 50).
- **Streak bonuses:** None.
- **Score multiplier:** None.
- **Formula:** Fixed 50 coins per completed game. Optional: watch rewarded ad to double → 100 coins total for that game.

**Frequency:**
- **Unlimited** single-player games; no cooldown or daily cap.
- **Double reward:** One optional rewarded ad per game end (same ad type as progressive/watch-for-coins elsewhere).
- Average game duration: ~5–10 minutes (10 questions). Assume **6 games/hour** for estimates.

```
SINGLE-PLAYER REWARDS:
- Location: src/backend/utils/constants.ts (line 107), src/frontend/screens/GameScreen.tsx (lines 593-664, 651-661, 1978-1988)
- Base reward: 50 coins
- Win bonus: 0 (included in base)
- Perfect score bonus: 0
- Score multiplier: None
- Streak bonus: 0
- Frequency cap: None
- Average coins per game: 50 (or 100 if user watches double-reward ad)
- Average game duration: ~7 minutes
- Estimated coins per hour: ~430 coins (6 games × 50, no double) or ~860 if doubling every time
```

---

### Task 1.2: Multiplayer Game Rewards

**Location:**  
- Same constant: `GAME_COMPLETION_COIN_REWARD = 50`  
- `src/frontend/screens/GameScreen.tsx` lines 410–456 (effect when `multiplayerState.gamePhase === 'finished'` and 10 answers revealed), 444–455 (addCoins for multiplayer)

**Current reward structure:**
- **Flat 50 coins** per completed multiplayer game for **every player**, regardless of place (1st, 2nd, 3rd, 4th+).
- No placement-based rewards, no participation-only reward, no win streak bonus.
- Same optional “watch ad to double” as single-player (up to 100 coins for that game).

**Frequency:**
- **Unlimited** multiplayer games; no cooldown or daily cap.
- Average game duration: ~8–12 minutes (turn-based, 10 answers). Assume **4 games/hour** for estimates.

```
MULTIPLAYER REWARDS:
- Location: src/frontend/screens/GameScreen.tsx (lines 410-456, 444-455)
- 1st place: 50 coins
- 2nd place: 50 coins
- 3rd place: 50 coins
- 4th+ place: 50 coins
- Participation reward: N/A (same as above)
- Win streak bonus: 0
- Frequency cap: None
- Average coins per game: 50 (or 100 with double-reward ad)
- Average game duration: ~10 minutes
- Estimated coins per hour: ~200 coins (4 games × 50)
```

---

### Task 1.3: Mission Rewards

**Location:**  
- Definitions: `src/backend/services/missionDefinitions.ts` (full file)  
- Logic: `src/backend/services/missionService.ts` (e.g. lines 215–217, 498–506 for claim)

**Current structure:**
- **21 missions total.** Rewards and repeatability from `missionDefinitions.ts`.
- **One-time (10 missions):** First completion only.
- **Repeatable (11 missions):** After first completion, reward = `floor(rewardCoins * repeatRewardMultiplier)` on each subsequent completion.

**By difficulty:**

| Difficulty | Count | Reward (first) | Repeat reward (approx) | One-time total |
|------------|-------|----------------|------------------------|----------------|
| Easy       | 3     | 5, 10, 15      | N/A                    | 30             |
| Medium     | 5     | 20–30          | 5–12 (mult. 0.25–0.5)  | 55 (one-time only from 2) + repeatable from 3 |
| Hard       | 7     | 50–75          | 15–37 (mult. 0.3–0.5)  | 110 (one-time from 2) + repeatable from 5 |
| Legendary  | 6     | 100–250        | 30–75 (mult. 0.3–0.5)  | 600 (one-time from 3) + repeatable from 3 |

**One-time missions (10):**  
first_correct 5, play_5_games 10, find_top_answer 15, score_500 30, play_3_categories 25, score_1000 50, game_veteran_25 60, score_5000 200, game_master_100 250, all_categories 150.  
**Sum = 795 coins.**

**Repeatable missions (11):**  
answer_streak_3 (25 → 12), accuracy_70 (25 → 7), speedster (20 → 5), answer_streak_5 (50 → 20), perfect_game (75 → 37), category_master (50 → 15), multiplayer_win_3 (60 → 24), daily_streak_7 (70 → 35), leaderboard_champion (150 → 75), answer_streak_10 (100 → 40), accuracy_perfect (100 → 30).  
Rough **repeat cycle** (one completion each): ~300 coins; frequency depends on play style (daily streak weekly, perfect game per game, etc.).

```
MISSION REWARDS:
- Location: src/backend/services/missionDefinitions.ts, missionService.ts (lines 215-217, 498-506)
- Total missions: 21 (10 one-time, 11 repeatable)
- Mission types: One-time + Repeatable (no separate daily/weekly pool)

Easy (one-time): 3 missions, 5+10+15 = 30 coins total. Typical: 1–5 games.
Medium: 5 missions. One-time: 30+25 = 55. Repeatable: 25→12, 25→7, 20→5.
Hard: 7 missions. One-time: 50+60 = 110. Repeatable: 50→20, 75→37, 50→15, 60→24, 70→35.
Legendary: 6 missions. One-time: 200+250+150 = 600. Repeatable: 150→75, 100→40, 100→30.

ONE-TIME MISSIONS TOTAL: 795 coins
REPEATABLE: ~300 coins per “full cycle”; rate depends on play (e.g. 50–150 coins/week for active players)
```

---

### Task 1.4: Daily Reward System

**Location:** `src/backend/services/dailyRewardService.ts` (e.g. lines 55–59 `calculateReward`, 147–264 `claimDailyReward`)

**Current structure:**
- **Week-based progression:** Reward = 2^(week-1), capped at 32 coins.
  - Week 1: 1 coin/day  
  - Week 2: 2 coins/day  
  - Week 3: 4 coins/day  
  - Week 4: 8 coins/day  
  - Week 5: 16 coins/day  
  - Week 6+: 32 coins/day (cap)
- **Streak:** 7 days per week; after 7 consecutive days, week advances. If a day is missed, streak resets to Week 1, Day 1.
- **Premium:** `dailyRewardMultiplier = 2` doubles the above (premium only).
- **One claim per calendar day** (same-day check).

```
DAILY REWARDS:
- Location: src/backend/services/dailyRewardService.ts (lines 55-59, 147-264)
- Reward progression:
  Week 1: 1 coin/day
  Week 2: 2 coins/day
  Week 3: 4 coins/day
  Week 4: 8 coins/day
  Week 5: 16 coins/day
  Week 6+: 32 coins/day (cap)
- Pattern: Exponential (2^(week-1)), cap 32
- Streak cap: No day cap; week advances every 7 days
- Streak reset: After missing 1 day → back to Week 1
- First week total: 1+2+4+8+16+32+32 = 95 (if week 1 is 7 days at 1 each = 7; then week 2 = 14; etc.) 
  Actually: Week 1 = 7×1 = 7, Week 2 = 7×2 = 14, Week 3 = 7×4 = 28, Week 4 = 7×8 = 56, Week 5 = 7×16 = 112, Week 6+ = 32/day.
- First month (30 days, no miss): ~ Week 1–4 partial: 7+14+28+56+2×8 = 121 (approx). Conservative: ~120–150 in first 30 days.
- Monthly recurring (steady Week 6+): 32×30 = 960 coins/month
```

---

### Task 1.5: Rewarded Ad System

**Location:**  
- `src/backend/utils/coinAdCooldown.ts`: `PROGRESSIVE_REWARDS = [10, 15, 20, 25, 30]`, 5 ads per hour  
- `src/frontend/contexts/AdContext.tsx` (e.g. 246, 254): `getProgressiveReward(adsWatchedThisHour)`, then `addCoins`

**Current structure:**
- **Progressive per hour:** 1st ad = 10, 2nd = 15, 3rd = 20, 4th = 25, 5th = 30 coins.
- **Hourly cap:** 5 ads per hour. **No daily cap** in code (only hourly reset by bucket).
- **Cooldown:** Reset at next hour boundary (no per-ad cooldown in code; UI may throttle).
- **Max per hour:** 10+15+20+25+30 = **100 coins/hour** from progressive ads.
- **Max per day (theoretical):** 100×24 = **2,400 coins/day** if user watches 5 ads every hour (unrealistic; used for upper bound only).

```
REWARDED AD SYSTEM (Progressive – Coin Shop / watch for coins):
- Location: src/backend/utils/coinAdCooldown.ts, src/frontend/contexts/AdContext.tsx (showProgressiveRewardedAd, lines 228-291)
- 1st ad/hour: 10 coins
- 2nd ad/hour: 15 coins
- 3rd ad/hour: 20 coins
- 4th ad/hour: 25 coins
- 5th ad/hour: 30 coins
- Hourly cap: 5 ads
- Daily cap: None (in code)
- Cooldown: Resets each hour (hour bucket)
- Max coins per hour: 100 coins
- Max coins per day (theoretical): 2,400 (not realistic; 5–10 ads/day ≈ 50–100 coins/day typical)
```

**Note:** The “double reward” ad after game completion is a separate use of the same rewarded ad unit; it grants +50 coins (double the 50 game reward), not the progressive 10–30. It does not consume the progressive hourly count in the same way (separate flow in GameScreen).

---

### Task 1.6: Custom Slot Unlock Costs

**Location:** `src/backend/services/customSlotUnlockService.ts` lines 16–24 (`getSlotUnlockCost`)

**Current structure:**
- Slot 1 (index 0): **Free**
- Slots 2–3 (indices 1–2): **300 coins each**
- Slots 4–5 (indices 3–4): **450 each**
- Slots 6–7 (indices 5–6): **600 each**
- Slots 8–9 (indices 7–8): **750 each**
- Slot 10 (index 9): **900 coins**
- **Total to unlock all 9 paid slots:** 300+300+450+450+600+600+750+750+900 = **5,100 coins**
- **Pricing pattern:** Tiered (2 slots per tier, increasing).

```
CUSTOM SLOT COSTS:
- Location: src/backend/services/customSlotUnlockService.ts (lines 16-24)
- Slot 1: Free (index 0)
- Slot 2: 300 coins
- Slot 3: 300 coins
- Slot 4: 450 coins
- Slot 5: 450 coins
- Slot 6: 600 coins
- Slot 7: 600 coins
- Slot 8: 750 coins
- Slot 9: 750 coins
- Slot 10: 900 coins
- Total cost: 5,100 coins
- Pricing pattern: Tiered (pairs of slots at same price)
```

---

## PART 2: PLAYER JOURNEY ANALYSIS (CURRENT)

Assumptions:
- **Unlock-all target:** 5,100 coins (all custom slots).
- **Double-reward ad:** For simplicity, assume **no** double-reward ad in these scenarios (50 coins per game only). Including it would shorten time-to-unlock further.

### Scenario A: Casual Player (30 min/day × 60 days)

- 0.5 rewarded ads per day (progressive): ~12.5 coins/day average (e.g. 1st ad 10, sometimes 2nd 15) → **750 coins**
- 3 single-player games/day × 50 = 150 coins/day → **9,000 coins**
- Multiplayer: 0
- Daily login: Assume Week 1–2 in first 14 days (1+2 per day avg), then Week 3–4; by day 60 assume steady Week 4–5: ~8–16/day avg → ~600–900 total → **~750 coins**
- Missions: 1 easy per week → ~4–5 easy over 60 days → **~30 coins** (one-time only; most from first week)

**Total earned (60 days):** 750 + 9,000 + 750 + 30 ≈ **10,530 coins**  
**Needs to unlock all slots:** 5,100 coins  
**Surplus:** ~5,430 coins  
**Percentage of slots unlockable:** 100%  
**Time to unlock all (free):** ~29 days (5,100 / (150+12.5+~12 daily) ≈ 29 days)

So **casual players unlock everything in under 2 months**, which is **more generous** than the 70/30 target (6–12 months for casual).

---

### Scenario B: Active Player (2 hours/day × 60 days)

- 4 progressive ads/day: ~(10+15+20+25)/4 ≈ 17.5 × 4 = 70 coins/day → **4,200 coins**
- 6 single-player games/day × 50 = 300 coins/day → **18,000 coins**
- 2 multiplayer games/day × 50 = 100 coins/day → **6,000 coins**
- Daily login: By month 2 assume Week 6+: 32/day → 32×60 = **1,920 coins**
- Missions: 2–3 per week mix easy/medium; one-time 795 + some repeatable ~50/week → 795 + ~400 ≈ **1,195 coins**

**Total earned (60 days):** 4,200 + 18,000 + 6,000 + 1,920 + 1,195 ≈ **31,315 coins**  
**Needs:** 5,100  
**Surplus:** ~26,215 coins  
**Time to unlock all:** 5,100 / (70+300+100+32+~20) ≈ **~10 days**

Active players unlock everything in **~10 days**, far faster than the target 45–60 days.

---

### Scenario C: Hardcore Grinder (4+ hours/day × 60 days)

- 5 progressive ads/day (max): 100 coins/day → **6,000 coins**
- 10 single-player/day × 50 = 500 coins/day → **30,000 coins**
- 5 multiplayer/day × 50 = 250 coins/day → **15,000 coins**
- Daily: 32×60 = **1,920 coins**
- Missions: All one-time 795 + repeatable ~150/week → 795 + ~1,200 ≈ **1,995 coins**

**Total earned (60 days):** 6,000 + 30,000 + 15,000 + 1,920 + 1,995 ≈ **54,915 coins**  
**Time to unlock all:** **&lt; 5 days** (5,100 / 900+ per day)

---

## PART 3: BALANCE EVALUATION

### Question 1: Does the current balance meet the 70/30 target?

**Target:**
- 70% favor developer: Casual players need **6–12 months** or premium to unlock all.
- 30% favor players: Active players unlock all in **45–60 days**.

**Current state:**
- Casual: Unlock 100% in **~1–2 months** → **Too fast** (target 6–12 months).
- Active: Unlock all in **~10 days** → **Far too fast** (target 45–60 days).
- Hardcore: Unlock all in **&lt; 5 days** → Acceptable only if we want grinders to be done quickly; currently **too fast** for 70/30.

**Verdict:** **Does not meet** the 70/30 target. Economy is **too generous**.

---

### Question 2: Which rewards are out of balance?

- **Single-player:** 50/game, unlimited → **Too generous.** ~300–500 coins/hour possible. **Recommend:** Reduce base (e.g. 20–30) and/or add a soft daily cap (e.g. first N games full reward, then reduced).
- **Multiplayer:** 50/game, unlimited → **Too generous.** **Recommend:** Same as single or slightly lower; optional placement bonus (e.g. 1st gets more) to keep engagement without raising average much.
- **Missions:** One-time 795 is a large lump sum; repeatable add steady income. **Slightly generous** for 70/30. **Recommend:** Keep one-time similar or reduce by 10–20%; consider lowering repeat multipliers slightly.
- **Daily rewards:** Week 6+ at 32/day = 960/month. **Reasonable** but contributes to fast unlock when combined with games. **Recommend:** Cap at 16/day (Week 5) or 24/day to slow late-game income.
- **Rewarded ads:** 10–30/ad, 5/hour, no daily cap. **Reasonable** for engagement; daily cap (e.g. 5–10 ads/day) would prevent theoretical 2,400/day and align with “watch a few ads” behavior. **Recommend:** Optional daily cap (e.g. 10 ads/day) for balance.

---

### Question 3: Potential exploits

- **Single-player farming:** Yes. Unlimited 50-coin games; users can complete many short games to farm. **Mitigation:** Daily cap on full reward (e.g. first 5–10 games/day at 50, then 10–20) or lower base (e.g. 25).
- **Multiplayer:** Same 50 for all places; no incentive to throw. No placement exploit. Optional: differentiate by rank to reward skill.
- **Missions:** Repeatable missions (e.g. perfect_game, streaks) can be farmed; multipliers already reduce repeat value. **Acceptable** if per-game reward is reduced.
- **Daily reward:** One claim per day; streak resets on miss. **No abuse** beyond normal login.
- **Progressive ads:** Theoretically 2,400/day if watching 5 ads every hour; **unrealistic** but a daily cap would close the loophole.

---

## PART 4: PROPOSED REBALANCING (SUMMARY)

To approach 70/30 without changing code yet:

1. **Single-player**
   - **Current:** 50 coins per game, unlimited.
   - **Proposed:** e.g. **25 coins** per game (or 30), and/or **first 5 games/day at full reward**, then 10 coins per game.  
   - **Reason:** Cuts game-derived income by ~50% (or more with cap) so casual needs 3–6 months and active 45–60 days.

2. **Multiplayer**
   - **Current:** 50 coins per game for everyone.
   - **Proposed:** Same as single (e.g. 25 base) or **25 base + placement bonus** (e.g. 1st +15, 2nd +10, 3rd +5) so average stays similar but rewards skill.

3. **Missions**
   - **Current:** 795 one-time + repeatable with multipliers.
   - **Proposed:** Keep one-time total roughly **600–700** (e.g. reduce some legendary/medium by 10–20%); optionally reduce repeat multipliers by 0.1 across the board.

4. **Daily rewards**
   - **Current:** Week 6+ = 32 coins/day.
   - **Proposed:** **Cap at 16 coins/day** (Week 5 max) or **24 coins/day** so long-term monthly is ~480–720 instead of 960.

5. **Custom slot costs**
   - **Current:** 5,100 total.
   - **Proposed:** **Increase to 7,000–8,000** total (e.g. scale each tier by ~1.35–1.5) so with reduced income, active still unlock in 45–60 days and casual in 6–12 months.

6. **Rewarded ads (progressive)**
   - **Current:** 5/hour, no daily cap.
   - **Proposed:** **Keep as is** or add **daily cap of 10 ads** so max from ads ~100–150/day instead of 2,400.

---

## PART 5: VERIFICATION (WITH NEW BALANCE – ILLUSTRATIVE)

Using **only** the following changes for illustration:
- Single-player: **25 coins/game**, **cap 5 full-reward games/day**, then 10 coins/game.
- Multiplayer: **25 coins/game** (same).
- Daily: **Cap 16 coins/day** (no Week 6+ 32).
- Slots: **7,500 total** cost.
- Missions and ads: **unchanged**.

**Casual (30 min/day, 60 days):**  
3 games/day: 5×25 + (3-5)×10 ≈ 125+0 = 125/day → 7,500; ads ~12.5; daily ~8 avg → 480; missions ~30.  
Total ≈ 7,500 + 750 + 480 + 30 ≈ **8,760**.  
Unlock 7,500 in **~60 days** (125+12.5+8 ≈ 145/day → 52 days). So **~2 months** for casual with cap. To reach 6–12 months, further reduce per-game or raise slot cost (e.g. 10,000+).

**Active (2 hours/day, 60 days):**  
6 single + 2 multi: 5×25 + 1×10 + 2×25 = 125+10+50 = 185/day games; 4 ads ~70; daily 16; missions 795 + 400.  
Total games: 185×60 = 11,100; ads 4,200; daily 960; missions 1,195 → **17,455**.  
Unlock 7,500 in **7,500 / (185+70+16+~20) ≈ 26 days**. So **~26 days** for active. To hit 45–60 days, either lower game rewards further or raise slot cost to ~12,000–15,000.

**Conclusion:** The numbers above are **illustrative**. Exact constants (25 vs 30, 5-game cap, 7,500 vs 10,000 slot cost, daily cap 16 vs 24) should be tuned so that:
- Casual: **6–12 months** to unlock all (or premium).
- Active: **45–60 days** to unlock all.

---

## IMPLEMENTATION CHECKLIST (WHEN APPROVED)

- [ ] `src/backend/utils/constants.ts`: Change `GAME_COMPLETION_COIN_REWARD` (e.g. 50 → 25 or 30).
- [ ] `src/frontend/screens/GameScreen.tsx`: If adding daily cap, add logic to grant full reward only for first N games per day (e.g. from `AsyncStorage` or server); otherwise keep single/multi at new constant.
- [ ] `src/backend/services/dailyRewardService.ts`: Cap `calculateReward` at 16 or 24 (e.g. `Math.min(baseReward, 16)`).
- [ ] `src/backend/services/customSlotUnlockService.ts`: Update `getSlotUnlockCost` tiers so total is 7,000–10,000 (exact numbers to match chosen income).
- [ ] Optional: `src/backend/services/missionDefinitions.ts`: Reduce selected `rewardCoins` and/or `repeatRewardMultiplier` for missions.
- [ ] Optional: `src/backend/utils/coinAdCooldown.ts`: Add daily cap (e.g. max 10 ads per calendar day) if desired.

---

## QUESTIONS FOR CONFIRMATION

1. **Double-reward ad (watch to double game reward):** Should it remain (so 50 → 100 or 25 → 50), or be removed/nerfed to align with 70/30?
2. **Placement-based multiplayer rewards:** Introduce 1st > 2nd > 3rd > 4th, or keep flat for simplicity?
3. **Daily game cap:** Prefer a hard cap (first N games at full reward per day) or a softer curve (e.g. decreasing reward after N games)?
4. **Target total slot cost:** Confirm range (e.g. 7,500 / 10,000 / 12,000) once per-game and daily numbers are agreed.

---

*End of analysis. No code has been modified. Review and confirm before implementing any changes.*

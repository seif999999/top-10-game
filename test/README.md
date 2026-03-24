# Firebase Emulator Load Testing Guide

## Overview

This directory contains load testing scripts to simulate concurrent users and test your app's scalability with Firebase Emulator.

## Quick Start

### Step 1: Start Firebase Emulators

Open a terminal and run:

```bash
npm run emulators:start
```

Or directly:

```bash
firebase emulators:start
```

You should see:
```
✔  firestore: Firestore Emulator running at localhost:8080
✔  auth: Authentication Emulator running at localhost:9099
✔  ui: Emulator UI running at localhost:4000
```

**Keep this terminal open!**

### Step 2: Run Load Test

Open a **new terminal** (keep emulator running) and run:

```bash
# Test with 1000 users (default)
npm run load-test

# Or test with custom user count
npm run load-test:small    # 100 users
npm run load-test:medium   # 500 users
npm run load-test:full     # 1000 users

# Or specify custom count
node test/load-test.js 250
```

## What the Test Does

The load test simulates realistic user behavior:

1. **User Registration/Login** - Creates or signs in users
2. **Profile Creation** - Creates user profiles in Firestore
3. **Room Creation** - Creates multiplayer game rooms
4. **Game Actions** - Simulates answer submissions and score updates
5. **Profile Updates** - Updates user stats and coins

Each user performs ~10-15 Firestore operations (reads + writes).

## Test Results

After running, you'll see:

- ✅ Success count
- ❌ Failure count
- 📈 Success rate percentage
- ⚡ Throughput (users/second)
- ⏱️ Total duration
- ⚠️ Error details (if any)

## Monitoring

### Firebase Emulator UI

Open in browser: **http://localhost:4000**

You can:
- View Firestore data in real-time
- See Authentication users
- Monitor operations
- Check for errors

### What to Look For

✅ **Good Signs:**
- Success rate > 99%
- No errors in console
- Fast response times
- Data consistency in Emulator UI

⚠️ **Warning Signs:**
- Success rate < 95%
- Many "permission denied" errors
- Race conditions (data corruption)
- Slow response times

## Troubleshooting

### "Cannot connect to emulator"

**Solution:** Make sure emulator is running:
```bash
firebase emulators:start
```

### "Port already in use"

**Solution:** Stop other Firebase instances or change ports in `firebase.json`

### "Module not found"

**Solution:** Install dependencies:
```bash
npm install
```

### High failure rate

**Possible causes:**
1. Firestore security rules too restrictive
2. Race conditions in your code
3. Emulator performance limits

**Check:**
- Review `firestore.rules` file
- Check error messages in test output
- Monitor Emulator UI for issues

## Configuration

### Adjust Batch Size

Edit `test/load-test.js`:

```javascript
const BATCH_SIZE = 50; // Change this value
```

Smaller batches = slower but more stable
Larger batches = faster but may overwhelm

### Adjust User Count

```bash
# Command line
node test/load-test.js 2000

# Or edit test/load-test.js
const TOTAL_USERS = 2000;
```

## Phase 2: k6 Load Test (Real Firebase)

Tests **real** Firebase (Auth + Firestore) with the k6 tool. Use a **separate test project** (e.g. op10game-loadtest), not production.

### Prerequisites

- k6 installed: `choco install k6 -y` (run PowerShell as Administrator) or https://k6.io/docs/getting-started/installation/

### Setup

1. Copy `test/k6.env.example` to `test/k6-config.env` (this file is gitignored).
2. Edit `test/k6-config.env` and set:
   - `FIREBASE_API_KEY` — Web API Key from Firebase Console (Project settings → Your apps)
   - `FIREBASE_PROJECT_ID` — e.g. `op10game-loadtest`
   - `K6_TEST_USER_EMAILS` — Comma-separated test user emails (see `k6.env.example`); each k6 VU rotates so heavy runs don’t hammer one account
   - `K6_TEST_USER_PASSWORD` — Shared password for those users (or use a single `K6_TEST_USER_EMAIL` if you don’t set `K6_TEST_USER_EMAILS`)

### Run

```bash
npm run load-test:k6
```

Multiplayer-only (skips the default scenario; ~1 minute):

```bash
npm run load-test:k6:multiplayer
```

Requires **at least two** emails in `K6_TEST_USER_EMAILS` (host + reader). Optional: `K6_MP_ROOM_CODE` (default `k6-mp-stress-room`; each pair uses `…-p0`, `…-p1`, …).

With **`K6_HEAVY=1`**, multiplayer_sync ramps **0→10 VUs over 60s** and needs **10 emails** (5 pairs: `[0,1]`, `[2,3]`, … `[8,9]`). Threshold stays **`multiplayer_roundtrip` p95 &lt; 1500ms**.

You can also pass extra k6 flags: `node test/run-k6.js --multiplayer-only --vus 2`.

Or run k6 directly (set env vars first):

```bash
k6 run test/load-test.k6.js
```

**Auth behavior:** Production Firebase **rate-limits** password sign-in; the script cannot “allow” unlimited parallel logins. By default, **each VU signs in once** and **reuses the ID token** (like a real app), so heavy tests mostly stress **Firestore**, not Auth. Optional env vars in `k6-config.env`:

- `K6_LOGIN_EACH_ITER=1` — sign in every iteration (Auth stress test; expect many failures at high VUs).
- `K6_STAGGER_SIGNIN_SEC=0.05` — before a VU’s **first** sign-in, sleep `(VU−1)×this` seconds to spread the initial sign-in burst (helps if many VUs start at once).

k6 ramps VUs, then each VU keeps reading Firestore. Check Firebase Console → Usage during the run.

---

## Next Steps

After Phase 1 (Emulator Testing):

1. ✅ Fix any bugs or race conditions found
2. ✅ Optimize Firestore queries
3. ✅ Review security rules
4. → **Phase 2**: k6 against a test Firebase project (see above)

## Notes

- **Safe to run:** Everything is local, no production impact
- **No cost:** Emulator is free, no Firebase quotas used
- **Fast iteration:** Test changes quickly without deploying

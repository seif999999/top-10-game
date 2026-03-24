/**
 * Phase 2: k6 load test against real Firebase (Auth + Firestore)
 *
 * Scenarios:
 *   default — existing auth + userProfiles read (token reuse per VU).
 *   multiplayer_sync — host/reader pairs: odd VU = host (PATCH), even VU = reader (GET). Light: 2 VUs ~30s.
 *     K6_HEAVY=1: ramp 0→10 VUs over 60s; requires 10 emails (5 pairs: emails[0,1], [2,3], … [8,9]).
 *
 * Env: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, K6_TEST_USER_PASSWORD, K6_TEST_USER_EMAILS (≥2 light, ≥10 heavy MP)
 * Optional: K6_MP_ROOM_CODE (default k6-mp-stress-room)
 *
 * Run: k6 run test/load-test.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const API_KEY = (__ENV.FIREBASE_API_KEY || '').trim();
const PROJECT_ID = (__ENV.FIREBASE_PROJECT_ID || '').trim();
const TEST_PASSWORD = (__ENV.K6_TEST_USER_PASSWORD || '').trim();

const EMAILS_RAW = __ENV.K6_TEST_USER_EMAILS || __ENV.K6_TEST_USER_EMAIL || '';
const TEST_EMAILS = EMAILS_RAW.split(',')
  .map((e) => e.trim())
  .filter(Boolean);

const HEAVY = __ENV.K6_HEAVY === '1';
/** When set via run-k6.js --multiplayer-only, only run multiplayer_sync (faster CI / local check). */
const MULTIPLAYER_ONLY = __ENV.K6_MULTIPLAYER_ONLY === '1';
const LOGIN_EACH_ITER = __ENV.K6_LOGIN_EACH_ITER === '1';
const STAGGER_PER_VU = parseFloat(__ENV.K6_STAGGER_SIGNIN_SEC || '0') || 0;

const MP_ROOM_CODE = (__ENV.K6_MP_ROOM_CODE || 'k6-mp-stress-room').trim();

/** Round-trip: time from stress timestamp embedded in doc (set at write) until VU2's successful read (ms). */
const multiplayerRoundtrip = new Trend('multiplayer_roundtrip');

// default scenario: per-VU token cache
let cachedToken = null;
let cachedLocalId = null;
let cachedEmail = null;

// multiplayer_sync: VU1 ensures room once; VU2 tracks last seen write
let mpHostRoomReady = false;
let mpReaderLastWrittenAt = 0;

const defaultScenario = {
  executor: 'ramping-vus',
  startTime: '0s',
  stages: HEAVY
    ? [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ]
    : [
        { duration: '15s', target: 2 },
        { duration: '30s', target: 2 },
        { duration: '15s', target: 0 },
      ],
  gracefulRampDown: '30s',
  gracefulStop: '30s',
};

const multiplayerScenario = HEAVY
  ? {
      executor: 'ramping-vus',
      startTime: '0s',
      startVUs: 0,
      stages: [{ duration: '60s', target: 10 }],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      exec: 'multiplayerSync',
    }
  : {
      executor: 'ramping-vus',
      startTime: '0s',
      startVUs: 2,
      stages: [
        { duration: '5s', target: 2 },
        { duration: '25s', target: 2 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      exec: 'multiplayerSync',
    };

export const options = {
  scenarios: MULTIPLAYER_ONLY
    ? { multiplayer_sync: multiplayerScenario }
    : {
        default: defaultScenario,
        multiplayer_sync: multiplayerScenario,
      },
  thresholds: {
    'http_req_failed{name:auth_signin}': ['rate<0.1'],
    http_req_duration: ['p(95)<2000'],
    multiplayer_roundtrip: ['p(95)<1500'],
  },
};

function emailForVu() {
  if (TEST_EMAILS.length === 0) return '';
  const idx = (__VU - 1) % TEST_EMAILS.length;
  return TEST_EMAILS[idx];
}

function signIn(email) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const payload = JSON.stringify({
    email,
    password: TEST_PASSWORD,
    returnSecureToken: true,
  });
  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_signin' },
  });
  const ok = check(res, {
    'auth status 200': (r) => r.status === 200,
  });
  if (!ok && __VU === 1 && __ITER === 0) {
    console.log('[k6] Auth failed. Status:', res.status, 'Body:', res.body ? res.body.slice(0, 500) : '');
  }
  if (!ok) return { idToken: null, localId: null };
  let body;
  try {
    body = JSON.parse(res.body);
  } catch (_) {
    return { idToken: null, localId: null };
  }
  return {
    idToken: body.idToken || null,
    localId: body.localId || body.userId || null,
  };
}

function getFirestoreDocument(idToken, documentPath) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}`;
  return http.get(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    tags: { name: 'firestore_read' },
  });
}

function fv(s) {
  return { stringValue: String(s) };
}
function fi(n) {
  return { integerValue: String(Math.floor(n)) };
}
function fb(b) {
  return { booleanValue: b };
}

/** Minimal multiplayerGames document satisfying validateRoomCreation (host + lobby). */
function buildCreateRoomBody(roomCode, hostUid) {
  const now = Date.now();
  const playersMap = {
    mapValue: {
      fields: {
        [hostUid]: {
          mapValue: {
            fields: {
              id: fv(hostUid),
              name: fv('k6-host'),
              score: fi(0),
              isHost: fb(true),
              joinedAt: fi(now),
              isConnected: fb(true),
              lastSeen: fi(now),
            },
          },
        },
      },
    },
  };
  const scoresMap = {
    mapValue: {
      fields: {
        [hostUid]: fi(0),
      },
    },
  };
  const turnOrder = {
    arrayValue: {
      values: [fv(hostUid)],
    },
  };
  const emptyArr = { arrayValue: { values: [] } };
  const revealed = {
    arrayValue: {
      values: Array(10)
        .fill(null)
        .map(() => ({ nullValue: null })),
    },
  };
  return JSON.stringify({
    fields: {
      roomCode: fv(roomCode),
      hostId: fv(hostUid),
      createdAt: { timestampValue: new Date(now).toISOString() },
      status: fv('lobby'),
      gamePhase: fv('lobby'),
      category: fv('general'),
      questions: emptyArr,
      currentQuestionIndex: fi(0),
      players: playersMap,
      scores: scoresMap,
      turnOrder,
      currentTurnIndex: fi(0),
      currentAnswers: emptyArr,
      revealedAnswers: revealed,
      answersSubmittedCount: fi(0),
      playerSubmissions: { mapValue: { fields: {} } },
      maxPlayers: fi(4),
      isPrivate: fb(false),
      lastActivity: fi(now),
      turnTimeLimit: fi(60),
      questionTimeLimit: fi(60),
    },
  });
}

function multiplayerGameUrl(roomCode) {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/multiplayerGames/${roomCode}`;
}

function createMultiplayerRoom(idToken, roomCode, hostUid) {
  const parent = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/multiplayerGames`;
  const url = `${parent}?documentId=${encodeURIComponent(roomCode)}`;
  const body = buildCreateRoomBody(roomCode, hostUid);
  return http.post(url, body, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'firestore_multiplayer_create' },
  });
}

function patchStressFields(idToken, roomCode, answer, writtenAtMs) {
  const mask = 'updateMask.fieldPaths=k6StressAnswer&updateMask.fieldPaths=k6StressWrittenAt';
  const url = `${multiplayerGameUrl(roomCode)}?${mask}`;
  const body = JSON.stringify({
    fields: {
      k6StressAnswer: fv(answer),
      k6StressWrittenAt: fi(writtenAtMs),
    },
  });
  return http.patch(url, body, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'firestore_multiplayer_patch' },
  });
}

function getMultiplayerRoom(idToken, roomCode) {
  return http.get(multiplayerGameUrl(roomCode), {
    headers: { Authorization: `Bearer ${idToken}` },
    tags: { name: 'firestore_multiplayer_read' },
  });
}

function parseIntegerField(resBody, field) {
  try {
    const o = JSON.parse(resBody);
    const v = o.fields && o.fields[field] && o.fields[field].integerValue;
    return v !== undefined && v !== null ? parseInt(String(v), 10) : null;
  } catch (_) {
    return null;
  }
}

export function multiplayerSync() {
  if (!API_KEY || !PROJECT_ID || !TEST_PASSWORD) {
    if (__ITER === 0) {
      console.error('[k6 multiplayer_sync] Missing FIREBASE_API_KEY, FIREBASE_PROJECT_ID, or K6_TEST_USER_PASSWORD');
    }
    sleep(1);
    return;
  }
  const minEmails = HEAVY ? 10 : 2;
  if (TEST_EMAILS.length < minEmails) {
    if (__ITER === 0) {
      console.error(
        `[k6 multiplayer_sync] Need at least ${minEmails} emails in K6_TEST_USER_EMAILS (pairs: [0,1], [2,3], …)${HEAVY ? ' when K6_HEAVY=1' : ''}`,
      );
    }
    sleep(1);
    return;
  }

  const pairIdx = Math.floor((__VU - 1) / 2);
  const emailHost = TEST_EMAILS[pairIdx * 2];
  const emailReader = TEST_EMAILS[pairIdx * 2 + 1];
  const roomCode = `${MP_ROOM_CODE}-p${pairIdx}`;

  const isHost = __VU % 2 === 1;

  if (isHost) {
    const { idToken, localId } = signIn(emailHost);
    if (!idToken || !localId) {
      sleep(1);
      return;
    }

    if (!mpHostRoomReady) {
      const probe = getMultiplayerRoom(idToken, roomCode);
      if (probe.status === 200) {
        mpHostRoomReady = true;
      } else if (probe.status === 404) {
        const cr = createMultiplayerRoom(idToken, roomCode, localId);
        check(cr, { 'mp create room 200': (r) => r.status === 200 });
        if (cr.status === 200) {
          mpHostRoomReady = true;
        } else if (__ITER === 0) {
          console.log('[k6 multiplayer_sync] create room failed:', cr.status, cr.body ? cr.body.slice(0, 400) : '');
        }
      } else if (__ITER === 0) {
        console.log('[k6 multiplayer_sync] probe room unexpected status:', probe.status);
      }
    }

    const writtenAt = Date.now();
    const answer = `k6-${writtenAt}-${__ITER}-vu${__VU}`;
    const patchRes = patchStressFields(idToken, roomCode, answer, writtenAt);
    check(patchRes, { 'mp patch stress 200': (r) => r.status === 200 });
    if (patchRes.status !== 200 && __ITER === 0) {
      console.log('[k6 multiplayer_sync] PATCH failed:', patchRes.status, patchRes.body ? patchRes.body.slice(0, 400) : '');
    }

    sleep(0.3);
    return;
  }

  // Even VU — reader for this pair
  const { idToken } = signIn(emailReader);
  if (!idToken) {
    sleep(1);
    return;
  }

  const deadline = Date.now() + 30000;
  let seen = false;
  while (Date.now() < deadline) {
    const res = getMultiplayerRoom(idToken, roomCode);
    if (res.status !== 200) {
      sleep(0.05);
      continue;
    }
    const wt = parseIntegerField(res.body, 'k6StressWrittenAt');
    if (wt !== null && wt > mpReaderLastWrittenAt) {
      const readDone = Date.now();
      mpReaderLastWrittenAt = wt;
      multiplayerRoundtrip.add(readDone - wt);
      check(res, { 'mp reader saw new write': () => true });
      seen = true;
      break;
    }
    sleep(0.05);
  }
  if (!seen && __ITER === 0) {
    console.log(`[k6 multiplayer_sync] reader timeout (pair ${pairIdx}, VU ${__VU}) waiting for host write`);
  }

  sleep(0.2);
}

export default function () {
  const email = emailForVu();
  if (!API_KEY || !PROJECT_ID || !email || !TEST_PASSWORD) {
    console.error(
      'Set FIREBASE_API_KEY, FIREBASE_PROJECT_ID, K6_TEST_USER_PASSWORD, and K6_TEST_USER_EMAILS (or K6_TEST_USER_EMAIL)',
    );
    return;
  }

  let idToken;
  let localId;

  if (LOGIN_EACH_ITER) {
    const s = signIn(email);
    idToken = s.idToken;
    localId = s.localId;
  } else {
    const needSignIn = !cachedToken || cachedEmail !== email;
    if (needSignIn) {
      if (STAGGER_PER_VU > 0) {
        sleep((__VU - 1) * STAGGER_PER_VU);
      }
      const s = signIn(email);
      if (s.idToken) {
        cachedToken = s.idToken;
        cachedLocalId = s.localId;
        cachedEmail = email;
      } else {
        cachedToken = null;
        cachedLocalId = null;
        cachedEmail = null;
      }
    } else {
      check(true, { 'auth using cached token': () => true });
    }
    idToken = cachedToken;
    localId = cachedLocalId;
  }

  if (!idToken) {
    sleep(1);
    return;
  }

  const docPath = `userProfiles/${localId}`;
  const readRes = getFirestoreDocument(idToken, docPath);
  const readOk = check(readRes, {
    'firestore read ok': (r) => r.status === 200 || r.status === 404,
  });
  if (!readOk && __VU === 1 && __ITER === 0) {
    console.log('[k6] Firestore read failed. Status:', readRes.status, 'Body:', readRes.body ? readRes.body.slice(0, 400) : '');
  }

  sleep(HEAVY ? 1 : 2);
}

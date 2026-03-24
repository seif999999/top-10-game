/**
 * Loads test/k6-config.env and runs k6 with those env vars.
 * Create k6-config.env from k6.env.example (do not commit k6-config.env).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const envPath = path.join(__dirname, 'k6-config.env');
if (!fs.existsSync(envPath)) {
  console.error('Create test/k6-config.env from test/k6.env.example with your Firebase and test user credentials.');
  process.exit(1);
}

const env = { ...process.env };
const raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
raw.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const i = trimmed.indexOf('=');
  if (i > 0) {
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (key) env[key] = value;
  }
});

const rawArgs = process.argv.slice(2);
const multiplayerOnly = rawArgs.includes('--multiplayer-only');
const extraArgs = rawArgs.filter((a) => a !== '--multiplayer-only');
if (multiplayerOnly) {
  env.K6_MULTIPLAYER_ONLY = '1';
}
const scriptPath = path.join(__dirname, 'load-test.k6.js');
const r = spawnSync('k6', ['run', ...extraArgs, scriptPath], {
  stdio: 'inherit',
  env,
  shell: true,
});
process.exit(r.status !== null ? r.status : 1);
#!/usr/bin/env node
/**
 * Finds translation keys that appear in en/*.json but are never referenced in source code.
 * Searches for t('key'), t("key"), t(`key`), t('ns:key'), and t('key', ...).
 * May have false positives (e.g. dynamic keys like t('page.' + x)).
 * Run: node scripts/find-unused-i18n-keys.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales/en');
const SRC_DIR = path.join(__dirname, '../src');
const NAMESPACES = ['common', 'screens', 'game', 'errors', 'categories', 'components'];

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadAllKeys() {
  const byNs = {};
  for (const ns of NAMESPACES) {
    const filePath = path.join(LOCALES_DIR, `${ns}.json`);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    byNs[ns] = flattenKeys(data);
  }
  return byNs;
}

function collectReferences(dir, refs) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'generated-i18n-keys.ts') continue;
    if (e.isDirectory()) {
      collectReferences(full, refs);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(e.name)) continue;
    const content = fs.readFileSync(full, 'utf8');
    // t('key'), t("key"), t(`key`), t('ns:key'), t("ns:key")
    const re = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = re.exec(content)) !== null) {
      refs.add(m[1]);
    }
  }
}

function main() {
  const byNs = loadAllKeys();
  const refs = new Set();
  collectReferences(SRC_DIR, refs);

  let unusedCount = 0;
  console.log('Potentially unused translation keys (not found as t("...") in src):\n');
  for (const [ns, keys] of Object.entries(byNs)) {
    const unused = keys.filter((k) => {
      const withNs = `${ns}:${k}`;
      return !refs.has(k) && !refs.has(withNs);
    });
    if (unused.length) {
      console.log(`  ${ns}:`);
      unused.forEach((k) => console.log(`    - ${k}`));
      console.log('');
      unusedCount += unused.length;
    }
  }
  if (unusedCount === 0) {
    console.log('  None. All keys are referenced (or use dynamic keys).\n');
  } else {
    console.log(`Total potentially unused: ${unusedCount}`);
    console.log('(Dynamic keys like t(\'prefix.\' + x) are not detected; ignore false positives.)\n');
  }
}

main();

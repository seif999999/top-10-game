#!/usr/bin/env node
/**
 * Finds translation keys that exist in en but are missing in ar (or vice versa).
 * Prints a report; exit code 1 if any missing.
 * Run: node scripts/find-missing-translations.js [--reverse]
 *   --reverse: report keys in ar missing in en (default: report keys in en missing in ar)
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
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

function loadJson(lang, ns) {
  const filePath = path.join(LOCALES_DIR, lang, `${ns}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const reverse = process.argv.includes('--reverse');
const [sourceLang, targetLang] = reverse ? ['ar', 'en'] : ['en', 'ar'];

function main() {
  let missingCount = 0;
  console.log(`Keys in ${sourceLang} missing in ${targetLang}:\n`);
  for (const ns of NAMESPACES) {
    const sourceData = loadJson(sourceLang, ns);
    const targetData = loadJson(targetLang, ns);
    if (!sourceData || !targetData) continue;
    const sourceKeys = new Set(flattenKeys(sourceData));
    const targetKeys = new Set(flattenKeys(targetData));
    const missing = [...sourceKeys].filter((k) => !targetKeys.has(k)).sort();
    if (missing.length) {
      console.log(`  ${ns}:`);
      missing.forEach((k) => console.log(`    - ${k}`));
      console.log('');
      missingCount += missing.length;
    }
  }
  if (missingCount === 0) {
    console.log('  None. All keys are present in both languages.\n');
  } else {
    console.log(`Total missing: ${missingCount}\n`);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node
/**
 * Validates that all translation keys exist in both en and ar for each namespace.
 * Exit code 0 if valid, 1 if mismatches found.
 * Run: node scripts/validate-i18n-keys.js
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
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function main() {
  let hasError = false;
  for (const ns of NAMESPACES) {
    const enData = loadJson('en', ns);
    const arData = loadJson('ar', ns);
    if (!enData) {
      console.warn(`Warning: en/${ns}.json not found, skipping.`);
      continue;
    }
    if (!arData) {
      console.error(`Error: ar/${ns}.json not found (en has ${ns}).`);
      hasError = true;
      continue;
    }
    const enKeys = new Set(flattenKeys(enData));
    const arKeys = new Set(flattenKeys(arData));
    const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
    const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));
    if (missingInAr.length) {
      console.error(`[${ns}] Keys in en but missing in ar: ${missingInAr.join(', ')}`);
      hasError = true;
    }
    if (missingInEn.length) {
      console.error(`[${ns}] Keys in ar but missing in en: ${missingInEn.join(', ')}`);
      hasError = true;
    }
    if (!missingInAr.length && !missingInEn.length) {
      console.log(`[${ns}] OK (${enKeys.size} keys).`);
    }
  }
  process.exit(hasError ? 1 : 0);
}

main();

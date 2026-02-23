/**
 * Safe JSON parsing utilities to mitigate prototype pollution when parsing
 * data from AsyncStorage/localStorage (user-controllable or from external sources).
 *
 * JSON.parse can create objects with __proto__, constructor, prototype keys
 * that could alter Object behavior. We strip these dangerous keys.
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively strip prototype-polluting keys from a parsed object.
 */
function stripDangerousKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripDangerousKeys(item));
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.has(key)) {
      continue; // Skip dangerous keys
    }
    cleaned[key] = stripDangerousKeys(value);
  }
  return cleaned;
}

/**
 * Safely parse JSON with prototype pollution protection.
 * Use for data from AsyncStorage, localStorage, or other untrusted sources.
 *
 * @param text - JSON string to parse
 * @param reviver - Optional reviver function (runs after strip)
 * @returns Parsed object or null on error
 */
export function safeJsonParse<T = unknown>(
  text: string,
  reviver?: (key: string, value: unknown) => unknown
): T | null {
  try {
    const parsed = JSON.parse(text, reviver as (key: string, value: unknown) => unknown) as T;
    const cleaned = stripDangerousKeys(parsed) as T;
    return cleaned;
  } catch {
    return null;
  }
}

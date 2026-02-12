# Translation workflow (i18n)

This doc describes how to add and maintain translations with type safety and how to catch errors early.

---

## 1. Adding a new translation

### 1.1 Add the key in **both** languages

- **English:** `src/locales/en/<namespace>.json`
- **Arabic:** `src/locales/ar/<namespace>.json`

Use the same key structure in both files (nested keys with dots in code, e.g. `"section": { "title": "..." }` → key `section.title`).

**Namespaces:**

| Namespace    | Use for |
|-------------|--------|
| `common`    | Buttons, generic UI (cancel, save, loading, error) |
| `screens`   | Screen-specific copy (home, profile, auth, multiplayer) |
| `game`      | In-game UI (timer, score, actions) |
| `errors`    | Error messages and validation |
| `categories`| Category names (and descriptions) |
| `components`| Reusable component copy (modals, toasts) |

### 1.2 Regenerate TypeScript types

After editing any `en/*.json`:

```bash
npm run i18n:generate-types
```

This updates `src/types/generated-i18n-keys.ts` so that `t('your.new.key')` gets autocomplete and type checking.

### 1.3 Use in code

```tsx
const { t } = useAppTranslation('screens');  // or 'common', 'game', etc.
// ...
<Text>{t('home.welcomeBack', { name: user?.displayName })}</Text>
```

For the **default namespace** (`common`), you can omit the namespace:

```tsx
const { t } = useAppTranslation();
<Button title={t('cancel')} />
```

---

## 2. Type-safe keys and autocomplete

- **Typed `t`:** The `t` returned from `useAppTranslation()` only accepts keys that exist in `generated-i18n-keys.ts`. Use it for static keys to get autocomplete and typos caught by TypeScript.
- **Dynamic keys:** When the key is built at runtime (e.g. `t(\`page.\${errorType}.title\`)`), cast `t` so TypeScript accepts it:

  ```tsx
  const tDynamic = t as (key: string, options?: { defaultValue?: string }) => string;
  const title = tDynamic(`page.${errorType}.title`, { defaultValue: t('page.unknown.title') });
  ```

- **Exported type:** You can use the `TranslationKey` type from `@/hooks/useTranslation` or `@/types/generated-i18n-keys` for function parameters or key lists.

---

## 3. Scripts (run from project root)

| Script | Command | Purpose |
|--------|---------|--------|
| Generate types | `npm run i18n:generate-types` | Regenerate `src/types/generated-i18n-keys.ts` from `en/*.json`. Run after adding/removing keys. |
| Validate keys | `npm run i18n:validate` | Check that every key in `en` exists in `ar` (and vice versa). Exit 1 if mismatch. |
| Missing (en→ar) | `npm run i18n:missing` | List keys present in English but missing in Arabic. |
| Missing (ar→en) | `npm run i18n:missing-reverse` | List keys present in Arabic but missing in English. |
| Unused keys | `npm run i18n:unused` | List keys that appear in `en/*.json` but are never used as `t('...')` in `src`. May have false positives for dynamic keys. |
| Full check | `npm run i18n:check` | Runs generate-types, validate, and typecheck. Use before PRs. |

---

## 4. Catching errors early

1. **TypeScript:** After `npm run i18n:generate-types`, invalid keys in `t('...')` will be reported by `tsc`. Run `npm run typecheck` (or `npm run i18n:check`).
2. **Missing translations:** Run `npm run i18n:validate` (or `i18n:missing`) so both languages stay in sync.
3. **Unused keys:** Run `npm run i18n:unused` periodically to remove dead keys (and fix false positives for dynamic keys).
4. **CI:** Add `npm run i18n:check` to your CI pipeline to enforce types and key parity.

---

## 5. ESLint and code style

- User-visible strings should go through `t()` from `useAppTranslation(...)`.
- Prefer the typed `t` for static keys so invalid keys are caught by TypeScript.
- For dynamic keys, use a cast of `t` (see section 2). A short comment (`// dynamic key`) is optional.

There is no ESLint rule that forbids literal strings in JSX; the type-safe `t()` and the scripts above are the main safeguards.

---

## 6. VS Code snippets

In `.vscode/i18n.code-snippets`:

- **useT** – `const { t, isRTL } = useAppTranslation();`
- **useTns** – `const { t } = useAppTranslation('common');`
- **useT2** – Two namespaces (e.g. common + screens)
- **tkey** – `t('key')`
- **tkeyopt** – `t('key', { key: value })`
- **txt** – `<Text>{t('key')}</Text>`
- **tdynamic** – Cast for dynamic key: `(t as (key: string, ...) => string)(...)`

Use the prefix (e.g. `useT`) and Tab to insert.

---

## 7. File reference

| Path | Purpose |
|------|--------|
| `src/locales/en/*.json` | English source of truth; used for type generation. |
| `src/locales/ar/*.json` | Arabic translations; same key set as en. |
| `src/locales/index.ts` | Exports `resources`, `namespaces`, `supportedLanguages`. |
| `src/types/generated-i18n-keys.ts` | **Generated.** Union types for translation keys. |
| `src/types/i18next.d.ts` | Augments i18next for typed resources. |
| `src/hooks/useTranslation.ts` | `useAppTranslation(ns?)`, returns typed `t`, `isRTL`, etc. |
| `src/config/i18n.ts` | i18next init, RTL, language change. |
| `scripts/generate-i18n-types.js` | Generates `generated-i18n-keys.ts`. |
| `scripts/validate-i18n-keys.js` | Validates en/ar key parity. |
| `scripts/find-missing-translations.js` | Reports missing keys. |
| `scripts/find-unused-i18n-keys.js` | Reports potentially unused keys. |

---

## 8. Quick checklist for new copy

1. Add the key to the right namespace in **both** `en` and `ar` JSON files.
2. Run `npm run i18n:generate-types`.
3. Use `t('your.key')` (or with interpolation) in the component; prefer `useAppTranslation('namespace')` for that namespace.
4. Run `npm run i18n:validate` and `npm run typecheck` before committing.

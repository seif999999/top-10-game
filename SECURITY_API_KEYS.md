# Securing Google / Firebase API Keys

Google Cloud may alert you that an API key for project **top10-game** is publicly accessible. Follow these steps to fix and prevent this.

## 1. Do not commit keys to git

- **`google-services.json`** (Android) and **`GoogleService-Info.plist`** (iOS) contain API keys and are now in `.gitignore`. Keep them only on your machine or in EAS secrets; never commit them.
- Use **environment variables** for Firebase in the app (e.g. `EXPO_PUBLIC_FIREBASE_API_KEY` in `.env`). The app already reads from `.env` via `app.config.js` and `src/backend/services/firebase.ts`.

## 2. Regenerate exposed keys (recommended)

Because the keys may have been exposed in a repo or build:

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select project **top10-game**.
2. Go to **APIs & Services** → **Credentials**.
3. Find the API key that was flagged and either:
   - **Regenerate** it (create a new key, then delete the old one), or
   - **Restrict** it (see below) if you prefer not to rotate.
4. In **Firebase Console** → Project Settings → General, update the Web API key / config if you regenerated it, and ensure `google-services.json` / `GoogleService-Info.plist` are only in local or secure storage (not in git).
5. Put the **new** key only in `.env` as `EXPO_PUBLIC_FIREBASE_API_KEY` (and any other Firebase vars you use). Do not put the new key into committed files.

## 3. Restrict the key in Google Cloud

1. In **APIs & Services** → **Credentials** → open your API key.
2. Under **Application restrictions**:
   - For **Android**: add your app’s package name (e.g. `com.top10game.app`) and your signing SHA-1.
   - For **iOS**: add your app’s bundle ID (e.g. `com.top10game.app`).
   - For **Web**: you can restrict by HTTP referrer if you have a web app.
3. Under **API restrictions**, restrict the key to only the APIs you need (e.g. Firebase / Identity Toolkit, etc.).

This limits use of the key to your app(s) and reduces abuse if it is ever exposed.

## 4. Remove keys from the repo (already done in code)

- `google-services.json` and `GoogleService-Info.plist` are in `.gitignore` and have been removed from git tracking so they are no longer in the latest commit.
- If these files were ever pushed, assume those keys are compromised and **regenerate** them as in step 2.

## 5. EAS / Expo builds

For EAS Build, provide Firebase/Google config via:

- **EAS Secrets** (e.g. `EXPO_PUBLIC_FIREBASE_API_KEY`), or
- Uploading `google-services.json` / `GoogleService-Info.plist` in the EAS project dashboard (they are not stored in git).

Never commit production API keys or service account keys to the repository.

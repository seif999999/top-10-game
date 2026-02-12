# Install AdMob Packages

Terminal commands to install and verify the packages required for AdMob (rewarded, interstitial, and banner ads) and related Expo config in the Top 10 Game project.

---

## 1. Install EAS CLI (optional, for cloud builds)

To build development/preview/production builds with EAS (required for AdMob, since Expo Go does not support native AdMob):

```bash
npm install -g eas-cli
```

---

## 2. Install project dependencies

From the **project root**:

```bash
npm install
```

This installs everything in `package.json`, including:

- **react-native-google-mobile-ads** – AdMob SDK (rewarded, interstitial, banner)
- **expo-build-properties** – native build config (e.g. iOS `useFrameworks: 'static'` for AdMob)
- **expo-tracking-transparency** – iOS App Tracking Transparency (ATT) for ad consent

---

## 3. Add packages manually (if not in package.json)

If any of these are missing, add them:

```bash
npx expo install react-native-google-mobile-ads expo-build-properties expo-tracking-transparency
```

Or with npm:

```bash
npm install react-native-google-mobile-ads expo-build-properties expo-tracking-transparency
```

---

## 4. Verify installation

Check that the packages are listed:

```bash
npm ls react-native-google-mobile-ads expo-build-properties expo-tracking-transparency
```

You should see all three with no `UNMET DEPENDENCY` errors.

---

## 5. Environment variables (for AdMob app/unit IDs)

Create or edit `.env` in the project root (and add `.env` to `.gitignore` if it isn’t already). Example:

```env
# AdMob App IDs (from AdMob console)
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxx~zzzzzzzzzz

# Optional: banner / rewarded / interstitial unit IDs (if not using test IDs in dev)
# EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID=...
# EXPO_PUBLIC_ADMOB_IOS_BANNER_ID=...
# etc.

# Optional: iOS tracking permission message (expo-tracking-transparency)
EXPO_PUBLIC_TRACKING_PERMISSION_MESSAGE=This identifier will be used to deliver personalized ads to you.
```

Replace with your real AdMob app IDs for production. In `__DEV__`, the app can use test IDs and may not require these for basic testing.

---

## 6. Rebuild native app after adding packages

After adding or changing native modules (including AdMob or Expo config plugins), you must create a new native build. With EAS:

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Or, for local native builds:

```bash
npx expo prebuild --clean
npx expo run:android
# or
npx expo run:ios
```

---

## Summary

| Command | Purpose |
|--------|--------|
| `npm install -g eas-cli` | Install EAS CLI for cloud builds |
| `npm install` | Install all project dependencies |
| `npx expo install react-native-google-mobile-ads expo-build-properties expo-tracking-transparency` | Add AdMob-related packages if missing |
| `npm ls react-native-google-mobile-ads expo-build-properties expo-tracking-transparency` | Verify packages are installed |
| `eas build --profile development --platform android` | Build Android dev APK (after config) |

For full build and install steps, see **ADMOB_BUILD_GUIDE.md**.

# AdMob Build Guide (EAS)

Step-by-step instructions to build the Top 10 Game app with **react-native-google-mobile-ads**, **expo-build-properties**, and **expo-tracking-transparency**. These native modules require a **development build**; Expo Go does not support them.

---

## Prerequisites

- **Node.js** (v18+ recommended) and **npm**
- **Expo account** – [expo.dev](https://expo.dev) signup
- **EAS CLI** – install globally:
  ```bash
  npm install -g eas-cli
  ```
- **Android:** For device/emulator installs, no paid account needed for internal builds.
- **iOS device:** Apple Developer Program ($99/year) required for real-device builds. Simulator builds do not require it.

---

## Building

### 1. Log in to EAS

```bash
eas login
```

Use your Expo account email and password.

### 2. Configure the project (first time only)

From the project root:

```bash
eas build:configure
```

This creates or updates `eas.json`. The repo includes a pre-configured `eas.json` with the profiles below.

### 3. Build profiles (eas.json)

| Profile                  | Use case                          | Android output | iOS                    |
|--------------------------|------------------------------------|----------------|------------------------|
| `development`            | Dev client, internal testing      | APK            | Device build           |
| `development-simulator`  | iOS Simulator only                | —              | Simulator build        |
| `preview`                | Internal testers (no dev tools)   | APK            | Device                 |
| `production`             | App Store / Play Store release    | AAB            | Store build            |

### 4. Run builds

**Android – development (APK, internal):**

```bash
eas build --profile development --platform android
```

**iOS – Simulator (no Apple Developer account required):**

```bash
eas build --profile development-simulator --platform ios
```

**iOS – Device (requires Apple Developer $99/year):**

```bash
eas build --profile development --platform ios
```

**Preview (internal testers):**

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

**Production (store release):**

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

### 5. Wait for the build

- Builds usually take **15–20 minutes** (first build can be longer).
- Progress: [expo.dev](https://expo.dev) → your project → Builds.
- You’ll get a link to the build page and an email when it finishes.

---

## Installing

### Android

- Open the build page and **download the APK** (development/preview) or use the install link.
- On a device: enable “Install from unknown sources” if needed, then open the APK to install.
- On an emulator: drag the APK onto the emulator window or run `adb install path/to.app.apk`.

### iOS Simulator

- Download the **.tar.gz** (or build artifact) from the EAS build page.
- Extract and drag the `.app` bundle into the Simulator window, or install via the EAS build page instructions.

### iOS Device

- **Internal distribution:** Scan the QR code from the build page or open the install link on the device (same Apple ID as in EAS).
- **TestFlight:** Use a production (or store) build and submit with `eas submit`, then install via TestFlight.

---

## Testing ads

- **Test ads:** In `__DEV__` the app uses **TestIds** from `react-native-google-mobile-ads` (e.g. rewarded, interstitial, banner). You do not need to change code for test ads.
- **Production ads:** Build with the **production** profile and ensure `.env` (or EAS secrets) has your real AdMob app and unit IDs. Do not use test IDs in production builds.

---

## Troubleshooting

### "AdMob SDK not initialized"

- Confirm **app.config.js** (or app.json) includes the `react-native-google-mobile-ads` plugin with your AdMob app IDs (or env vars):
  - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
  - `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
- Rebuild the native app after changing plugin config (config changes require a new build).

### "Ad failed to load"

- Check device/simulator has **internet**.
- Confirm **AdMob account** is active and ad units are created and approved.
- In development, ensure you’re using **test IDs** in `__DEV__` (see your ad components).
- On iOS, ensure **ATT (App Tracking Transparency)** is requested if required; `expo-tracking-transparency` should be in `plugins` in app.config.js.

### Build failures

- **eas.json:** Check profile names and options (e.g. `developmentClient`, `distribution`, `android.buildType`, `ios.simulator`).
- **package.json:** Ensure dependencies are installed:
  - `react-native-google-mobile-ads`
  - `expo-build-properties`
  - `expo-tracking-transparency`
- Run `npm install` and try again. If native code changed, clear caches and rebuild:
  ```bash
  npx expo prebuild --clean
  eas build --profile development --platform android
  ```
- Inspect the **full build log** on the EAS build page for native/plugin errors.

### iOS tracking permission

- **expo-tracking-transparency** must be in the `plugins` array in **app.config.js**.
- Set a user-facing message, e.g. via `EXPO_PUBLIC_TRACKING_PERMISSION_MESSAGE` or in the plugin config.
- Info.plist will contain `NSUserTrackingUsageDescription`; request the permission in app (e.g. in AdConsentService) before loading personalized ads if needed.

### Android: “useFrameworks: static”

- **expo-build-properties** with `ios.useFrameworks: 'static'` is required for `react-native-google-mobile-ads` on iOS. This is already set in the project’s app.config.js.

---

## Important notes

- **Expo Go does NOT support AdMob** (or other custom native modules). You must use a **development build** or a preview/production build.
- Builds take **15–20 minutes**; the first build can take longer. Be patient.
- **Test on real devices** when possible; ads and ATT behave more reliably on device than in simulators.
- For **store submission**, use the **production** profile and follow EAS Submit docs (credentials, App Store Connect, Play Console).

---

## Timeline (typical)

| Step      | Duration   |
|-----------|------------|
| Build     | 15–20 min  |
| Download & install | 2–5 min |
| **Total per platform** | **~25 min** |

---

For installing the AdMob-related npm packages, see **INSTALL_ADMOB_PACKAGES.md**.

# Phase 3: Create Development Build

Create a custom build with AdMob native code. Expo Go does not support AdMob.

---

## ✅ Step 1: EAS CLI (Done)

EAS CLI is installed globally. Verify with:

```bash
eas --version
```

---

## Step 2: Login to EAS

```bash
eas login
```

- Use your **Expo account** (create one at [expo.dev](https://expo.dev) if needed)
- This is **one-time** per machine

---

## Step 3: Initialize EAS in Your Project

Your project already has `eas.json`. Run this to ensure the project is linked to your Expo account:

```bash
cd c:\Users\smnam\OneDrive\Desktop\Top10Game
eas init
```

- If prompted to create a new project, choose **"Link to existing project"** if you have one
- Or create a new project on Expo's servers
- Accept default settings

---

## Step 4: Set AdMob Environment Variables (Optional for first build)

For AdMob to work, your **AdMob App ID** must be available during the build. Two options:

### Option A: EAS Secrets (recommended for production)

```bash
eas secret:create --name EXPO_PUBLIC_ADMOB_ANDROID_APP_ID --value "ca-app-pub-xxxxxxxx~yyyyyyyy"
eas secret:create --name EXPO_PUBLIC_ADMOB_IOS_APP_ID --value "ca-app-pub-xxxxxxxx~zzzzzzzz"
```

Replace with your real AdMob App IDs from [AdMob Console](https://admob.google.com).

### Option B: Skip for first test build

- The build will work with **empty** Ad IDs
- Ads will show **test ads** in development mode
- You can add real IDs later and rebuild

---

## Step 5: Build for Android

```bash
eas build --profile development --platform android
```

**What happens:**
1. Your code is uploaded to Expo's build servers
2. A custom APK is built with AdMob native code
3. Takes **15–20 minutes**
4. You get a **download link** when ready

---

## Step 6: Download & Install

1. **Click the download link** from the build page or email
2. **Transfer APK** to your Android device (USB, cloud, or scan QR)
3. **Install** – you may need to enable "Install from unknown sources" in Android settings
4. **Run the app** – it's a development client, so you can still use `npx expo start` and connect to it for live reload

---

## Quick Reference Commands

| Step        | Command                                               |
|-------------|-------------------------------------------------------|
| Login       | `eas login`                                           |
| Init/Link   | `eas init`                                            |
| Build       | `eas build --profile development --platform android`  |
| Check builds| Go to [expo.dev](https://expo.dev) → your project → Builds |

---

## Troubleshooting

**"Project not configured"**  
Run `eas init` and link/create your project.

**"Not logged in"**  
Run `eas login`.

**"AdMob SDK not initialized"**  
Set `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` via `eas secret:create` and rebuild.

**Build fails**  
Check the full log on the EAS build page. Common fixes:
- `npm install` in project root
- Ensure `react-native-google-mobile-ads` is in package.json

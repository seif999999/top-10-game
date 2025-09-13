# Google OAuth Setup Guide for Top10Game

## 🚨 **CRITICAL: Fix OAuth 2.0 Policy Error**

The error "This app doesn't comply with Google's OAuth 2.0 policy" occurs because your Google Cloud Console OAuth configuration is incomplete or incorrect.

## 📋 **Step-by-Step Google Cloud Console Setup**

### **1. Go to Google Cloud Console**
- Visit: https://console.cloud.google.com/
- Select your project: `top10-game-f9219` (or create a new one)

### **2. Configure OAuth Consent Screen**
Go to: **APIs & Services → OAuth consent screen**

#### **User Type Selection:**
- ✅ **Select "External"** (for testing with any Google account)
- Click **"Create"**

#### **App Information:**
- **App name**: `Top10Game`
- **User support email**: `your-email@gmail.com`
- **App logo**: (Optional - upload a logo)
- **App domain**: Leave blank for now
- **Developer contact information**: `your-email@gmail.com`

#### **Scopes:**
Click **"Add or Remove Scopes"** and add:
- ✅ `../auth/userinfo.email`
- ✅ `../auth/userinfo.profile`
- ✅ `openid`

#### **Test Users (Important for External apps):**
- Click **"Add Users"**
- Add your email address: `your-email@gmail.com`
- Add any other test emails you want to use

### **3. Create OAuth 2.0 Client IDs**
Go to: **APIs & Services → Credentials**

#### **Create Web Application Client:**
1. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `Web application`
3. **Name**: `Top10Game Web Client`
4. **Authorized redirect URIs** - Add these EXACT URIs:
   ```
   https://auth.expo.io/@anonymous/top10game
   https://auth.expo.io/@your-username/top10game
   http://localhost:19006
   http://localhost:8081
   ```
5. Click **"Create"**
6. **Copy the Client ID** - this is your `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### **Create Android Application Client:**
1. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `Android`
3. **Name**: `Top10Game Android Client`
4. **Package name**: `com.top10game.app`
5. **SHA-1 certificate fingerprint**: 
   - For development: `DF:6E:9C:74:0C:1A:8F:15:CB:8D:10:08:07:3C:4A:3C:2D:4B:19:2F`
   - (This is Expo's debug certificate)
6. Click **"Create"**
7. **Copy the Client ID** - this is your `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

#### **Create iOS Application Client:**
1. Click **"+ CREATE CREDENTIALS"** → **"OAuth 2.0 Client ID"**
2. **Application type**: `iOS`
3. **Name**: `Top10Game iOS Client`
4. **Bundle ID**: `com.top10game.app`
5. Click **"Create"**
6. **Copy the Client ID** - this is your `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

### **4. Update Your Environment Variables**

Create a `.env` file in your project root:

```env
# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here.apps.googleusercontent.com
```

### **5. Enable Required APIs**
Go to: **APIs & Services → Library**

Enable these APIs:
- ✅ **Google+ API** (if available)
- ✅ **Google Identity API**
- ✅ **People API**

## 🔧 **Important Configuration Notes**

### **Redirect URI Format:**
- **Development**: `https://auth.expo.io/@anonymous/top10game`
- **Production**: `https://auth.expo.io/@your-username/top10game`
- **Local Web**: `http://localhost:19006` or `http://localhost:8081`

### **OAuth Consent Screen Status:**
- **Testing**: App will be in "Testing" mode
- **Publishing**: Submit for verification when ready for production
- **Users**: Only test users can sign in during testing phase

### **Client ID Usage:**
- **Web Client ID**: Used for web platform and as fallback
- **Android Client ID**: Used for Android platform
- **iOS Client ID**: Used for iOS platform

## 🧪 **Testing Your Setup**

1. **Update your `.env` file** with the correct client IDs
2. **Restart your Expo development server**:
   ```bash
   npx expo start --clear
   ```
3. **Test Google Sign-In** on your device
4. **Check the logs** for any remaining errors

## 🚨 **Common Issues & Solutions**

### **Error: "invalid_request"**
- ✅ **Solution**: Check that redirect URIs match exactly
- ✅ **Solution**: Ensure OAuth consent screen is properly configured

### **Error: "access_denied"**
- ✅ **Solution**: Add your email to test users in OAuth consent screen
- ✅ **Solution**: Ensure app is in "Testing" mode, not "In production"

### **Error: "redirect_uri_mismatch"**
- ✅ **Solution**: Verify redirect URIs in Google Cloud Console match your app config
- ✅ **Solution**: Use the exact Expo format: `https://auth.expo.io/@anonymous/top10game`

### **Error: "unauthorized_client"**
- ✅ **Solution**: Use the correct client ID for your platform (Android/iOS/Web)
- ✅ **Solution**: Ensure the client ID is properly set in environment variables

## ✅ **Verification Checklist**

- [ ] OAuth consent screen configured with "External" user type
- [ ] App name, support email, and scopes set
- [ ] Test users added to OAuth consent screen
- [ ] Web client created with correct redirect URIs
- [ ] Android client created with correct package name and SHA-1
- [ ] iOS client created with correct bundle ID
- [ ] Environment variables updated with real client IDs
- [ ] Required APIs enabled
- [ ] App restarted after configuration changes

## 🎯 **Expected Result**

After completing this setup, Google Sign-In should work without the "OAuth 2.0 policy" error, and users should be able to authenticate successfully.

---

**Need Help?** If you encounter issues, check the browser console and Expo logs for specific error messages, then refer to the troubleshooting section above.

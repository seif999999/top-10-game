# 🚀 Google Sign-In Quick Setup Guide

## ⚡ Quick Start (5 minutes)

### 1. Get Google Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

### 2. Create Platform Credentials

#### Web Application
- **Application type**: Web application
- **Name**: "TOP 10 Game Web"
- **Authorized JavaScript origins**: 
  - `http://localhost:8081` (development)
  - `https://yourdomain.com` (production)
- **Authorized redirect URIs**:
  - `http://localhost:8081/auth`
  - `https://yourdomain.com/auth`

#### iOS Application
- **Application type**: iOS
- **Name**: "TOP 10 Game iOS"
- **Bundle ID**: `com.top10game.app`

#### Android Application
- **Application type**: Android
- **Name**: "TOP 10 Game Android"
- **Package name**: `com.top10game.app`

### 3. Update Environment Variables
1. Copy `env.example` to `.env`
2. Fill in your credentials:

```bash
# Copy this file
cp env.example .env

# Edit .env with your actual credentials
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ghijkl.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-mnopqr.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_secret_here
```

### 4. Test the Setup
1. Restart your development server: `npm start`
2. Open the app and go to Login screen
3. Tap "Show Google Sign-In Setup" to verify configuration
4. Try signing in with Google

## 🔧 Troubleshooting

### Common Issues

**"Invalid client" error**
- ✅ Check your client IDs in `.env`
- ✅ Verify OAuth consent screen is configured
- ✅ Ensure APIs are enabled

**"Redirect URI mismatch" error**
- ✅ Check redirect URIs in Google Cloud Console
- ✅ Verify app scheme is `top10game`
- ✅ Restart development server after config changes

**"Access blocked" error**
- ✅ Add your email to test users in OAuth consent screen
- ✅ Check OAuth consent screen status

### Debug Steps
1. Check console logs for detailed error messages
2. Use the "Show Google Sign-In Setup" button to verify config
3. Ensure all environment variables are set correctly
4. Verify platform-specific client IDs match your platform

## 📱 Platform-Specific Notes

### Web
- Works with standard OAuth flow
- Redirect URIs must match exactly
- Test with `http://localhost:8081`

### iOS
- Requires proper bundle identifier
- Test on physical device (simulator has limitations)
- Ensure `GoogleService-Info.plist` is in project root

### Android
- Requires proper package name
- Test on physical device
- Ensure `google-services.json` is in project root

## 🎯 Next Steps

1. ✅ Test Google Sign-In on all platforms
2. ✅ Implement proper error handling
3. ✅ Add loading states and user feedback
4. ✅ Consider implementing sign-out functionality
5. ✅ Add user profile management

## 📚 Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

**Need help?** Check the detailed `GOOGLE_SIGNIN_SETUP.md` for comprehensive instructions.

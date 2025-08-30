# 🔐 Google Sign-In Setup Guide

This guide will help you set up Google Sign-In for your TOP 10 Game app.

## 📋 Prerequisites

- Google Cloud Console account
- Firebase project with Authentication enabled
- Expo/React Native project

## 🚀 Step 1: Google Cloud Console Setup

### 1.1 Create a New Project or Select Existing
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "TOP 10 Game"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
5. Add test users (your email addresses)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Create credentials for each platform:

#### Web Application
- Application type: Web application
- Name: "TOP 10 Game Web"
- Authorized JavaScript origins: 
  - `http://localhost:8081` (for development)
  - `https://yourdomain.com` (for production)
- Authorized redirect URIs:
  - `http://localhost:8081/auth`
  - `https://yourdomain.com/auth`

#### iOS Application
- Application type: iOS
- Name: "TOP 10 Game iOS"
- Bundle ID: Your iOS bundle identifier

#### Android Application
- Application type: Android
- Name: "TOP 10 Game Android"
- Package name: Your Android package name
- SHA-1 certificate fingerprint: Your app's SHA-1

## 🔧 Step 2: Update Configuration

### 2.1 Update Google Config
Open `src/config/google.ts` and replace the placeholder values:

```typescript
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  CLIENT_SECRET: 'YOUR_CLIENT_SECRET',
  REDIRECT_URI_SCHEME: 'top10game',
  // ... rest of config
};
```

### 2.2 Update App Configuration

#### For Expo (app.json)
```json
{
  "expo": {
    "scheme": "top10game",
    "android": {
      "package": "com.yourcompany.top10game",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.top10game",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

#### For Firebase
1. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
2. Place them in your project root
3. Follow Firebase setup instructions for each platform

## 🎯 Step 3: Usage

### 3.1 Add Google Sign-In Button
```tsx
import GoogleSignInButton from '../components/GoogleSignInButton';

// In your login screen
<GoogleSignInButton
  onSuccess={() => {
    // Handle successful sign-in
    navigation.navigate('Home');
  }}
  onError={(error) => {
    // Handle sign-in error
    Alert.alert('Error', error);
  }}
/>
```

### 3.2 Handle Authentication State
```tsx
import { useAuth } from '../contexts/AuthContext';

const { user, signInWithGoogle } = useAuth();

// The user object will automatically update when signed in
if (user) {
  // User is signed in
  console.log('User:', user.displayName, user.email);
}
```

## 🔒 Step 4: Security Considerations

### 4.1 Client Secret
- Never expose your client secret in client-side code
- For production, implement server-side token exchange
- Consider using Firebase Auth with Google provider instead

### 4.2 Token Validation
- Always validate ID tokens on your backend
- Check token expiration and signature
- Implement proper error handling

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Check your client ID and secret
   - Verify OAuth consent screen is configured
   - Ensure APIs are enabled

2. **"Redirect URI mismatch" error**
   - Check redirect URIs in Google Cloud Console
   - Verify app scheme configuration
   - Test with correct development URLs

3. **"Access blocked" error**
   - Add your email to test users
   - Check OAuth consent screen status
   - Verify app verification status

### Debug Tips

1. Enable verbose logging in development
2. Check network requests in browser dev tools
3. Verify Firebase configuration
4. Test with different platforms

## 📱 Platform-Specific Notes

### Web
- Works with standard OAuth flow
- Redirect URIs must match exactly
- Consider using Firebase Auth for web

### iOS
- Requires proper bundle identifier
- May need additional configuration for App Store
- Test on physical device

### Android
- Requires SHA-1 fingerprint
- Package name must match exactly
- Test on physical device

## 🎉 Next Steps

1. Test Google Sign-In on all platforms
2. Implement proper error handling
3. Add loading states and user feedback
4. Consider implementing sign-out functionality
5. Add user profile management
6. Implement proper security measures

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)

---

**Note**: This implementation uses Expo's AuthSession for cross-platform compatibility. For production apps, consider using Firebase Auth with Google provider for better security and ease of use.

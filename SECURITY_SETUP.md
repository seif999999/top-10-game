# 🔒 Security Setup Guide

## ⚠️ CRITICAL: API Keys and Credentials

**NEVER commit real API keys, client secrets, or Firebase credentials to version control!**

## 🚨 Immediate Actions Required

1. **Revoke the exposed Firebase API key** in your Firebase Console
2. **Generate a new API key** for your project
3. **Check your Google Cloud Console** for any exposed OAuth credentials
4. **Review your GitHub repository** for any other exposed secrets

## 🔐 Firebase Configuration

### 1. Create app.config.js (DO NOT COMMIT THIS FILE)

Copy `app.config.template.js` to `app.config.js` and fill in your real Firebase credentials:

```bash
cp app.config.template.js app.config.js
```

### 2. Fill in your Firebase credentials in app.config.js:

```javascript
firebase: {
  apiKey: 'your-actual-api-key-here',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
  measurementId: 'your-measurement-id'
}
```

### 3. Verify .gitignore includes:

```
# Firebase configuration (contains sensitive API keys)
app.config.js
```

## 🔑 Google Sign-In Configuration

### 1. Update src/config/google.ts with your real credentials:

```typescript
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: 'your-web-client-id.apps.googleusercontent.com',
  IOS_CLIENT_ID: 'your-ios-client-id.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: 'your-android-client-id.apps.googleusercontent.com',
  CLIENT_SECRET: 'your-client-secret'
};
```

### 2. Never commit the real credentials to version control!

## 🛡️ Security Best Practices

1. **Environment Variables**: Use `.env` files for local development (already in .gitignore)
2. **Template Files**: Always provide template files with placeholder values
3. **Documentation**: Document the setup process without exposing real credentials
4. **Regular Audits**: Regularly check your repository for exposed secrets
5. **Access Control**: Limit access to your Firebase and Google Cloud projects

## 🔍 How to Check for Exposed Secrets

1. **GitHub Secret Scanning**: GitHub automatically scans for common secret patterns
2. **Manual Review**: Search your codebase for:
   - `AIzaSy` (Firebase API keys)
   - `GOCSPX` (Google OAuth client secrets)
   - `.googleusercontent.com` (Google OAuth client IDs)
   - `firebaseapp.com` (Firebase domains)

## 🚀 Development Workflow

1. **Local Development**: Use `app.config.js` with real credentials
2. **Staging/Production**: Use environment variables or secure configuration management
3. **Version Control**: Only commit template files and documentation

## 📞 Emergency Contacts

If you discover exposed secrets:

1. **Immediately revoke** the exposed credentials
2. **Generate new credentials**
3. **Update your application**
4. **Review your security practices**

## ✅ Security Checklist

- [ ] Firebase API key is not committed to version control
- [ ] Google OAuth credentials are not committed to version control
- [ ] app.config.js is in .gitignore
- [ ] Template files are provided for setup
- [ ] Documentation explains secure setup process
- [ ] No real credentials in any committed files
- [ ] Regular security audits are performed

---

**Remember: Security is everyone's responsibility. When in doubt, don't commit it!**

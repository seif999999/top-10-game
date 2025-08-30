// Expo app configuration template for Firebase
// Copy this file to app.config.js and fill in your Firebase credentials
// IMPORTANT: Never commit app.config.js to version control!

module.exports = () => ({
  expo: {
    name: 'Top10Game',
    slug: 'top10game',
    scheme: 'top10game',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android', 'web'],
    assetBundlePatterns: ['**/*'],
    extra: {
      firebase: {
        apiKey: 'YOUR_FIREBASE_API_KEY',
        authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
        projectId: 'YOUR_FIREBASE_PROJECT_ID',
        storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
        messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
        appId: 'YOUR_FIREBASE_APP_ID',
        measurementId: 'YOUR_FIREBASE_MEASUREMENT_ID'
      }
    }
  }
});

// Expo app configuration with Firebase env wiring
// Populate values from process.env; provide empty defaults for .env.example

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
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
      }
    }
  }
});



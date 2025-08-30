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
    
    // Deep linking configuration for Google Sign-In
    plugins: [
      
    ],
    
    // Platform-specific configurations
    ios: {
      bundleIdentifier: 'com.top10game.app',
      googleServicesFile: './GoogleService-Info.plist',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'Google Sign-In',
            CFBundleURLSchemes: ['top10game']
          }
        ]
      }
    },
    
    android: {
      package: 'com.top10game.app',
      googleServicesFile: './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'top10game'
            }
          ],
          category: ['BROWSABLE', 'DEFAULT']
        }
      ]
    },
    
    // Web configuration
    web: {
      bundler: 'metro'
    },
    
    extra: {
      firebase: {
        apiKey: 'AIzaSyAu096CybNo1NMFCHVLi1PtPfy4cXgpTgQ',
        authDomain: 'top10-game-f9219.firebaseapp.com',
        projectId: 'top10-game-f9219',
        storageBucket: 'top10-game-f9219.firebasestorage.app',
        messagingSenderId: '807249280703',
        appId: '1:807249280703:web:3706f3bbf0029ef43d500a',
        measurementId: 'G-NCGRYEPFKZ'
      }
    }
  }
});



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
      // Note: googleServicesFile removed - use EAS secrets or environment-based config
      // For production, add: googleServicesFile: './GoogleService-Info.plist'
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'Google Sign-In',
            CFBundleURLSchemes: ['top10game']
          }
        ],
        // Security configurations
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSExceptionDomains: {
            'firebaseapp.com': {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionMinimumTLSVersion: 'TLSv1.2',
              NSIncludesSubdomains: true
            },
            'googleapis.com': {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionMinimumTLSVersion: 'TLSv1.2',
              NSIncludesSubdomains: true
            }
          }
        },
        // Prevent screenshots in sensitive areas
        UIApplicationSupportsIndirectInputEvents: true,
        // Disable debug information in production
        UIDeviceFamily: [1, 2],
        // Privacy usage descriptions
        NSUserTrackingUsageDescription: 'This app does not track users across other apps or websites.',
        NSCameraUsageDescription: 'This app does not use the camera.',
        NSMicrophoneUsageDescription: 'This app does not use the microphone.',
        NSLocationWhenInUseUsageDescription: 'This app does not use location services.'
      }
    },
    
    android: {
      package: 'com.top10game.app',
      // Note: googleServicesFile removed - use EAS secrets or environment-based config
      // For production, add: googleServicesFile: './google-services.json'
      versionCode: 1,
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
      ],
      // Security configurations
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE'
      ],
      // Remove unnecessary permissions
      blockedPermissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_PHONE_STATE',
        'READ_CONTACTS',
        'WRITE_CONTACTS',
        'READ_CALENDAR',
        'WRITE_CALENDAR',
        'READ_SMS',
        'SEND_SMS',
        'READ_CALL_LOG',
        'WRITE_CALL_LOG',
        'ADD_VOICEMAIL',
        'USE_SIP',
        'PROCESS_OUTGOING_CALLS',
        'BODY_SENSORS',
        'USE_FINGERPRINT',
        'USE_BIOMETRIC'
      ],
      // Network security configuration
      networkSecurityConfig: {
        cleartextTrafficPermitted: false,
        domainConfig: [
          {
            domains: ['firebaseapp.com', 'googleapis.com'],
            cleartextTrafficPermitted: false,
            includeSubdomains: true
          }
        ]
      }
    },
    
    // Web configuration with security headers
    web: {
      bundler: 'metro',
      // Security headers for web deployment
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com wss://*.firebaseapp.com; frame-src 'self' https://*.google.com;"
      }
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



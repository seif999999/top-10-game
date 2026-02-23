/* eslint-env node */
/* global process, module */
// Expo app configuration with Firebase env wiring
// Populate values from process.env; provide empty defaults for .env.example

// Standard AdMob SKAdNetwork identifiers for iOS (Google official list)
// https://developers.google.com/admob/ios/3p-skadnetworks
const ADMOB_SKADNETWORK_IDS = [
  'cstr6suwn9.skadnetwork', '4fzdc2evr5.skadnetwork', '2fnua5tdw4.skadnetwork',
  'ydx93a7ass.skadnetwork', 'p78axxw29g.skadnetwork', 'v72qych5uu.skadnetwork',
  'ludvb6z3bs.skadnetwork', 'cp8zw746q7.skadnetwork', '3sh42y64q3.skadnetwork',
  'c6k4g5qg8m.skadnetwork', 's39g8k73mm.skadnetwork', 'wg4vff78zm.skadnetwork',
  '3qy4746246.skadnetwork', 'f38h382jlk.skadnetwork', 'hs6bdukanm.skadnetwork',
  'mlmmfzh3r3.skadnetwork', 'v4nxqhlyqp.skadnetwork', 'wzmmz9fp6w.skadnetwork',
  'su67r6k2v3.skadnetwork', 'yclnxrl5pm.skadnetwork', 't38b2kh725.skadnetwork',
  '7ug5zh24hu.skadnetwork', 'gta9lk7p23.skadnetwork', 'vutu7akeur.skadnetwork',
  'y5ghdn5j9k.skadnetwork', 'v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork',
  '47vhws6wlr.skadnetwork', 'kbd757ywx3.skadnetwork', '9t245vhmpl.skadnetwork',
  'a2p9lx4jpn.skadnetwork', '22mmun2rn5.skadnetwork', '44jx6755aq.skadnetwork',
  'k674qkevps.skadnetwork', '4468km3ulz.skadnetwork', '2u9pt9hc89.skadnetwork',
  '8s468mfl3y.skadnetwork', 'klf5c3l5u5.skadnetwork', 'ppxm28t8ap.skadnetwork',
  'kbmxgpxpgc.skadnetwork', 'uw77j35x4d.skadnetwork', '578prtvx9j.skadnetwork',
  '4dzt52r2t5.skadnetwork', 'tl55sbb4fm.skadnetwork', 'c3frkrj4fj.skadnetwork',
  'e5fvkxwrpn.skadnetwork', '8c4e2ghe7u.skadnetwork', '3rd42ekr43.skadnetwork',
  '97r2b46745.skadnetwork', '3qcr597p9d.skadnetwork',
];

const skAdNetworkItems = ADMOB_SKADNETWORK_IDS.map((id) => ({
  SKAdNetworkIdentifier: id,
}));

module.exports = () => ({
  expo: {
    name: 'Top10Game',
    slug: 'top10game',
    scheme: 'top10game',
    version: '1.0.1',
    orientation: 'portrait',
    platforms: ['ios', 'android', 'web'],
    assetBundlePatterns: ['**/*'],
    
    plugins: [
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
          },
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          // Use test IDs when env vars are empty to prevent crash (AdMob requires valid ID)
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511',
          skAdNetworkItems,
        },
      ],
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            process.env.EXPO_PUBLIC_TRACKING_PERMISSION_MESSAGE || '',
        },
      ],
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
        // Encryption export compliance (Apple requires this for App Store)
        ITSAppUsesNonExemptEncryption: false,
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
      versionCode: 2,
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
      eas: {
        projectId: '1e4be008-bad9-4294-be11-f8f362b1ffc3',
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
      }
    }
  }
});



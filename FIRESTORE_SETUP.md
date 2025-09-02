# Firestore Setup for Multiplayer System

## Security Rules Setup

To fix the permission errors you're experiencing, you need to deploy the proper Firestore security rules.

### 1. Deploy Security Rules

You have two options:

#### Option A: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules` file
5. Click **Publish**

#### Option B: Firebase CLI
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

### 2. Rule Explanation

The security rules in `firestore.rules` allow:

✅ **Read Access**: Any authenticated user can read room data (needed for joining)
✅ **Create Rooms**: Authenticated users can create rooms where they are the host
✅ **Join Rooms**: Players can add themselves to the players array
✅ **Host Controls**: Only the host can update game state and room settings
✅ **Validation**: Ensures proper data structure and limits

### 3. Testing the Rules

After deploying the rules, test the multiplayer system:

1. **Create Room**: Should work without permission errors
2. **Join Room**: Another user should be able to join using the room code
3. **Game Start**: Host should be able to start the game
4. **Real-time Updates**: All players should see live updates

### 4. Troubleshooting

If you still see permission errors:

1. **Check Authentication**: Ensure users are properly logged in
2. **Verify Email**: Make sure `user.email` is not null
3. **Rule Deployment**: Confirm rules were deployed successfully
4. **Browser Cache**: Clear browser cache and try again

### 5. Security Notes

- Rules ensure only authenticated users can access rooms
- Host privileges are protected (only host can start games)
- Players can only join rooms, not modify other room data
- Room capacity limits are enforced
- Data validation prevents malformed room documents

The rules are designed to be secure while allowing the multiplayer system to function properly with real-time updates.

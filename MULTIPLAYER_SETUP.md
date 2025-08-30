# Multiplayer Setup Guide

This guide will help you set up and run the multiplayer functionality for the Top 10 game.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- React Native development environment
- Expo CLI

## Server Setup

### 1. Install Server Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable.

### 3. Server Endpoints

- **Health Check**: `GET http://localhost:3001/health`
- **Active Rooms**: `GET http://localhost:3001/rooms`
- **WebSocket**: `ws://localhost:3001`

## Client Setup

### 1. Update Server URL

In `src/services/multiplayerService.ts`, update the server URL if needed:

```typescript
private serverUrl: string = 'http://localhost:3001'; // Change this to your server URL
```

For production, use your actual server URL.

### 2. Install Client Dependencies

The client already includes `socket.io-client` in the package.json.

### 3. Run the React Native App

```bash
npm start
```

## How to Use

### 1. Start a Game

1. Navigate to Categories
2. Select a category
3. Choose between Single Player or Multiplayer mode
4. For multiplayer, a unique room will be created

### 2. Multiplayer Features

- **Real-time Leaderboard**: See other players' scores in real-time
- **Live Updates**: Get instant feedback when other players submit answers
- **Room Management**: Players can join and leave rooms
- **Game Synchronization**: All players see the same questions and progress

### 3. Game Flow

1. **Lobby Phase**: Players join the room
2. **Question Phase**: All players answer the same question
3. **Results Phase**: See who got the most points
4. **Next Question**: Move to the next question or end game

## Architecture

### Server Components

- **GameRoom Class**: Manages individual game rooms
- **Socket.io Events**: Handle real-time communication
- **Game State Management**: Tracks scores, answers, and progress

### Client Components

- **MultiplayerService**: Handles Socket.io connections
- **MultiplayerContext**: Manages multiplayer game state
- **GameScreen**: Supports both single-player and multiplayer modes

### Key Features

1. **Mode Selection**: Choose between single-player and multiplayer
2. **Real-time Updates**: Live leaderboard and game state
3. **Room Management**: Automatic room creation and cleanup
4. **Error Handling**: Connection issues and game errors
5. **Responsive UI**: Works on mobile and web

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### Server Configuration

The server includes sample questions for testing. You can add more questions in `server/server.js`:

```javascript
const sampleQuestions = [
  {
    id: 1,
    title: "Name something you'd find in a kitchen",
    answers: [
      { text: "Refrigerator", rank: 1, points: 10 },
      // ... more answers
    ]
  }
];
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if server is running
   - Verify server URL in client
   - Check firewall settings

2. **Players Not Joining**
   - Ensure room ID is unique
   - Check network connectivity
   - Verify Socket.io connection

3. **Game Not Starting**
   - Check if all players are connected
   - Verify game state initialization
   - Check server logs for errors

### Debug Mode

Enable debug logging by setting:

```javascript
// In server/server.js
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  debug: true // Add this line
});
```

## Production Deployment

### Server Deployment

1. Set environment variables
2. Use a process manager (PM2, Forever)
3. Set up reverse proxy (Nginx)
4. Configure SSL certificates

### Client Deployment

1. Update server URL to production domain
2. Build for production platforms
3. Test multiplayer functionality

## Security Considerations

- Implement authentication for multiplayer rooms
- Add rate limiting for answer submissions
- Validate all client inputs
- Use HTTPS in production
- Implement room access controls

## Performance Optimization

- Implement room cleanup for inactive games
- Add connection pooling
- Optimize game state updates
- Use compression for WebSocket messages

## Future Enhancements

- Private rooms with passwords
- Tournament mode
- Spectator mode
- Chat functionality
- Custom question creation
- Persistent game history

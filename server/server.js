const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state storage
const gameRooms = new Map();
const playerSockets = new Map();

// Sample questions for testing
const sampleQuestions = {
  'Sports': [
    {
      id: 1,
      title: "Name the top 10 most popular sports in the world",
      answers: [
        { text: "Football/Soccer", rank: 1, points: 10 },
        { text: "Cricket", rank: 2, points: 9 },
        { text: "Basketball", rank: 3, points: 8 },
        { text: "Tennis", rank: 4, points: 7 },
        { text: "Volleyball", rank: 5, points: 6 },
        { text: "Table Tennis", rank: 6, points: 5 },
        { text: "Baseball", rank: 7, points: 4 },
        { text: "Golf", rank: 8, points: 3 },
        { text: "Rugby", rank: 9, points: 2 },
        { text: "Hockey", rank: 10, points: 1 }
      ]
    }
  ],
  'Movies': [
    {
      id: 2,
      title: "Name the top 10 highest-grossing movies of all time",
      answers: [
        { text: "Avatar", rank: 1, points: 10 },
        { text: "Avengers: Endgame", rank: 2, points: 9 },
        { text: "Titanic", rank: 3, points: 8 },
        { text: "Star Wars: The Force Awakens", rank: 4, points: 7 },
        { text: "Avengers: Infinity War", rank: 5, points: 6 },
        { text: "Spider-Man: No Way Home", rank: 6, points: 5 },
        { text: "Jurassic World", rank: 7, points: 4 },
        { text: "The Lion King", rank: 8, points: 3 },
        { text: "The Avengers", rank: 9, points: 2 },
        { text: "Furious 7", rank: 10, points: 1 }
      ]
    }
  ]
};

// Game Room Class
class GameRoom {
  constructor(roomId, categoryId) {
    this.roomId = roomId;
    this.categoryId = categoryId;
    this.players = [];
    this.gamePhase = 'lobby';
    this.currentRound = 1;
    this.totalRounds = 3;
    this.currentQuestion = null;
    this.scores = {};
    this.leaderboard = [];
    this.questionStartTime = null;
    this.questionTimeLimit = 60000; // 60 seconds
    this.answers = new Map(); // playerId -> [answers]
  }

  addPlayer(player) {
    this.players.push(player);
    this.scores[player.id] = 0;
    this.answers.set(player.id, []);
    this.updateLeaderboard();
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    delete this.scores[playerId];
    this.answers.delete(playerId);
    this.updateLeaderboard();
  }

  startGame() {
    this.gamePhase = 'question';
    this.currentRound = 1;
    this.currentQuestion = this.getRandomQuestion();
    this.questionStartTime = Date.now();
    this.answers.clear();
    this.updateLeaderboard();
  }

  submitAnswer(playerId, answer) {
    if (!this.answers.has(playerId)) {
      this.answers.set(playerId, []);
    }
    this.answers.get(playerId).push(answer);

    // Check if answer is correct
    const isCorrect = this.currentQuestion.answers.some(
      correctAnswer => correctAnswer.text.toLowerCase().trim() === answer.toLowerCase().trim()
    );

    if (isCorrect) {
      const correctAnswer = this.currentQuestion.answers.find(
        a => a.text.toLowerCase().trim() === answer.toLowerCase().trim()
      );
      this.scores[playerId] += correctAnswer.points;
      this.updateLeaderboard();
    }

    return { isCorrect, points: isCorrect ? this.getAnswerPoints(answer) : 0 };
  }

  getAnswerPoints(answer) {
    const correctAnswer = this.currentQuestion.answers.find(
      a => a.text.toLowerCase().trim() === answer.toLowerCase().trim()
    );
    return correctAnswer ? correctAnswer.points : 0;
  }

  nextQuestion() {
    this.currentRound++;
    if (this.currentRound > this.totalRounds) {
      this.gamePhase = 'finished';
    } else {
      this.currentQuestion = this.getRandomQuestion();
      this.questionStartTime = Date.now();
      this.answers.clear();
    }
    this.updateLeaderboard();
  }

  getRandomQuestion() {
    const categoryQuestions = sampleQuestions[this.categoryId] || sampleQuestions['Sports'];
    return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
  }

  updateLeaderboard() {
    this.leaderboard = Object.entries(this.scores)
      .map(([playerId, score]) => {
        const player = this.players.find(p => p.id === playerId);
        return {
          playerId,
          playerName: player ? player.name : 'Unknown',
          score
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  getGameState() {
    return {
      roomId: this.roomId,
      categoryId: this.categoryId,
      gamePhase: this.gamePhase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      currentQuestion: this.currentQuestion,
      players: this.players,
      scores: this.scores,
      leaderboard: this.leaderboard,
      questionStartTime: this.questionStartTime,
      questionTimeLimit: this.questionTimeLimit
    };
  }

  shouldEndQuestion() {
    if (!this.questionStartTime) return false;
    return Date.now() - this.questionStartTime > this.questionTimeLimit;
  }
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join room
  socket.on('joinRoom', (data) => {
    const { roomId, playerId, playerName, categoryId } = data;
    console.log(`🎯 Player ${playerName} joining room ${roomId}`);

    // Store socket mapping
    playerSockets.set(playerId, socket.id);

    // Get or create room
    let room = gameRooms.get(roomId);
    if (!room) {
      room = new GameRoom(roomId, categoryId);
      gameRooms.set(roomId, room);
    }

    // Add player to room
    const player = { id: playerId, name: playerName, socketId: socket.id, isReady: true, joinedAt: Date.now() };
    room.addPlayer(player);

    // Join socket room
    socket.join(roomId);

    // Send room joined confirmation
    socket.emit('roomJoined', {
      success: true,
      room: room.getGameState(),
      player
    });

    // Notify other players
    socket.to(roomId).emit('playerJoined', {
      player,
      room: room.getGameState()
    });

    console.log(`✅ Player ${playerName} joined room ${roomId}`);
  });

  // Start game
  socket.on('startGame', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.startGame();
      io.to(roomId).emit('gameStarted', room.getGameState());
      console.log(`🎮 Game started in room ${roomId}`);
    }
  });

  // Submit answer
  socket.on('submitAnswer', (data) => {
    const { roomId, playerId, answer } = data;
    const room = gameRooms.get(roomId);
    
    if (room && room.gamePhase === 'question') {
      const result = room.submitAnswer(playerId, answer);
      
      // Send result to player
      socket.emit('answerResult', {
        answer,
        isCorrect: result.isCorrect,
        points: result.points,
        newScore: room.scores[playerId]
      });

      // Update all players with new game state
      io.to(roomId).emit('gameStateUpdate', room.getGameState());

      console.log(`📝 Player ${playerId} submitted answer: "${answer}" (${result.isCorrect ? 'correct' : 'incorrect'})`);
    }
  });

  // Next question
  socket.on('nextQuestion', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.nextQuestion();
      io.to(roomId).emit('nextQuestion', room.getGameState());
      console.log(`⏭️ Next question in room ${roomId}`);
    }
  });

  // End game
  socket.on('endGame', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.gamePhase = 'finished';
      io.to(roomId).emit('gameEnded', room.getGameState());
      console.log(`🏁 Game ended in room ${roomId}`);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    
    // Find and remove player from room
    for (const [roomId, room] of gameRooms) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        room.removePlayer(player.id);
        playerSockets.delete(player.id);
        
        // Notify other players
        socket.to(roomId).emit('playerLeft', {
          playerId: player.id,
          room: room.getGameState()
        });
        
        console.log(`👋 Player ${player.name} left room ${roomId}`);
        
        // Clean up empty rooms
        if (room.players.length === 0) {
          gameRooms.delete(roomId);
          console.log(`🗑️ Deleted empty room ${roomId}`);
        }
        break;
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeRooms: gameRooms.size,
    activeConnections: io.engine.clientsCount
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Multiplayer server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

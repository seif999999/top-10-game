const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Game state storage
const gameRooms = new Map();
const playerSockets = new Map();

// Sample questions for testing - matching client-side categories
const sampleQuestions = {
  'Sports': [
    {
      id: 'sports-1',
      title: "Top 10 highest paid athletes in 2024",
      answers: [
        { text: "Cristiano Ronaldo", rank: 1, points: 1 },
        { text: "Lionel Messi", rank: 2, points: 2 },
        { text: "LeBron James", rank: 3, points: 3 },
        { text: "Giannis Antetokounmpo", rank: 4, points: 4 },
        { text: "Stephen Curry", rank: 5, points: 5 },
        { text: "Kevin Durant", rank: 6, points: 6 },
        { text: "Roger Federer", rank: 7, points: 7 },
        { text: "Canelo Alvarez", rank: 8, points: 8 },
        { text: "Dak Prescott", rank: 9, points: 9 },
        { text: "Tom Brady", rank: 10, points: 10 }
      ]
    },
    {
      id: 'sports-2',
      title: "Top 10 fastest animals in the world",
      answers: [
        { text: "Cheetah", rank: 1, points: 1 },
        { text: "Pronghorn Antelope", rank: 2, points: 2 },
        { text: "Springbok", rank: 3, points: 3 },
        { text: "Wildebeest", rank: 4, points: 4 },
        { text: "Lion", rank: 5, points: 5 },
        { text: "Thomson's Gazelle", rank: 6, points: 6 },
        { text: "Quarter Horse", rank: 7, points: 7 },
        { text: "Cape Hunting Dog", rank: 8, points: 8 },
        { text: "Elk", rank: 9, points: 9 },
        { text: "Coyote", rank: 10, points: 10 }
      ]
    },
    {
      id: 'sports-3',
      title: "Top 10 most popular sports in the world",
      answers: [
        { text: "Soccer/Football", rank: 1, points: 1 },
        { text: "Cricket", rank: 2, points: 2 },
        { text: "Basketball", rank: 3, points: 3 },
        { text: "Tennis", rank: 4, points: 4 },
        { text: "Volleyball", rank: 5, points: 5 },
        { text: "Table Tennis", rank: 6, points: 6 },
        { text: "Baseball", rank: 7, points: 7 },
        { text: "Golf", rank: 8, points: 8 },
        { text: "American Football", rank: 9, points: 9 },
        { text: "Rugby", rank: 10, points: 10 }
      ]
    },
    {
      id: 'sports-4',
      title: "Top 10 Olympic medal winning countries (all time)",
      answers: [
        { text: "United States", rank: 1, points: 1 },
        { text: "Soviet Union", rank: 2, points: 2 },
        { text: "Germany", rank: 3, points: 3 },
        { text: "Great Britain", rank: 4, points: 4 },
        { text: "France", rank: 5, points: 5 },
        { text: "Italy", rank: 6, points: 6 },
        { text: "China", rank: 7, points: 7 },
        { text: "Australia", rank: 8, points: 8 },
        { text: "Sweden", rank: 9, points: 9 },
        { text: "Hungary", rank: 10, points: 10 }
      ]
    },
    {
      id: 'sports-5',
      title: "Top 10 NBA players with most championships",
      answers: [
        { text: "Bill Russell", rank: 1, points: 1 },
        { text: "Sam Jones", rank: 2, points: 2 },
        { text: "Tom Heinsohn", rank: 3, points: 3 },
        { text: "K.C. Jones", rank: 4, points: 4 },
        { text: "Frank Ramsey", rank: 5, points: 5 },
        { text: "Robert Horry", rank: 6, points: 6 },
        { text: "Jim Loscutoff", rank: 7, points: 7 },
        { text: "Satch Sanders", rank: 8, points: 8 },
        { text: "John Havlicek", rank: 9, points: 9 },
        { text: "Michael Jordan", rank: 10, points: 10 }
      ]
    }
  ],
  'Movies': [
    {
      id: 'movies-1',
      title: "Top 10 highest grossing movies of all time",
      answers: [
        { text: "Avatar", rank: 1, points: 1 },
        { text: "Avengers: Endgame", rank: 2, points: 2 },
        { text: "Titanic", rank: 3, points: 3 },
        { text: "Star Wars: The Force Awakens", rank: 4, points: 4 },
        { text: "Avengers: Infinity War", rank: 5, points: 5 },
        { text: "Spider-Man: No Way Home", rank: 6, points: 6 },
        { text: "Jurassic World", rank: 7, points: 7 },
        { text: "The Lion King (2019)", rank: 8, points: 8 },
        { text: "The Avengers", rank: 9, points: 9 },
        { text: "Furious 7", rank: 10, points: 10 }
      ]
    },
    {
      id: 'movies-2',
      title: "Top 10 best movies according to IMDb",
      answers: [
        { text: "The Shawshank Redemption", rank: 1, points: 1 },
        { text: "The Godfather", rank: 2, points: 2 },
        { text: "The Dark Knight", rank: 3, points: 3 },
        { text: "The Godfather Part II", rank: 4, points: 4 },
        { text: "12 Angry Men", rank: 5, points: 5 },
        { text: "Schindler's List", rank: 6, points: 6 },
        { text: "The Lord of the Rings: The Return of the King", rank: 7, points: 7 },
        { text: "Pulp Fiction", rank: 8, points: 8 },
        { text: "The Good, the Bad and the Ugly", rank: 9, points: 9 },
        { text: "Fight Club", rank: 10, points: 10 }
      ]
    },
    {
      id: 'movies-3',
      title: "Top 10 most watched movies of all time",
      answers: [
        { text: "Gone with the Wind", rank: 1, points: 1 },
        { text: "Titanic", rank: 2, points: 2 },
        { text: "Avatar", rank: 3, points: 3 },
        { text: "Star Wars: A New Hope", rank: 4, points: 4 },
        { text: "The Sound of Music", rank: 5, points: 5 },
        { text: "E.T. the Extra-Terrestrial", rank: 6, points: 6 },
        { text: "The Ten Commandments", rank: 7, points: 7 },
        { text: "Doctor Zhivago", rank: 8, points: 8 },
        { text: "The Exorcist", rank: 9, points: 9 },
        { text: "Snow White and the Seven Dwarfs", rank: 10, points: 10 }
      ]
    },
    {
      id: 'movies-4',
      title: "Top 10 highest rated animated movies",
      answers: [
        { text: "Spirited Away", rank: 1, points: 1 },
        { text: "Toy Story", rank: 2, points: 2 },
        { text: "The Lion King", rank: 3, points: 3 },
        { text: "Finding Nemo", rank: 4, points: 4 },
        { text: "Up", rank: 5, points: 5 },
        { text: "Wall-E", rank: 6, points: 6 },
        { text: "Beauty and the Beast", rank: 7, points: 7 },
        { text: "Aladdin", rank: 8, points: 8 },
        { text: "The Little Mermaid", rank: 9, points: 9 },
        { text: "Frozen", rank: 10, points: 10 }
      ]
    }
  ],
  'Music': [
    {
      id: 'music-1',
      title: "Top 10 best-selling music artists of all time",
      answers: [
        { text: "The Beatles", rank: 1, points: 1 },
        { text: "Elvis Presley", rank: 2, points: 2 },
        { text: "Michael Jackson", rank: 3, points: 3 },
        { text: "Madonna", rank: 4, points: 4 },
        { text: "Elton John", rank: 5, points: 5 },
        { text: "Led Zeppelin", rank: 6, points: 6 },
        { text: "Pink Floyd", rank: 7, points: 7 },
        { text: "Queen", rank: 8, points: 8 },
        { text: "AC/DC", rank: 9, points: 9 },
        { text: "The Rolling Stones", rank: 10, points: 10 }
      ]
    },
    {
      id: 'music-2',
      title: "Top 10 most streamed songs on Spotify",
      answers: [
        { text: "Blinding Lights", rank: 1, points: 1 },
        { text: "Shape of You", rank: 2, points: 2 },
        { text: "Dance Monkey", rank: 3, points: 3 },
        { text: "Rockstar", rank: 4, points: 4 },
        { text: "One Dance", rank: 5, points: 5 },
        { text: "Closer", rank: 6, points: 6 },
        { text: "Lean On", rank: 7, points: 7 },
        { text: "Uptown Funk", rank: 8, points: 8 },
        { text: "Thinking Out Loud", rank: 9, points: 9 },
        { text: "See You Again", rank: 10, points: 10 }
      ]
    },
    {
      id: 'music-3',
      title: "Top 10 most influential bands of all time",
      answers: [
        { text: "The Beatles", rank: 1, points: 1 },
        { text: "Led Zeppelin", rank: 2, points: 2 },
        { text: "Pink Floyd", rank: 3, points: 3 },
        { text: "The Rolling Stones", rank: 4, points: 4 },
        { text: "Queen", rank: 5, points: 5 },
        { text: "The Who", rank: 6, points: 6 },
        { text: "Black Sabbath", rank: 7, points: 7 },
        { text: "The Doors", rank: 8, points: 8 },
        { text: "Jimi Hendrix Experience", rank: 9, points: 9 },
        { text: "Cream", rank: 10, points: 10 }
      ]
    }
  ],
  'Geography': [
    {
      id: 'geo-1',
      title: "Top 10 largest countries by land area",
      answers: [
        { text: "Russia", rank: 1, points: 1 },
        { text: "Canada", rank: 2, points: 2 },
        { text: "China", rank: 3, points: 3 },
        { text: "United States", rank: 4, points: 4 },
        { text: "Brazil", rank: 5, points: 5 },
        { text: "Australia", rank: 6, points: 6 },
        { text: "India", rank: 7, points: 7 },
        { text: "Argentina", rank: 8, points: 8 },
        { text: "Kazakhstan", rank: 9, points: 9 },
        { text: "Algeria", rank: 10, points: 10 }
      ]
    },
    {
      id: 'geo-2',
      title: "Top 10 most populated countries",
      answers: [
        { text: "China", rank: 1, points: 1 },
        { text: "India", rank: 2, points: 2 },
        { text: "United States", rank: 3, points: 3 },
        { text: "Indonesia", rank: 4, points: 4 },
        { text: "Pakistan", rank: 5, points: 5 },
        { text: "Brazil", rank: 6, points: 6 },
        { text: "Nigeria", rank: 7, points: 7 },
        { text: "Bangladesh", rank: 8, points: 8 },
        { text: "Russia", rank: 9, points: 9 },
        { text: "Mexico", rank: 10, points: 10 }
      ]
    },
    {
      id: 'geo-3',
      title: "Top 10 tallest mountains in the world",
      answers: [
        { text: "Mount Everest", rank: 1, points: 1 },
        { text: "K2", rank: 2, points: 2 },
        { text: "Kangchenjunga", rank: 3, points: 3 },
        { text: "Lhotse", rank: 4, points: 4 },
        { text: "Makalu", rank: 5, points: 5 },
        { text: "Cho Oyu", rank: 6, points: 6 },
        { text: "Dhaulagiri", rank: 7, points: 7 },
        { text: "Manaslu", rank: 8, points: 8 },
        { text: "Nanga Parbat", rank: 9, points: 9 },
        { text: "Annapurna", rank: 10, points: 10 }
      ]
    }
  ],
  'History': [
    {
      id: 'history-1',
      title: "Top 10 most influential historical figures",
      answers: [
        { text: "Jesus Christ", rank: 1, points: 1 },
        { text: "Muhammad", rank: 2, points: 2 },
        { text: "Buddha", rank: 3, points: 3 },
        { text: "Confucius", rank: 4, points: 4 },
        { text: "Isaac Newton", rank: 5, points: 5 },
        { text: "Albert Einstein", rank: 6, points: 6 },
        { text: "Mahatma Gandhi", rank: 7, points: 7 },
        { text: "Martin Luther King Jr.", rank: 8, points: 8 },
        { text: "Nelson Mandela", rank: 9, points: 9 },
        { text: "Mother Teresa", rank: 10, points: 10 }
      ]
    },
    {
      id: 'history-2',
      title: "Top 10 most important historical events",
      answers: [
        { text: "World War II", rank: 1, points: 1 },
        { text: "Industrial Revolution", rank: 2, points: 2 },
        { text: "American Revolution", rank: 3, points: 3 },
        { text: "French Revolution", rank: 4, points: 4 },
        { text: "Fall of Roman Empire", rank: 5, points: 5 },
        { text: "Discovery of America", rank: 6, points: 6 },
        { text: "World War I", rank: 7, points: 7 },
        { text: "Renaissance", rank: 8, points: 8 },
        { text: "Black Death", rank: 9, points: 9 },
        { text: "Crusades", rank: 10, points: 10 }
      ]
    }
  ],
  'Science': [
    {
      id: 'science-1',
      title: "Top 10 most important scientific discoveries",
      answers: [
        { text: "Gravity", rank: 1, points: 1 },
        { text: "Evolution", rank: 2, points: 2 },
        { text: "DNA Structure", rank: 3, points: 3 },
        { text: "Relativity", rank: 4, points: 4 },
        { text: "Penicillin", rank: 5, points: 5 },
        { text: "Electricity", rank: 6, points: 6 },
        { text: "Vaccination", rank: 7, points: 7 },
        { text: "Atomic Structure", rank: 8, points: 8 },
        { text: "Quantum Mechanics", rank: 9, points: 9 },
        { text: "Plate Tectonics", rank: 10, points: 10 }
      ]
    },
    {
      id: 'science-2',
      title: "Top 10 most famous scientists in history",
      answers: [
        { text: "Albert Einstein", rank: 1, points: 1 },
        { text: "Isaac Newton", rank: 2, points: 2 },
        { text: "Galileo Galilei", rank: 3, points: 3 },
        { text: "Charles Darwin", rank: 4, points: 4 },
        { text: "Nikola Tesla", rank: 5, points: 5 },
        { text: "Marie Curie", rank: 6, points: 6 },
        { text: "Leonardo da Vinci", rank: 7, points: 7 },
        { text: "Stephen Hawking", rank: 8, points: 8 },
        { text: "Thomas Edison", rank: 9, points: 9 },
        { text: "Archimedes", rank: 10, points: 10 }
      ]
    },
    {
      id: 'science-3',
      title: "Top 10 most important inventions",
      answers: [
        { text: "Wheel", rank: 1, points: 1 },
        { text: "Printing Press", rank: 2, points: 2 },
        { text: "Electricity", rank: 3, points: 3 },
        { text: "Internet", rank: 4, points: 4 },
        { text: "Telephone", rank: 5, points: 5 },
        { text: "Computer", rank: 6, points: 6 },
        { text: "Automobile", rank: 7, points: 7 },
        { text: "Airplane", rank: 8, points: 8 },
        { text: "Vaccines", rank: 9, points: 9 },
        { text: "Antibiotics", rank: 10, points: 10 }
      ]
    }
  ],
  'Food': [
    {
      id: 'food-1',
      title: "Top 10 most popular cuisines in the world",
      answers: [
        { text: "Italian", rank: 1, points: 1 },
        { text: "Chinese", rank: 2, points: 2 },
        { text: "Japanese", rank: 3, points: 3 },
        { text: "Indian", rank: 4, points: 4 },
        { text: "Mexican", rank: 5, points: 5 },
        { text: "French", rank: 6, points: 6 },
        { text: "Thai", rank: 7, points: 7 },
        { text: "Spanish", rank: 8, points: 8 },
        { text: "Greek", rank: 9, points: 9 },
        { text: "Turkish", rank: 10, points: 10 }
      ]
    }
  ],
  'Technology': [
    {
      id: 'tech-1',
      title: "Top 10 most influential tech companies",
      answers: [
        { text: "Apple", rank: 1, points: 1 },
        { text: "Microsoft", rank: 2, points: 2 },
        { text: "Google", rank: 3, points: 3 },
        { text: "Amazon", rank: 4, points: 4 },
        { text: "Facebook", rank: 5, points: 5 },
        { text: "Tesla", rank: 6, points: 6 },
        { text: "Netflix", rank: 7, points: 7 },
        { text: "Uber", rank: 8, points: 8 },
        { text: "Airbnb", rank: 9, points: 9 },
        { text: "Spotify", rank: 10, points: 10 }
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

  updateCategory(newCategoryId) {
    if (this.categoryId !== newCategoryId) {
      console.log(`🔄 Updating room ${this.roomId} category from ${this.categoryId} to ${newCategoryId}`);
      this.categoryId = newCategoryId;
      this.currentQuestion = null; // Reset current question for new category
      this.answers.clear(); // Clear previous answers
      this.scores = {}; // Reset scores for new category
      this.gamePhase = 'lobby'; // Reset to lobby phase
      this.currentRound = 1; // Reset round counter
      this.updateLeaderboard();
    }
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
    console.log(`🎯 Getting random question for category: ${this.categoryId}`);
    const categoryQuestions = sampleQuestions[this.categoryId];
    if (!categoryQuestions || categoryQuestions.length === 0) {
      console.error(`❌ No questions found for category: ${this.categoryId}, falling back to Sports`);
      return sampleQuestions['Sports'][0]; // Fallback to first Sports question
    }
    const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
    const selectedQuestion = categoryQuestions[randomIndex];
    console.log(`🎯 Selected question: ${selectedQuestion.title} (${randomIndex + 1}/${categoryQuestions.length})`);
    return selectedQuestion;
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
    console.log(`🎯 Player ${playerName} joining room ${roomId} with category: ${categoryId}`);
    console.log(`🔍 Available categories in server:`, Object.keys(sampleQuestions));
    console.log(`🔍 Questions for category "${categoryId}":`, sampleQuestions[categoryId] ? sampleQuestions[categoryId].length : 'NOT FOUND');

    // Store socket mapping
    playerSockets.set(playerId, socket.id);

    // Get or create room
    let room = gameRooms.get(roomId);
    if (!room) {
      room = new GameRoom(roomId, categoryId);
      gameRooms.set(roomId, room);
      console.log(`🏠 Created new room ${roomId} with category: ${categoryId}`);
    } else {
      // If room exists but with different category, update it
      if (room.categoryId !== categoryId) {
        console.log(`🔄 Updating room ${roomId} from category ${room.categoryId} to ${categoryId}`);
        room.updateCategory(categoryId);
      }
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

    console.log(`✅ Player ${playerName} joined room ${roomId} with final category: ${room.categoryId}`);
  });

  // Start game
  socket.on('startGame', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      console.log(`🎮 Starting game in room ${roomId} with category: ${room.categoryId}`);
      room.startGame();
      io.to(roomId).emit('gameStarted', room.getGameState());
      console.log(`🎮 Game started in room ${roomId} with question: ${room.currentQuestion?.title}`);
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

  // Leave room (without disconnecting socket)
  socket.on('leaveRoom', () => {
    console.log('👋 Client leaving room:', socket.id);
    
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

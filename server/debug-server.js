const express = require('express');
const http = require('http');

console.log('🔍 Starting debug server...');

const app = express();
const server = http.createServer(app);

console.log('🔍 HTTP server created');

app.get('/test', (req, res) => {
  console.log('🔍 Test endpoint hit');
  res.json({ message: 'Debug server is working!' });
});

const PORT = 3001;

console.log(`🔍 About to listen on port ${PORT}`);

// Add error handling
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  console.error('❌ Error code:', error.code);
  console.error('❌ Error message:', error.message);
});

// Add listening event
server.on('listening', () => {
  console.log('🔍 Server listening event fired');
  const addr = server.address();
  console.log('🔍 Server address:', addr);
});

server.listen(PORT, () => {
  console.log(`✅ Server listen callback executed`);
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
});

console.log('🔍 Server.listen() called');

// Keep process alive
setInterval(() => {
  console.log('🔍 Server still running...');
}, 5000);

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down debug server...');
  server.close(() => {
    console.log('✅ Debug server closed');
    process.exit(0);
  });
});



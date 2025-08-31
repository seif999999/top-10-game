const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

const PORT = 3002;

server.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error('❌ Test server error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server closed');
    process.exit(0);
  });
});

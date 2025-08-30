#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Top 10 Multiplayer Game...\n');

// Start the server
console.log('📡 Starting multiplayer server...');
const server = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for server to start
setTimeout(() => {
  console.log('\n📱 Starting React Native client...');
  const client = spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Handle client process
  client.on('close', (code) => {
    console.log(`\n📱 Client process exited with code ${code}`);
    server.kill();
    process.exit(code);
  });

  client.on('error', (error) => {
    console.error('❌ Client error:', error);
    server.kill();
    process.exit(1);
  });
}, 3000);

// Handle server process
server.on('close', (code) => {
  console.log(`\n📡 Server process exited with code ${code}`);
  process.exit(code);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});

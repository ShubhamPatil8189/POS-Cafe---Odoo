require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDB } = require('./db');
const initializeSocket = require('./socket'); // We will create this

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Attach Socket.io
initializeSocket(server, app);

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 POS Cafe server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ Failed to initialize DB:", err);
});

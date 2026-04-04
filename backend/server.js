import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import fs from 'fs';

import floorsRouter from './routes/floors.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import paymentsRouter from './routes/payments.js';
import customersRouter from './routes/customers.js';
import sessionsRouter from './routes/sessions.js';
import dashboardRouter from './routes/dashboard.js';
import kitchenRouter from './routes/kitchen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT']
  }
});

// --- Database Setup ---
const DB_PATH = join(__dirname, 'db', 'pos_cafe.db');

if (!fs.existsSync(DB_PATH)) {
  console.log('⚠️  Database not found. Run "npm run seed" first.');
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Attach db and io to request
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  next();
});

// --- Routes ---
app.use('/api/floors', floorsRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/kitchen', kitchenRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Socket.IO ---
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-kitchen', () => {
    socket.join('kitchen');
    console.log('👨‍🍳 Kitchen display connected');
  });

  socket.on('join-pos', () => {
    socket.join('pos');
    console.log('💻 POS terminal connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Odoo POS Cafe Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time updates`);
  console.log(`📊 API available at http://localhost:${PORT}/api\n`);
});

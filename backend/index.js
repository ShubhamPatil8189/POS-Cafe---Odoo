import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { initDB } from './db.js';
await initDB();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route for POS Cafe
app.get('/', (req, res) => {
  res.json({ message: "Welcome to POS Cafe Odoo - Backend API" });
});

import floorsRouter from './routes/floors.js';
import tablesRouter from './routes/tables.js';
import paymentMethodsRouter from './routes/paymentMethods.js';
import terminalRouter from './routes/terminal.js';
import sessionsRouter from './routes/sessions.js';
import reservationsRouter from './routes/reservations.js';

// Route Mounts
app.use('/api/floors', floorsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reservations', reservationsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

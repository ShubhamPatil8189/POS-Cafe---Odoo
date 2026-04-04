<<<<<<< HEAD
import { Router } from 'express';
const router = Router();

// GET current session
router.get('/current', (req, res) => {
  const session = req.db.prepare(`
    SELECT s.*, u.name as user_name, pt.name as terminal_name
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN pos_terminal pt ON s.terminal_id = pt.id
    WHERE s.status = 'open'
    ORDER BY s.id DESC LIMIT 1
  `).get();
  if (!session) return res.status(404).json({ error: 'No active session' });
  res.json(session);
});

// GET all sessions
router.get('/', (req, res) => {
  const sessions = req.db.prepare(`
    SELECT s.*, u.name as user_name, pt.name as terminal_name
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN pos_terminal pt ON s.terminal_id = pt.id
    ORDER BY s.id DESC
  `).all();
  res.json(sessions);
});

// POST open new session
router.post('/open', (req, res) => {
  const { opening_balance, user_id, terminal_id } = req.body;

  // Close any existing open session
  req.db.prepare("UPDATE sessions SET status = 'closed', end_time = CURRENT_TIMESTAMP WHERE status = 'open'").run();

  const result = req.db.prepare(
    "INSERT INTO sessions (user_id, terminal_id, opening_balance, status) VALUES (?, ?, ?, 'open')"
  ).run(user_id || 1, terminal_id || 1, opening_balance || 0);

  const session = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(session);
});

// POST close session
router.post('/close', (req, res) => {
  const session = req.db.prepare("SELECT * FROM sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  if (!session) return res.status(404).json({ error: 'No active session' });

  // Calculate closing balance from payments in this session
  const totalSales = req.db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE o.session_id = ? AND p.status = 'success'
  `).get(session.id);

  req.db.prepare(
    "UPDATE sessions SET status = 'closed', end_time = CURRENT_TIMESTAMP, closing_balance = ? WHERE id = ?"
  ).run(session.opening_balance + totalSales.total, session.id);

  const closed = req.db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id);
  res.json(closed);
});

export default router;
=======
const express = require('express');
const { pool } = require('../db.js');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/sessions/current
router.get('/current', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions WHERE status = "open" ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sessions
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sessions ORDER BY start_time DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions/open
router.post('/open', async (req, res) => {
  try {
    const { terminal_id, opening_balance } = req.body;
    
    // Check if session already open
    const [openSessions] = await pool.query('SELECT id FROM sessions WHERE status = "open"');
    if (openSessions.length > 0) {
      return res.status(400).json({ error: 'A session is already open' });
    }

    // Insert new session
    const [result] = await pool.query(
      'INSERT INTO sessions (terminal_id, status, opening_balance, start_time) VALUES (?, "open", ?, NOW())',
      [terminal_id, opening_balance || 0]
    );

    // Update pos_terminal
    if (terminal_id) {
      await pool.query('UPDATE pos_terminal SET last_open_date = NOW() WHERE id = ?', [terminal_id]);
    }

    const [newSession] = await pool.query('SELECT * FROM sessions WHERE id = ?', [result.insertId]);
    res.status(201).json(newSession[0]);
  } catch (error) {
    console.error('Error opening session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions/close
router.post('/close', async (req, res) => {
  try {
    const { session_id, closing_balance } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    await pool.query(
      'UPDATE sessions SET status = "closed", end_time = NOW(), closing_balance = ? WHERE id = ? AND status = "open"',
      [closing_balance || 0, session_id]
    );

    // Get terminal id to update it
    const [sessionData] = await pool.query('SELECT * FROM sessions WHERE id = ?', [session_id]);
    if (sessionData.length > 0 && sessionData[0].terminal_id) {
       await pool.query('UPDATE pos_terminal SET last_sell_amount = ? WHERE id = ?', [closing_balance || 0, sessionData[0].terminal_id]);
    }

    res.json(sessionData[0] || { message: "Session closed or not found" });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
>>>>>>> 41017e8b3191164f98fa1c469544a73c868f5f26

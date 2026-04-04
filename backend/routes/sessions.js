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

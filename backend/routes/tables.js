const express = require('express');
const { pool } = require('../db.js');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// Valid state transitions
const VALID_TRANSITIONS = {
  'available': ['occupied', 'reserved'],
  'reserved': ['occupied', 'available'],
  'occupied': ['available']
};

// GET /api/tables
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, f.name as floor_name 
      FROM tables t 
      JOIN floors f ON t.floor_id = f.id
    `);
    
    const formattedRows = rows.map(r => ({ ...r, is_active: r.is_active === 1 }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tables/floor/:floorId
router.get('/floor/:floorId', async (req, res) => {
  try {
    const { floorId } = req.params;
    const [rows] = await pool.query('SELECT * FROM tables WHERE floor_id = ?', [floorId]);
    const formattedRows = rows.map(r => ({ ...r, is_active: r.is_active === 1 }));
    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching floor tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tables
router.post('/', async (req, res) => {
  try {
    const { floor_id, table_number, seats } = req.body;
    if (!floor_id || !table_number) return res.status(400).json({ error: 'floor_id and table_number are required' });

    const [result] = await pool.query(
      'INSERT INTO tables (floor_id, table_number, seats) VALUES (?, ?, ?)',
      [floor_id, table_number, seats || 2]
    );
    res.status(201).json({ id: result.insertId, floor_id, table_number, seats, status: 'available' });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tables/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, seats, is_active } = req.body;
    
    const updates = [];
    const values = [];
    if (table_number !== undefined) { updates.push('table_number = ?'); values.push(table_number); }
    if (seats !== undefined) { updates.push('seats = ?'); values.push(seats); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    
    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE tables SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    
    // Fetch updated
    const [rows] = await pool.query('SELECT * FROM tables WHERE id = ?', [id]);
    res.json({ ...rows[0], is_active: rows[0].is_active === 1 });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tables/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, locked_by } = req.body;
    
    // Validate transition
    const [current] = await pool.query('SELECT status FROM tables WHERE id = ?', [id]);
    if (current.length === 0) return res.status(404).json({ error: 'Table not found' });
    
    const currentStatus = current[0].status;
    if (status !== currentStatus && (!VALID_TRANSITIONS[currentStatus] || !VALID_TRANSITIONS[currentStatus].includes(status))) {
       return res.status(400).json({ error: `Invalid transition from ${currentStatus} to ${status}` });
    }

    await pool.query(
      'UPDATE tables SET status = ?, locked_by = ?, last_activity = NOW() WHERE id = ?',
      [status, locked_by || null, id]
    );
    
    res.json({ id: parseInt(id), status, locked_by });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tables/:id/clear
router.put('/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE tables SET status = "available", locked_by = NULL, last_activity = NULL WHERE id = ?',
      [id]
    );
    res.json({ id: parseInt(id), status: 'available' });
  } catch (error) {
    console.error('Error clearing table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tables WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

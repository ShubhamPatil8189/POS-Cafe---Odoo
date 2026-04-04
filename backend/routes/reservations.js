const express = require('express');
const { pool } = require('../db.js');

const router = express.Router();

// GET /api/reservations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, t.table_number 
      FROM reservations r 
      JOIN tables t ON r.table_id = t.id 
      ORDER BY r.reserved_time DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reservations/active
router.get('/active', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, t.table_number 
      FROM reservations r 
      JOIN tables t ON r.table_id = t.id 
      WHERE r.status = "active"
      ORDER BY r.reserved_time ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reservations
router.post('/', async (req, res) => {
  try {
    const { table_id, customer_name, phone, reserved_time, expiry_time } = req.body;
    
    // Check if table is available
    const [tableRow] = await pool.query('SELECT status FROM tables WHERE id = ?', [table_id]);
    if (tableRow.length === 0) return res.status(404).json({ error: 'Table not found' });
    if (tableRow[0].status !== 'available') return res.status(400).json({ error: `Table is currently ${tableRow[0].status}, cannot reserve.` });

    // Insert reservation
    const [result] = await pool.query(
      'INSERT INTO reservations (table_id, customer_name, phone, reserved_time, expiry_time, status) VALUES (?, ?, ?, ?, ?, "active")',
      [table_id, customer_name, phone, reserved_time, expiry_time]
    );

    // Update table status
    await pool.query('UPDATE tables SET status = "reserved" WHERE id = ?', [table_id]);

    res.status(201).json({ id: result.insertId, table_id, customer_name, status: 'active' });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reservations/:id/checkin
router.put('/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;

    // Get reservation
    const [resRow] = await pool.query('SELECT table_id, status FROM reservations WHERE id = ?', [id]);
    if (resRow.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    if (resRow[0].status !== 'active') return res.status(400).json({ error: 'Reservation is not active' });

    // Update reservation
    await pool.query('UPDATE reservations SET status = "completed" WHERE id = ?', [id]);
    // Update table
    await pool.query('UPDATE tables SET status = "occupied" WHERE id = ?', [resRow[0].table_id]);

    res.json({ id: parseInt(id), status: 'completed' });
  } catch (error) {
    console.error('Error checking in reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reservations/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const [resRow] = await pool.query('SELECT table_id FROM reservations WHERE id = ?', [id]);
    if (resRow.length === 0) return res.status(404).json({ error: 'Reservation not found' });

    // Update reservation
    await pool.query('UPDATE reservations SET status = "expired" WHERE id = ?', [id]);
    // Update table
    await pool.query('UPDATE tables SET status = "available" WHERE id = ?', [resRow[0].table_id]);

    res.json({ id: parseInt(id), status: 'expired' });
  } catch (error) {
    console.error('Error canceling reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

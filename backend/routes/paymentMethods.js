const express = require('express');
const { pool } = require('../db.js');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/payment-methods
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_methods');
    const formatted = rows.map(r => ({ ...r, is_enabled: r.is_enabled === 1 }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/payment-methods/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_enabled, upi_id } = req.body;

    const updates = [];
    const values = [];
    if (is_enabled !== undefined) { updates.push('is_enabled = ?'); values.push(is_enabled); }
    if (upi_id !== undefined) { updates.push('upi_id = ?'); values.push(upi_id); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE payment_methods SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [rows] = await pool.query('SELECT * FROM payment_methods WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Payment method not found' });

    res.json({ ...rows[0], is_enabled: rows[0].is_enabled === 1 });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
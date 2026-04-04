import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/terminal
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pos_terminal');
    const formatted = rows.map(r => ({ ...r, self_ordering_enabled: r.self_ordering_enabled === 1 }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching terminals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/terminal
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const [result] = await pool.query('INSERT INTO pos_terminal (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating terminal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/terminal/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, self_ordering_enabled, background_color } = req.body;
    
    const updates = [];
    const values = [];
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (self_ordering_enabled !== undefined) { updates.push('self_ordering_enabled = ?'); values.push(self_ordering_enabled); }
    if (background_color !== undefined) { updates.push('background_color = ?'); values.push(background_color); }
    
    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE pos_terminal SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    
    const [rows] = await pool.query('SELECT * FROM pos_terminal WHERE id = ?', [id]);
    res.json({ ...rows[0], self_ordering_enabled: rows[0].self_ordering_enabled === 1 });
  } catch (error) {
    console.error('Error updating terminal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

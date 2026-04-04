<<<<<<< HEAD
import { Router } from 'express';
const router = Router();

// GET all floors with their tables
router.get('/', (req, res) => {
  const floors = req.db.prepare('SELECT * FROM floors ORDER BY id').all();
  const tables = req.db.prepare('SELECT * FROM tables WHERE is_active = 1 ORDER BY table_number').all();

  const result = floors.map(floor => ({
    ...floor,
    tables: tables.filter(t => t.floor_id === floor.id)
  }));

  res.json(result);
});

// GET single floor with tables
router.get('/:id', (req, res) => {
  const floor = req.db.prepare('SELECT * FROM floors WHERE id = ?').get(req.params.id);
  if (!floor) return res.status(404).json({ error: 'Floor not found' });

  const tables = req.db.prepare('SELECT * FROM tables WHERE floor_id = ? AND is_active = 1 ORDER BY table_number').all(req.params.id);
  res.json({ ...floor, tables });
});

// PATCH table status
router.patch('/tables/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['available', 'occupied', 'reserved', 'self_order'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  req.db.prepare('UPDATE tables SET status = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  const table = req.db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);

  req.io.emit('table-updated', table);
  res.json(table);
});

export default router;
=======
const express = require('express');
const { pool } = require('../db.js');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/floors - Get all floors including tables using a LEFT JOIN / grouped response
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.id AS floor_id, 
        f.name AS floor_name, 
        t.id AS table_id, 
        t.table_number, 
        t.seats, 
        t.is_active, 
        t.status, 
        t.locked_by, 
        t.last_activity
      FROM floors f
      LEFT JOIN tables t ON f.id = t.floor_id
    `);

    // Group tables by floor
    const floorsMap = {};
    rows.forEach(row => {
      if (!floorsMap[row.floor_id]) {
        floorsMap[row.floor_id] = {
          id: row.floor_id,
          name: row.floor_name,
          tables: []
        };
      }
      // Only push if a table actually exists (LEFT JOIN means there could be nulls if no tables)
      if (row.table_id) {
        floorsMap[row.floor_id].tables.push({
          id: row.table_id,
          floor_id: row.floor_id,
          table_number: row.table_number,
          seats: row.seats,
          is_active: row.is_active === 1,
          status: row.status,
          locked_by: row.locked_by,
          last_activity: row.last_activity
        });
      }
    });

    res.json(Object.values(floorsMap));
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/floors
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const [result] = await pool.query('INSERT INTO floors (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating floor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/floors/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    await pool.query('UPDATE floors SET name = ? WHERE id = ?', [name, id]);
    res.json({ id: parseInt(id), name });
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/floors/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if tables are assigned to this floor
    const [tables] = await pool.query('SELECT COUNT(*) as count FROM tables WHERE floor_id = ?', [id]);
    if (tables[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete floor with assigned tables. Reassign or delete tables first.' });
    }

    await pool.query('DELETE FROM floors WHERE id = ?', [id]);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
>>>>>>> 41017e8b3191164f98fa1c469544a73c868f5f26

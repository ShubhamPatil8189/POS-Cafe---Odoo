import express from 'express';
import pool from '../db.js';

const router = express.Router();

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

export default router;

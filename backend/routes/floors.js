const express = require('express');
const prisma = require('../config/database');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/floors - Get all floors including tables
router.get('/', async (req, res) => {
  try {
    const floors = await prisma.floor.findMany({
      include: {
        tables: {
          select: {
            id: true,
            floor_id: true,
            table_number: true,
            seats: true,
            is_active: true,
            status: true,
            locked_by: true,
            last_activity: true
          }
        }
      }
    });

    res.json(floors);
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

    const created = await prisma.floor.create({
      data: { name }
    });
    
    res.status(201).json({ id: created.id, name });
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

    const updated = await prisma.floor.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    
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
    const tablesCount = await prisma.table.count({
      where: { floor_id: parseInt(id) }
    });
    
    if (tablesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete floor with assigned tables. Reassign or delete tables first.' });
    }

    await prisma.floor.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

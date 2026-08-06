const express = require('express');
const prisma = require('../config/database');

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
    const tables = await prisma.table.findMany({
      include: { floor: { select: { name: true } } }
    });
    
    const formattedRows = tables.map(t => ({
      ...t,
      floor_name: t.floor ? t.floor.name : null
    }));
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
    const tables = await prisma.table.findMany({
      where: { floor_id: parseInt(floorId) }
    });
    res.json(tables);
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

    const newTable = await prisma.table.create({
      data: {
        floor_id: parseInt(floor_id),
        table_number,
        seats: seats ? parseInt(seats) : 2,
        status: 'available'
      }
    });
    res.status(201).json(newTable);
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
    
    const data = {};
    if (table_number !== undefined) data.table_number = table_number;
    if (seats !== undefined) data.seats = parseInt(seats);
    if (is_active !== undefined) data.is_active = is_active;
    
    if (Object.keys(data).length > 0) {
      const updated = await prisma.table.update({
        where: { id: parseInt(id) },
        data
      });
      return res.json(updated);
    }
    
    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) }
    });
    if (!table) return res.status(404).json({ error: 'Table not found' });
    
    res.json(table);
  } catch (error) {
    console.error('Error updating table:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tables/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, locked_by } = req.body;
    
    // Validate transition
    const current = await prisma.table.findUnique({
      where: { id: parseInt(id) },
      select: { status: true }
    });
    
    if (!current) return res.status(404).json({ error: 'Table not found' });
    
    const currentStatus = current.status;
    if (status !== currentStatus && (!VALID_TRANSITIONS[currentStatus] || !VALID_TRANSITIONS[currentStatus].includes(status))) {
       return res.status(400).json({ error: `Invalid transition from ${currentStatus} to ${status}` });
    }

    const updated = await prisma.table.update({
      where: { id: parseInt(id) },
      data: {
        status,
        locked_by: locked_by || null,
        last_activity: new Date()
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tables/:id/clear
router.put('/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.table.update({
      where: { id: parseInt(id) },
      data: {
        status: 'available',
        locked_by: null,
        last_activity: null
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error clearing table:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.table.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


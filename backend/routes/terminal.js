const express = require('express');
const prisma = require('../config/database');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/terminal
router.get('/', async (req, res) => {
  try {
    const terminals = await prisma.posTerminal.findMany();
    res.json(terminals);
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

    const newTerminal = await prisma.posTerminal.create({
      data: { name }
    });
    res.status(201).json(newTerminal);
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
    
    const data = {};
    if (name !== undefined) data.name = name;
    if (self_ordering_enabled !== undefined) data.self_ordering_enabled = self_ordering_enabled;
    if (background_color !== undefined) data.background_color = background_color;
    
    if (Object.keys(data).length > 0) {
      const updated = await prisma.posTerminal.update({
        where: { id: parseInt(id) },
        data
      });
      return res.json(updated);
    }
    
    const terminal = await prisma.posTerminal.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!terminal) return res.status(404).json({ error: 'Terminal not found' });
    
    res.json(terminal);
  } catch (error) {
    console.error('Error updating terminal:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Terminal not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

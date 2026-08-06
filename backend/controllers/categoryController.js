const prisma = require('../config/database');

// ── Get All Categories ─────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { sequence: 'asc' },
        { id: 'asc' }
      ]
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// ── Create Category ────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, description, color, sequence, send_to_kitchen } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const created = await prisma.category.create({
      data: {
        name,
        description: description || null,
        color: color || '#ff6b35',
        sequence: sequence !== undefined ? parseInt(sequence) : 0,
        send_to_kitchen: send_to_kitchen !== undefined ? Boolean(send_to_kitchen) : true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// ── Update Category ────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, sequence, send_to_kitchen } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        color: color || existing.color,
        sequence: sequence !== undefined ? parseInt(sequence) : existing.sequence,
        send_to_kitchen: send_to_kitchen !== undefined ? Boolean(send_to_kitchen) : existing.send_to_kitchen
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// ── Delete Category ────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

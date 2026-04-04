const pool = require('../config/database');

// ── Get All Categories ─────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY sequence ASC, id ASC'
    );
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

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, color, sequence, send_to_kitchen) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, color || '#ff6b35', sequence || 0, send_to_kitchen !== undefined ? send_to_kitchen : true]
    );

    const [created] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
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

    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, color = ?, sequence = ?, send_to_kitchen = ? WHERE id = ?',
      [
        name || existing[0].name,
        description !== undefined ? description : existing[0].description,
        color || existing[0].color,
        sequence !== undefined ? sequence : existing[0].sequence,
        send_to_kitchen !== undefined ? send_to_kitchen : existing[0].send_to_kitchen,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// ── Delete Category ────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

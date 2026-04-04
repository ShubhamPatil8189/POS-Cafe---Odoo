const pool = require('../config/database');

// ── Get All Products (with category, variants, extras) ─
exports.getAll = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `);

    // Fetch variants and extras for all products (unchanged)

    // Fetch variants and extras for all products
    const productIds = products.map(p => p.id);

    let variants = [];
    let extras = [];

    if (productIds.length > 0) {
      const [variantRows] = await pool.query(`
        SELECT pv.*, pa.attribute_name
        FROM product_variants pv
        JOIN product_attributes pa ON pv.attribute_id = pa.id
        WHERE pv.product_id IN (?)
      `, [productIds]);
      variants = variantRows;

      const [extraRows] = await pool.query(`
        SELECT * FROM product_extras WHERE product_id IN (?)
      `, [productIds]);
      extras = extraRows;
    }

    // Attach variants and extras to each product
    const result = products.map(product => ({
      ...product,
      image: product.image_url, // Map for frontend
      available: product.is_active ? true : false, // Map for frontend
      category: {
        id: product.category_id,
        name: product.category_name,
        color: product.category_color
      },
      variants: variants.filter(v => v.product_id === product.id),
      extras: extras.filter(e => e.product_id === product.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// ── Get Single Product ─────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = products[0];

    const [variants] = await pool.query(`
      SELECT pv.*, pa.attribute_name
      FROM product_variants pv
      JOIN product_attributes pa ON pv.attribute_id = pa.id
      WHERE pv.product_id = ?
    `, [id]);

    const [extras] = await pool.query(
      'SELECT * FROM product_extras WHERE product_id = ?', [id]
    );

    const [attributes] = await pool.query(
      'SELECT * FROM product_attributes WHERE product_id = ?', [id]
    );

    res.json({
      ...product,
      image: product.image_url, // Map for frontend
      category: {
        id: product.category_id,
        name: product.category_name,
        color: product.category_color
      },
      attributes,
      variants,
      extras
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
};

// ── Create Product ─────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, category_id, price, tax, uom, description, is_active, send_to_kitchen } = req.body;

    if (!name || !category_id || price === undefined) {
      return res.status(400).json({ error: 'Name, category_id, and price are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, category_id, price, tax, uom, description, is_active, send_to_kitchen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category_id, price, tax || 0, uom || 'piece', description || null, is_active !== undefined ? is_active : true, send_to_kitchen !== undefined ? send_to_kitchen : true]
    );

    const [created] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

// ── Update Product ─────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, price, tax, uom, description, is_active, send_to_kitchen } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const p = existing[0];

    await pool.query(
      `UPDATE products SET name = ?, category_id = ?, price = ?, tax = ?, uom = ?, description = ?, is_active = ?, send_to_kitchen = ? WHERE id = ?`,
      [
        name || p.name,
        category_id !== undefined ? category_id : p.category_id,
        price !== undefined ? price : p.price,
        tax !== undefined ? tax : p.tax,
        uom || p.uom,
        description !== undefined ? description : p.description,
        is_active !== undefined ? is_active : p.is_active,
        send_to_kitchen !== undefined ? send_to_kitchen : p.send_to_kitchen,
        id
      ]
    );

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// ── Delete Product ─────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Delete related data first
    await pool.query('DELETE FROM product_extras WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM product_attributes WHERE product_id = ?)', [id]);
    await pool.query('DELETE FROM product_attributes WHERE product_id = ?', [id]);
    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

// ── Add Product Attribute ──────────────────────────────
exports.addAttribute = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { attribute_name } = req.body;

    if (!attribute_name) {
      return res.status(400).json({ error: 'Attribute name is required.' });
    }

    const [product] = await pool.query('SELECT id FROM products WHERE id = ?', [id]);
    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const [result] = await pool.query(
      'INSERT INTO product_attributes (product_id, attribute_name) VALUES (?, ?)',
      [id, attribute_name]
    );

    res.status(201).json({
      id: result.insertId,
      product_id: parseInt(id),
      attribute_name
    });
  } catch (error) {
    console.error('Add attribute error:', error);
    res.status(500).json({ error: 'Failed to add attribute.' });
  }
};

// ── Add Product Variant ────────────────────────────────
exports.addVariant = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { attribute_id, value, unit, extra_price } = req.body;

    if (!attribute_id || !value) {
      return res.status(400).json({ error: 'Attribute ID and value are required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO product_variants (product_id, attribute_id, value, unit, extra_price) VALUES (?, ?, ?, ?, ?)',
      [id, attribute_id, value, unit || null, extra_price || 0]
    );

    res.status(201).json({
      id: result.insertId,
      product_id: parseInt(id),
      attribute_id,
      value,
      unit,
      extra_price: extra_price || 0
    });
  } catch (error) {
    console.error('Add variant error:', error);
    res.status(500).json({ error: 'Failed to add variant.' });
  }
};

// ── Delete Variant ─────────────────────────────────────
exports.removeVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM product_variants WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Variant not found.' });
    }
    await pool.query('DELETE FROM product_variants WHERE id = ?', [id]);
    res.json({ message: 'Variant deleted successfully.' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant.' });
  }
};

// ── Add Product Extra ──────────────────────────────────
exports.addExtra = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { name, extra_price } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Extra name is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO product_extras (product_id, name, extra_price, is_active) VALUES (?, ?, ?, ?)',
      [id, name, extra_price || 0, true]
    );

    res.status(201).json({
      id: result.insertId,
      product_id: parseInt(id),
      name,
      extra_price: extra_price || 0,
      is_active: true
    });
  } catch (error) {
    console.error('Add extra error:', error);
    res.status(500).json({ error: 'Failed to add extra.' });
  }
};

// ── Delete Extra ───────────────────────────────────────
exports.removeExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM product_extras WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Extra not found.' });
    }
    await pool.query('DELETE FROM product_extras WHERE id = ?', [id]);
    res.json({ message: 'Extra deleted successfully.' });
  } catch (error) {
    console.error('Delete extra error:', error);
    res.status(500).json({ error: 'Failed to delete extra.' });
  }
};

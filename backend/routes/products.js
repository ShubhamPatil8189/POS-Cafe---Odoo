<<<<<<< HEAD
import { Router } from 'express';
const router = Router();

// GET all categories
router.get('/categories', (req, res) => {
  const categories = req.db.prepare('SELECT * FROM categories ORDER BY sequence').all();
  res.json(categories);
});

// GET all products (optional ?category_id filter)
router.get('/', (req, res) => {
  const { category_id } = req.query;
  let products;

  if (category_id) {
    products = req.db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.is_active = 1
      ORDER BY p.name
    `).all(category_id);
  } else {
    products = req.db.prepare(`
      SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
      ORDER BY c.sequence, p.name
    `).all();
  }

  res.json(products);
});

// GET single product with extras
router.get('/:id', (req, res) => {
  const product = req.db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const extras = req.db.prepare('SELECT * FROM product_extras WHERE product_id = ? AND is_active = 1').all(req.params.id);
  const attributes = req.db.prepare('SELECT * FROM product_attributes WHERE product_id = ?').all(req.params.id);

  const variants = [];
  attributes.forEach(attr => {
    const attrVariants = req.db.prepare('SELECT * FROM product_variants WHERE attribute_id = ?').all(attr.id);
    variants.push({ ...attr, values: attrVariants });
  });

  res.json({ ...product, extras, attributes: variants });
});

// POST new product
router.post('/', (req, res) => {
  const { category_id, name, description, price, tax, uom, image_url, is_veg, send_to_kitchen } = req.body;
  const result = req.db.prepare(
    'INSERT INTO products (category_id, name, description, price, tax, uom, image_url, is_veg, send_to_kitchen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(category_id, name, description || '', price, tax || 5, uom || 'unit', image_url || '', is_veg ?? 1, send_to_kitchen ?? 1);
  const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
});

// PATCH product
router.patch('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const { name, description, price, category_id, tax, uom, is_veg, is_active, send_to_kitchen } = req.body;
  req.db.prepare(
    'UPDATE products SET name=?, description=?, price=?, category_id=?, tax=?, uom=?, is_veg=?, is_active=?, send_to_kitchen=? WHERE id=?'
  ).run(
    name ?? existing.name, description ?? existing.description, price ?? existing.price,
    category_id ?? existing.category_id, tax ?? existing.tax, uom ?? existing.uom,
    is_veg ?? existing.is_veg, is_active ?? existing.is_active, send_to_kitchen ?? existing.send_to_kitchen,
    req.params.id
  );

  const product = req.db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

// DELETE product (soft delete)
router.delete('/:id', (req, res) => {
  req.db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST new category
router.post('/categories', (req, res) => {
  const { name, description, icon, color, sequence, send_to_kitchen } = req.body;
  const result = req.db.prepare(
    'INSERT INTO categories (name, description, icon, color, sequence, send_to_kitchen) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(name, description || '', icon || '', color || '#666', sequence || 0, send_to_kitchen ?? 1);
  const category = req.db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(category);
});

export default router;
=======
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// ── Product CRUD ───────────────────────────────────────
// GET /api/products
router.get('/', productController.getAll);

// GET /api/products/:id
router.get('/:id', productController.getById);

// POST /api/products (protected)
router.post('/', auth, productController.create);

// PUT /api/products/:id (protected)
router.put('/:id', auth, productController.update);

// DELETE /api/products/:id (protected)
router.delete('/:id', auth, productController.remove);

// ── Product Attributes ─────────────────────────────────
// POST /api/products/:id/attributes
router.post('/:id/attributes', auth, productController.addAttribute);

// ── Product Variants ───────────────────────────────────
// POST /api/products/:id/variants
router.post('/:id/variants', auth, productController.addVariant);

// DELETE /api/products/variants/:id
router.delete('/variants/:id', auth, productController.removeVariant);

// ── Product Extras ─────────────────────────────────────
// POST /api/products/:id/extras
router.post('/:id/extras', auth, productController.addExtra);

// DELETE /api/products/extras/:id
router.delete('/extras/:id', auth, productController.removeExtra);

module.exports = router;
>>>>>>> 41017e8b3191164f98fa1c469544a73c868f5f26

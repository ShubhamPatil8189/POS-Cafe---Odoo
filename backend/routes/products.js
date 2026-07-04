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

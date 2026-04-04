const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// GET /api/categories
router.get('/', categoryController.getAll);

// POST /api/categories (protected)
router.post('/', auth, categoryController.create);

// PUT /api/categories/:id (protected)
router.put('/:id', auth, categoryController.update);

// DELETE /api/categories/:id (protected)
router.delete('/:id', auth, categoryController.remove);

module.exports = router;

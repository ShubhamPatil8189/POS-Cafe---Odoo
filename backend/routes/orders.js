const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Allow public order creation for Self-Ordering and terminal flows
// POST /api/orders — Create order
router.post('/', orderController.createOrder);

// POST /api/orders/:id/items — Add item to order
router.post('/:id/items', orderController.addItem);

// GET /api/orders/:id — Get single order
router.get('/:id', orderController.getOrderById);

// Status Update and Items require auth for modification (uncomment if you want strict security)
// router.use(auth);

// GET /api/orders/table/:tableId — Get active order for table
router.get('/table/:tableId', orderController.getActiveTableOrder);

// GET /api/orders/session/:sessionId — Get all orders for session
router.get('/session/:sessionId', orderController.getSessionOrders);

// POST /api/orders/:id/items — Add item to order
router.post('/:id/items', orderController.addItem);

// PUT /api/orders/:id/items/:itemId — Update item
router.put('/:id/items/:itemId', orderController.updateItem);

// DELETE /api/orders/:id/items/:itemId — Delete item
router.delete('/:id/items/:itemId', orderController.removeItem);

// PUT /api/orders/:id/status — Update order status
router.put('/:id/status', orderController.updateStatus);

// PUT /api/orders/:id/send-to-kitchen — Send to kitchen
router.put('/:id/send-to-kitchen', orderController.sendToKitchen);

module.exports = router;

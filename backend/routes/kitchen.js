const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const auth = require('../middleware/auth'); // If we want to protect it, but specs say no auth for simplicity on the display
// Actually, specs say "no auth required for simplicity" for Kitchen. Let's make it public within the local network.

// GET /api/kitchen/orders/active
router.get('/orders/active', kitchenController.getActiveOrders);

// PUT /api/kitchen/orders/:id/stage
router.put('/orders/:id/stage', kitchenController.updateOrderStage);

// PUT /api/kitchen/orders/:id/items/:itemId
router.put('/orders/:id/items/:itemId', kitchenController.markItemPrepared);

module.exports = router;

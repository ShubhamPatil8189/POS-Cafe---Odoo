const express = require('express');
const router = express.Router();
const selfOrderController = require('../controllers/selfOrderController');
const auth = require('../middleware/auth');

// GET /api/self-order/qr-codes (Admin)
// This endpoint is for the dashboard to show QR URLs for all tables
router.get('/qr-codes', auth, selfOrderController.getQRData);

// GET /api/self-order/qr/:tableId (Public/Admin)
// This serves the QR code as an image directly
router.get('/qr/:tableId', selfOrderController.getQRImage);

// POST /api/self-order/place-order (Public)
// This is called when a customer clicks "Checkout" on their phone
router.post('/place-order', selfOrderController.placeOrder);

module.exports = router;

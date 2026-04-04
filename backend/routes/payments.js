const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// No auth required for terminal payment flows (Self-Order support)
// POST /api/payments — Create pending payment
router.post('/', paymentController.createPayment);

// POST /api/payments/validate — Process successful payment
router.post('/validate', paymentController.validatePayment);

// GET /api/payments/upi-qr/:orderId — Generate UPI QR code for an order
router.get('/upi-qr/:orderId', paymentController.generateUPIQR);

// POST /api/payments/razorpay/order — Create Razorpay order
router.post('/razorpay/order', paymentController.createRazorpayOrder);

// POST /api/payments/razorpay/verify — Verify successful Razorpay payment
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);

// Protect sensitive routes (none in this file currently, but for future)
// router.use(auth);

module.exports = router;

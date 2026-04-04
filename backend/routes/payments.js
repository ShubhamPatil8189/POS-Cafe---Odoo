const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Protect all payment routes
router.use(auth);

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

module.exports = router;

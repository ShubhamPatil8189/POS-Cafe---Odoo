<<<<<<< HEAD
import { Router } from 'express';
import QRCode from 'qrcode';
const router = Router();

// GET all payments
router.get('/', (req, res) => {
  const payments = req.db.prepare(`
    SELECT p.*, pm.type as payment_type, o.order_number, o.table_id,
           t.table_number, o.total_amount as order_total
    FROM payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
    JOIN orders o ON p.order_id = o.id
    JOIN tables t ON o.table_id = t.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(payments);
});

// GET payment methods
router.get('/methods', (req, res) => {
  const methods = req.db.prepare('SELECT * FROM payment_methods WHERE is_enabled = 1').all();
  res.json(methods);
});

// POST process payment
router.post('/', (req, res) => {
  const { order_id, payment_method_id, amount, received } = req.body;

  if (!order_id || !payment_method_id || !amount) {
    return res.status(400).json({ error: 'order_id, payment_method_id, and amount are required' });
  }

  const method = req.db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(payment_method_id);
  if (!method) return res.status(404).json({ error: 'Payment method not found' });

  const transaction_id = method.type !== 'cash'
    ? `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    : null;

  const result = req.db.prepare(
    "INSERT INTO payments (order_id, payment_method_id, amount, status, transaction_id) VALUES (?, ?, ?, 'success', ?)"
  ).run(order_id, payment_method_id, amount, transaction_id);

  // Mark order as paid
  req.db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order_id);

  // Free the table
  const order = req.db.prepare('SELECT table_id, customer_id FROM orders WHERE id = ?').get(order_id);
  if (order) {
    const activeOrders = req.db.prepare(
      "SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status NOT IN ('completed', 'paid')"
    ).get(order.table_id);
    if (activeOrders.count === 0) {
      req.db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(order.table_id);
      req.io.emit('table-updated', req.db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id));
    }

    // Update customer total_sales
    if (order.customer_id) {
      req.db.prepare('UPDATE customers SET total_sales = total_sales + ? WHERE id = ?').run(amount, order.customer_id);
    }
  }

  const payment = req.db.prepare(`
    SELECT p.*, pm.type as payment_type FROM payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  req.io.emit('payment-completed', { payment, order_id });
  req.io.to('kitchen').emit('order-status-changed', { id: order_id, status: 'paid' });

  res.status(201).json(payment);
});

// GET UPI QR code
router.get('/qr', async (req, res) => {
  const { amount, order_id } = req.query;
  if (!amount) return res.status(400).json({ error: 'amount is required' });

  // Get UPI ID from payment methods
  const upiMethod = req.db.prepare("SELECT upi_id FROM payment_methods WHERE type = 'upi' AND is_enabled = 1").get();
  const upiId = upiMethod?.upi_id || 'odooposcafe@upi';

  const upiString = `upi://pay?pa=${upiId}&pn=Odoo POS Cafe&am=${amount}&cu=INR&tn=Order ${order_id || ''}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: { dark: '#3D1D6B', light: '#FFFFFF' }
    });
    res.json({ qr: qrDataUrl, upi_string: upiString, amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
=======
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

module.exports = router;
>>>>>>> 41017e8b3191164f98fa1c469544a73c868f5f26

const pool = require('../config/database');
const qrcode = require('qrcode');

// ── Create Payment ─────────────────────────────────────
exports.createPayment = async (req, res) => {
  try { 
    const { order_id, payment_method_id, amount } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ error: 'Order ID and amount are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO payments (order_id, method_id, amount, status)
       VALUES (?, ?, ?, 'pending')`,
      [order_id, payment_method_id || null, amount]
    );

    const [created] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment.' });
  }
};

// ── Validate Payment ───────────────────────────────────
exports.validatePayment = async (req, res) => {
  const { payment_id } = req.body;
  
  if (!payment_id) {
    return res.status(400).json({ error: 'payment_id is required.' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Get payment
    const [payments] = await conn.query('SELECT * FROM payments WHERE id = ? FOR UPDATE', [payment_id]);
    if (payments.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Payment not found.' });
    }
    const payment = payments[0];

    // 2. Update payment status
    await conn.query('UPDATE payments SET status = ? WHERE id = ?', ['completed', payment_id]);

    // 3. Get order
    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [payment.order_id]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orders[0];

    // 4. Update order status to 'completed'
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', order.id]);

    // 5. Update table status back to 'available'
    if (order.table_id) {
      await conn.query(`UPDATE tables SET status = 'available' WHERE id = ?`, [order.table_id]);
    }

    await conn.commit();

    // 6. Emit Socket.IO event safely
    const io = req.app.get('io');
    if (io) {
      io.emit('order:payment-completed', {
        orderId: order.id,
        orderNumber: order.order_number,
        tableId: order.table_id,
        amount: payment.amount,
        methodId: payment.method_id
      });
    }

    res.json({ id: payment_id, status: 'success', order_status: 'completed' });
  } catch (error) {
    await conn.rollback();
    console.error('Validate payment error:', error);
    res.status(500).json({ error: 'Failed to validate payment.' });
  } finally {
    conn.release();
  }
};

// ── Generate UPI QR Code ───────────────────────────────
exports.generateUPIQR = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const [orders] = await pool.query('SELECT total, order_number FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const order = orders[0];

    // Get UPI ID from payment_methods where type is 'upi'
    const [methods] = await pool.query('SELECT upi_id FROM payment_methods WHERE type = "upi" AND is_enabled = TRUE LIMIT 1');
    if (methods.length === 0 || !methods[0].upi_id) {
      return res.status(400).json({ error: 'UPI payment method not configured or enabled.' });
    }
    const upiId = methods[0].upi_id;
    const amount = Number(order.total).toFixed(2);
    
    // Construct UPI Deep Link URL
    // Format: upi://pay?pa={upi_id}&pn={MerchantName}&am={Amount}&cu=INR&tn={Note}
    const merchantName = encodeURIComponent('POS Cafe');
    const note = encodeURIComponent(`Order-${order.order_number}`);
    const upiUrl = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${note}`;

    // Generate Base64 QR Image Data using the 'qrcode' library
    const qrData = await qrcode.toDataURL(upiUrl, {
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    res.json({
      qr_data: qrData,
      amount,
      upi_id: upiId,
      upi_url: upiUrl
    });
  } catch (error) {
    console.error('UPI QR error:', error);
    res.status(500).json({ error: 'Failed to generate QR code.' });
  }
};

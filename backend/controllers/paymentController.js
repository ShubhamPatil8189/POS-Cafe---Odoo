const pool = require('../config/database');
const qrcode = require('qrcode');
const Razorpay = require('razorpay');
const crypto = require('crypto');

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

    // Block concurrent double payments
    if (order.status === 'completed') {
       await conn.rollback();
       return res.status(200).json({ status: 'success', message: 'Order already completed', order_status: 'completed' });
    }

    // 4. Update order status to 'completed'
    await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', order.id]);

    // 5. Update table status
    if (order.table_id) {
      if (order.source === 'self-order' && order.checkout_type === 'advance') {
        // For Advance Pay self-orders, keep occupied for 30 mins
        const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
        await conn.query(`UPDATE tables SET status = 'occupied', self_order_expiry = ? WHERE id = ?`, [expiryDate, order.table_id]);
      } else {
        // Standard flow: released immediately
        await conn.query(`UPDATE tables SET status = 'available', self_order_expiry = NULL WHERE id = ?`, [order.table_id]);
      }
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

// ── Razorpay Integration (Test Mode) ───────────────────

let razorpayInstance = null;
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured in environment variables');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Create a Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required.' });
    }

    // Get order details
    const [orders] = await pool.query('SELECT id, total, order_number FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orders[0];

    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(Number(order.total) * 100); // Razorpay accepts amount in paise

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_order_${order.id}`,
      notes: {
        orderId: String(order.id),
        orderNumber: String(order.order_number)
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      order_id: order.id,
      order_number: order.order_number
    });

  } catch (error) {
    require('fs').appendFileSync('error.log', 'Create Razorpay Order Error: ' + error.stack + '\n');
    console.error('Create Razorpay Order error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
};

// Verify Razorpay Payment Signature
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      amount // Need original amount from request to insert into payments table
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id || !amount) {
      console.log("PAYMENT VERIFY FAILED 400. Body:", req.body);
      return res.status(400).json({ error: 'Missing required Razorpay payment details or order_id/amount.', received: req.body });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    // Create signature to verify
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.log("PAYMENT VERIFY FAILED 400. SIGNATURE MISMATCH.");
      console.log("Generated:", generated_signature);
      console.log("Received:", razorpay_signature);
      return res.status(400).json({ error: 'Invalid Payment Signature' });
    }

    // Signature matches, now process payment validation in DB
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Get default digital/razorpay payment method
      const [methods] = await conn.query('SELECT id FROM payment_methods WHERE type = "digital" AND is_enabled = TRUE LIMIT 1');
      const method_id = methods.length > 0 ? methods[0].id : null;

      // 2. Insert new payment record
      const [paymentResult] = await conn.query(
        `INSERT INTO payments (order_id, method_id, amount, status, transaction_id)
         VALUES (?, ?, ?, 'completed', ?)`,
        [order_id, method_id, amount, razorpay_payment_id]
      );
      const paymentId = paymentResult.insertId;

      // 3. Update order
      const [orders] = await conn.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [order_id]);
      if (orders.length === 0) {
         await conn.rollback();
         return res.status(404).json({ error: 'Order not found.' });
      }
      const order = orders[0];

      // Block concurrent double payments
      if (order.status === 'completed') {
         await conn.rollback();
         return res.status(200).json({ status: 'success', message: 'Order already completed', order_status: 'completed' });
      }

      await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['completed', order.id]);

      // 4. Update table status
      if (order.table_id) {
        if (order.source === 'self-order' && order.checkout_type === 'advance') {
          const expiryDate = new Date(Date.now() + 30 * 60 * 1000);
          await conn.query(`UPDATE tables SET status = 'occupied', self_order_expiry = ? WHERE id = ?`, [expiryDate, order.table_id]);
        } else {
          await conn.query(`UPDATE tables SET status = 'available', self_order_expiry = NULL WHERE id = ?`, [order.table_id]);
        }
      }

      await conn.commit();

      // 5. Emit socket event
      const io = req.app.get('io');
      if (io) {
         io.emit('order:payment-completed', {
            orderId: order.id,
            orderNumber: order.order_number,
            tableId: order.table_id,
            amount: amount,
            methodId: method_id,
            razorpayPaymentId: razorpay_payment_id
         });
      }

      res.json({
         status: 'success',
         payment_id: paymentId,
         order_status: 'completed',
         razorpay_payment_id
      });

    } catch (dbError) {
      await conn.rollback();
      throw dbError;
    } finally {
      conn.release();
    }

  } catch (error) {
    require('fs').appendFileSync('error.log', 'Verify Razorpay Payment error: ' + error.stack + '\n');
    console.error('Verify Razorpay Payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
};


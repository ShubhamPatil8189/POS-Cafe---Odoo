const prisma = require('../config/database');
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

    const created = await prisma.payment.create({
      data: {
        order_id: parseInt(order_id),
        method_id: payment_method_id ? parseInt(payment_method_id) : null,
        amount: parseFloat(amount),
        status: 'pending'
      }
    });

    res.status(201).json(created);
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get payment
      const payment = await tx.payment.findUnique({
        where: { id: parseInt(payment_id) }
      });
      
      if (!payment) {
        throw new Error(`[NotFound] 404:Payment not found.`);
      }

      // 2. Update payment status
      await tx.payment.update({
        where: { id: parseInt(payment_id) },
        data: { status: 'completed' }
      });

      // 3. Get order
      const order = await tx.order.findUnique({
        where: { id: payment.order_id }
      });
      
      if (!order) {
        throw new Error(`[NotFound] 404:Order not found.`);
      }

      // Block concurrent double payments
      if (order.status === 'completed') {
         return { status: 'success', message: 'Order already completed', order_status: 'completed', alreadyCompleted: true };
      }

      // 4. Update order status to 'completed'
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'completed', is_paid: true }
      });

      // 5. Update table status
      if (order.table_id) {
        const lines = await tx.orderLine.count({
          where: {
            order_id: order.id,
            kitchen_status: { notIn: ['ready', 'served', 'completed'] }
          }
        });
        
        const hasPendingKitchenLines = lines > 0;

        if (order.source === 'self_order' && order.checkout_type === 'advance') {
          // For Advance Pay self-orders, keep occupied without timer (timer starts when kitchen completes order)
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'occupied', self_order_expiry: null }
          });
        } else if (hasPendingKitchenLines) {
          // If order has pending kitchen items (paid at placement), keep table occupied with 30-minute eating timer!
          const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'occupied', self_order_expiry: expiryDate }
          });
        } else {
          // Standard flow: released immediately when paid after completion
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'available', self_order_expiry: null }
          });
        }
      }

      return { payment, order, alreadyCompleted: false };
    });

    if (result.alreadyCompleted) {
      return res.status(200).json(result);
    }

    // 6. Emit Socket.IO event safely
    const io = req.app.get('io');
    if (io) {
      io.emit('order:payment-completed', {
        orderId: result.order.id,
        orderNumber: result.order.order_number,
        tableId: result.order.table_id,
        amount: result.payment.amount,
        methodId: result.payment.method_id
      });
    }

    res.json({ id: payment_id, status: 'success', order_status: 'completed' });
  } catch (error) {
    if (error.message.startsWith('[NotFound]')) {
      const parts = error.message.replace('[NotFound] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    console.error('Validate payment error:', error);
    res.status(500).json({ error: 'Failed to validate payment.' });
  }
};

// ── Generate UPI QR Code ───────────────────────────────
exports.generateUPIQR = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { total: true, order_number: true }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Get UPI ID from payment_methods where type is 'upi'
    const method = await prisma.paymentMethod.findFirst({
      where: {
        type: 'upi',
        is_enabled: true
      },
      select: { upi_id: true }
    });
    
    if (!method || !method.upi_id) {
      return res.status(400).json({ error: 'UPI payment method not configured or enabled.' });
    }
    
    const upiId = method.upi_id;
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
    const order = await prisma.order.findUnique({
      where: { id: parseInt(order_id) },
      select: { id: true, total: true, order_number: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

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
    require('fs').appendFileSync('error.log', 'Create Razorpay Order Error: ' + (error.stack || error) + '\n');
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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get default digital/razorpay payment method
      const method = await tx.paymentMethod.findFirst({
        where: { type: 'digital', is_enabled: true }
      });
      const method_id = method ? method.id : null;

      // 2. Insert new payment record
      const payment = await tx.payment.create({
        data: {
          order_id: parseInt(order_id),
          method_id,
          amount: parseFloat(amount),
          status: 'completed',
          transaction_id: razorpay_payment_id
        }
      });

      // 3. Update order
      const order = await tx.order.findUnique({
        where: { id: parseInt(order_id) }
      });
      
      if (!order) {
         throw new Error(`[NotFound] 404:Order not found.`);
      }

      // Block concurrent double payments
      if (order.status === 'completed') {
         return { status: 'success', message: 'Order already completed', order_status: 'completed', alreadyCompleted: true };
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'completed', is_paid: true }
      });

      // 4. Update table status
      if (order.table_id) {
        const lines = await tx.orderLine.count({
          where: {
            order_id: order.id,
            kitchen_status: { notIn: ['ready', 'served', 'completed'] }
          }
        });
        const hasPendingKitchenLines = lines > 0;

        if (order.source === 'self_order' && order.checkout_type === 'advance') {
          // For Advance Pay self-orders, keep occupied without timer (timer starts when kitchen completes order)
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'occupied', self_order_expiry: null }
          });
        } else if (hasPendingKitchenLines) {
          // If order has pending kitchen items (paid at placement), keep table occupied with 30-minute eating timer!
          const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'occupied', self_order_expiry: expiryDate }
          });
        } else {
          // Send to kitchen orders or others: Mark available once paid
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'available', self_order_expiry: null }
          });
        }
      }

      return { payment, order, method_id, alreadyCompleted: false };
    });
    
    if (result.alreadyCompleted) {
      return res.status(200).json(result);
    }

    // 5. Emit socket event
    const io = req.app.get('io');
    if (io) {
       io.emit('order:payment-completed', {
          orderId: result.order.id,
          orderNumber: result.order.order_number,
          tableId: result.order.table_id,
          amount: amount,
          methodId: result.method_id,
          razorpayPaymentId: razorpay_payment_id
       });
    }

    res.json({
       status: 'success',
       payment_id: result.payment.id,
       order_status: 'completed',
       razorpay_payment_id
    });

  } catch (error) {
    if (error.message.startsWith('[NotFound]')) {
      const parts = error.message.replace('[NotFound] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    require('fs').appendFileSync('error.log', 'Verify Razorpay Payment error: ' + error.stack + '\n');
    console.error('Verify Razorpay Payment error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
};


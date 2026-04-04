const express = require('express');
// trigger restart
const cors = require('cors');

// ── Route Imports ──────────────────────────────────────
// Module A routes (Foundation)
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

// Module B routes (POS Configuration)  
const floorRoutes = require('./routes/floors');
const tableRoutes = require('./routes/tables');
const paymentMethodRoutes = require('./routes/paymentMethods');
const terminalRoutes = require('./routes/terminal');
const sessionRoutes = require('./routes/sessions');
const reservationRoutes = require('./routes/reservations');

// Module C routes (POS Terminals)
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const selfOrderRoutes = require('./routes/selfOrder');

// Module D routes (Displays/Reports)
const kitchenRoutes = require('./routes/kitchen');
const customerDisplayRoutes = require('./routes/customerDisplay');
const reportRoutes = require('./routes/reports');

const app = express();

/* ---------- CORS ---------- */
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

/* ---------- Middleware ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ---------- Routes ---------- */
// Module A — Person 1
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Module B — Person 2
app.use('/api/floors', floorRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reservations', reservationRoutes);

// Module C — Person 3
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/self-order', selfOrderRoutes);

// Module D — Person 4
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/customer-display', customerDisplayRoutes);
app.use('/api/reports', reportRoutes);

/* ---------- Test Razorpay UI ---------- */
app.get('/test-pay', async (req, res) => {
  try {
    const pool = require('./config/database');
    const jwt = require('jsonwebtoken');
    // Create a dummy order to test with
    const [result] = await pool.query('INSERT INTO orders (order_number, total, status) VALUES (?, ?, ?)', ['TEST-' + Date.now(), 500, 'draft']);
    const orderId = result.insertId;
    const keyId = process.env.RAZORPAY_KEY_ID;
    
    // Generate a valid token directly from the server to bypass login dependency in testing
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

    res.send(`
      <html>
        <head><title>Test Razorpay Integration</title></head>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2>Razorpay Sandbox Testing</h2>
          <p>We created Mock Order <b>#${orderId}</b> for <b>₹500.00</b></p>
          <button id="pay-btn" style="padding: 10px 20px; font-size: 16px; background: #3399cc; color: white; border: none; border-radius: 5px; cursor: pointer;">Pay with Razorpay</button>
          
          <div id="status" style="margin-top: 20px; font-weight: bold; color: green;"></div>

          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <script>
            document.getElementById('pay-btn').onclick = async function() {
              const token = "${token}";
              document.getElementById('status').innerText = "Generating Razorpay Order ID...";

              // 1. Get Order ID from backend
              const orderRes = await fetch('/api/payments/razorpay/order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ order_id: ${orderId} })
              });
              const orderData = await orderRes.json();
              
              if (orderData.error) return alert(orderData.error);

              // 3. Open Razorpay Checkout
              document.getElementById('status').innerText = "Awaiting checkout completion...";
              var options = {
                  "key": "${keyId}",
                  "amount": orderData.amount,
                  "currency": "INR",
                  "name": "POS Cafe Test",
                  "description": "Test Transaction",
                  "order_id": orderData.id,
                  "handler": async function (response){
                      document.getElementById('status').innerText = "Verifying Payment with our Server...";
                      
                      // 4. Verify Payment
                      const verifyRes = await fetch('/api/payments/razorpay/verify', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                          order_id: ${orderId},
                          amount: 500
                        })
                      });
                      const verifyData = await verifyRes.json();
                      
                      if (verifyData.status === 'success') {
                         document.getElementById('status').innerText = "✅ Success! Verification passed and Order marked as Completed in DB!";
                         document.getElementById('pay-btn').style.display = 'none';
                      } else {
                         document.getElementById('status').innerText = "❌ Verification Failed: " + verifyData.error;
                      }
                  },
                  "theme": { "color": "#3399cc" }
              };
              var rzp1 = new Razorpay(options);
              rzp1.open();
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
      res.status(500).send("Error: " + err.message);
  }
});

/* ---------- Background Tasks ---------- */
// 30-minute timer release for 'Pay in Advance' self-orders
const releaseExpiredTables = async () => {
  try {
    const { pool } = require('./db');
    const [result] = await pool.query(`
      UPDATE tables 
      SET status = 'available', self_order_expiry = NULL 
      WHERE status = 'occupied' AND self_order_expiry IS NOT NULL AND self_order_expiry <= NOW()
    `);
    if (result.affectedRows > 0) {
      console.log(`🧹 Background Task: Released ${result.affectedRows} expired self-order tables.`);
    }
  } catch (error) {
    console.error('❌ Background Task Error:', error.message);
  }
};

// Check every 1 minute for faster response (can be adjusted to 5 minutes)
setInterval(releaseExpiredTables, 60 * 1000);

module.exports = app;

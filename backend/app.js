const express = require('express');
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

// Module D routes (Displays/Reports)
const kitchenRoutes = require('./routes/kitchen');
const customerDisplayRoutes = require('./routes/customerDisplay');
const reportRoutes = require('./routes/reports');

const app = express();

/* ---------- CORS ---------- */
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5000'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Module D — Person 4
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/customer-display', customerDisplayRoutes);
app.use('/api/reports', reportRoutes);

/* ---------- Health Check ---------- */
app.get('/', (req, res) => {
  res.json({ message: '☕ POS Cafe Backend Running' });
});

module.exports = app;

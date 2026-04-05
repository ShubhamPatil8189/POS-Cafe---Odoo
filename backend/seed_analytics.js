/**
 * Analytics Seed Script
 * Seeds: payment_methods, sessions, users(staff), orders, order_lines, payments
 * Run: node backend/seed_analytics.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const PRODUCTS = [
  { id: null, name: 'Margherita Pizza',   price: 300 },
  { id: null, name: 'Cappuccino',         price: 150 },
  { id: null, name: 'Pepperoni Pizza',    price: 400 },
  { id: null, name: 'Alfredo Pasta',      price: 350 },
  { id: null, name: 'Classic Burger',     price: 250 },
  { id: null, name: 'Cold Coffee',        price: 200 },
  { id: null, name: 'Chocolate Brownie',  price: 210 },
  { id: null, name: 'Latte',              price: 180 },
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

// Generate a date N days ago  
const daysAgo = (n, h = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, rand(0, 59), 0, 0);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

async function run() {
  const connCfg = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000,
  };
  if (process.env.DB_SSL === 'true') {
    connCfg.ssl = { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }

  const conn = await mysql.createConnection(connCfg);
  console.log('✅ Connected to TiDB Cloud\n');

  try {
    // ── 1. Ensure payment methods ──────────────────────────
    console.log('💳 Ensuring payment methods...');
    const [pmRows] = await conn.query('SELECT id, type FROM payment_methods');
    const pmMap = {};
    pmRows.forEach(r => pmMap[r.type] = r.id);

    if (!pmMap['cash']) {
      const [r] = await conn.query("INSERT INTO payment_methods (name, type) VALUES ('Cash', 'cash')");
      pmMap['cash'] = r.insertId;
      console.log('  ✅ Created cash payment method');
    }
    if (!pmMap['digital']) {
      const [r] = await conn.query("INSERT INTO payment_methods (name, type) VALUES ('Card / Digital', 'digital')");
      pmMap['digital'] = r.insertId;
      console.log('  ✅ Created digital payment method');
    }
    if (!pmMap['upi']) {
      const [r] = await conn.query("INSERT INTO payment_methods (name, type) VALUES ('UPI', 'upi')");
      pmMap['upi'] = r.insertId;
      console.log('  ✅ Created UPI payment method');
    }
    console.log('  Payment method IDs:', pmMap, '\n');

    // ── 2. Ensure users (admin + 2 staff) ─────────────────
    console.log('👤 Ensuring users...');
    const hash = await bcrypt.hash('staff123', 10);

    const ensureUser = async (name, email, role) => {
      const [rows] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length > 0) { console.log(`  ↩ ${email} already exists (id=${rows[0].id})`); return rows[0].id; }
      const [res] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hash, role]
      );
      console.log(`  ✅ Created ${role} ${email} (id=${res.insertId})`);
      return res.insertId;
    };

    const adminId = await ensureUser('Admin User',  'admin@cafe.com',  'admin');
    const staff1  = await ensureUser('Priya Sharma', 'priya@cafe.com',  'staff');
    const staff2  = await ensureUser('Rahul Verma',  'rahul@cafe.com',  'staff');
    const userIds = [adminId, staff1, staff2];
    console.log();

    // ── 3. Resolve product IDs ─────────────────────────────
    console.log('📦 Resolving product IDs...');
    for (const p of PRODUCTS) {
      const [rows] = await conn.query('SELECT id FROM products WHERE name = ? LIMIT 1', [p.name]);
      if (rows.length > 0) {
        p.id = rows[0].id;
        console.log(`  ✅ "${p.name}" → id ${p.id}`);
      } else {
        // Insert a minimal product row so it exists
        const [catRows] = await conn.query('SELECT id FROM categories LIMIT 1');
        const catId = catRows.length > 0 ? catRows[0].id : null;
        const [res] = await conn.query(
          'INSERT INTO products (name, price, category_id, send_to_kitchen) VALUES (?, ?, ?, TRUE)',
          [p.name, p.price, catId]
        );
        p.id = res.insertId;
        console.log(`  ✅ Inserted "${p.name}" → id ${p.id}`);
      }
    }
    console.log();

    // ── 4. Seed sessions (last 7 days, 2/day) ─────────────
    console.log('🕐 Seeding sessions...');
    const sessionIds = [];
    for (let day = 6; day >= 0; day--) {
      // Morning session
      const [s1] = await conn.query(
        'INSERT INTO sessions (user_id, status, opening_balance, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
        [pick(userIds), 'closed', 500, daysAgo(day, 9), daysAgo(day, 14)]
      );
      sessionIds.push(s1.insertId);

      // Evening session
      const [s2] = await conn.query(
        'INSERT INTO sessions (user_id, status, opening_balance, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
        [pick(userIds), 'closed', 500, daysAgo(day, 16), daysAgo(day, 22)]
      );
      sessionIds.push(s2.insertId);
    }
    // One open session for today
    const [sOpen] = await conn.query(
      'INSERT INTO sessions (user_id, status, opening_balance, start_time) VALUES (?, ?, ?, NOW())',
      [adminId, 'open', 1000]
    );
    sessionIds.push(sOpen.insertId);
    console.log(`  ✅ Created ${sessionIds.length} sessions\n`);

    // ── 5. Seed orders + lines + payments ─────────────────
    console.log('🛒 Seeding orders, order lines, and payments...');
    const payTypes = ['cash', 'digital', 'upi'];
    let orderCount = 0;

    // ~6 orders per day for past 7 days
    for (let day = 6; day >= 0; day--) {
      const ordersThisDay = rand(4, 8);
      for (let o = 0; o < ordersThisDay; o++) {
        const hour = rand(9, 21);
        const createdAt = daysAgo(day, hour);
        const userId = pick(userIds);
        const sessionId = pick(sessionIds);
        const orderNumber = `ORD-${Date.now()}-${rand(1000, 9999)}`;

        // Pick 1-4 random products
        const numItems = rand(1, 4);
        const selectedProducts = [];
        const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
        for (let i = 0; i < numItems; i++) selectedProducts.push(shuffled[i]);

        let subtotal = 0;
        const lines = selectedProducts.map(prod => {
          const qty = rand(1, 3);
          const lineTotal = prod.price * qty;
          subtotal += lineTotal;
          return { prod, qty, lineTotal };
        });
        const taxTotal = parseFloat((subtotal * 0.05).toFixed(2));
        const total = parseFloat((subtotal + taxTotal).toFixed(2));

        // Insert order
        const [orderRes] = await conn.query(
          `INSERT INTO orders (order_number, session_id, user_id, status, subtotal, tax_total, total, created_at, updated_at)
           VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?)`,
          [orderNumber, sessionId, userId, subtotal, taxTotal, total, createdAt, createdAt]
        );
        const orderId = orderRes.insertId;

        // Insert order lines
        for (const { prod, qty, lineTotal } of lines) {
          await conn.query(
            `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, tax, subtotal, kitchen_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')`,
            [orderId, prod.id, prod.name, qty, prod.price, 5.00, lineTotal]
          );
        }

        // Insert payment
        const payType = pick(payTypes);
        const methodId = pmMap[payType];
        await conn.query(
          `INSERT INTO payments (order_id, method_id, amount, status, created_at)
           VALUES (?, ?, ?, 'completed', ?)`,
          [orderId, methodId, total, createdAt]
        );

        orderCount++;
        // small delay to avoid duplicate order_number
        await new Promise(r => setTimeout(r, 2));
      }
    }

    // Also seed ~3 orders TODAY with today's timestamp
    for (let o = 0; o < 3; o++) {
      const orderNumber = `ORD-TODAY-${rand(1000, 9999)}`;
      const userId = pick(userIds);
      const prod1 = pick(PRODUCTS);
      const prod2 = pick(PRODUCTS);
      const subtotal = prod1.price + prod2.price;
      const taxTotal = parseFloat((subtotal * 0.05).toFixed(2));
      const total    = parseFloat((subtotal + taxTotal).toFixed(2));

      const [orderRes] = await conn.query(
        `INSERT INTO orders (order_number, session_id, user_id, status, subtotal, tax_total, total)
         VALUES (?, ?, ?, 'completed', ?, ?, ?)`,
        [orderNumber, sOpen.insertId, userId, subtotal, taxTotal, total]
      );
      const orderId = orderRes.insertId;

      for (const prod of [prod1, prod2]) {
        await conn.query(
          `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, tax, subtotal, kitchen_status)
           VALUES (?, ?, ?, 1, ?, 5.00, ?, 'ready')`,
          [orderId, prod.id, prod.name, prod.price, prod.price]
        );
      }

      const payType = pick(payTypes);
      await conn.query(
        `INSERT INTO payments (order_id, method_id, amount, status) VALUES (?, ?, ?, 'completed')`,
        [orderId, pmMap[payType], total]
      );
      orderCount++;
      await new Promise(r => setTimeout(r, 2));
    }

    console.log(`  ✅ Created ${orderCount} orders with lines & payments\n`);

    // ── Summary ───────────────────────────────────────────
    const [[{ cnt }]] = await conn.query("SELECT COUNT(*) as cnt FROM orders WHERE status='completed'");
    const [[{ rev }]] = await conn.query("SELECT SUM(total) as rev FROM orders WHERE status='completed'");
    console.log('═══════════════════════════════════════');
    console.log('🎉 Analytics seed complete!');
    console.log(`   Total completed orders : ${cnt}`);
    console.log(`   Total revenue          : ₹${parseFloat(rev || 0).toFixed(2)}`);
    console.log('═══════════════════════════════════════');
    console.log('\nNow go to Analytics → it should show live data ✅');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await conn.end();
  }
}

run();

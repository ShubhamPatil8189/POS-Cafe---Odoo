/**
 * Analytics Seed Script
 * Seeds: payment_methods, sessions, users(staff), orders, order_lines, payments
 * Run: node backend/seed_analytics.js
 */

const bcrypt = require('bcryptjs');
const prisma = require('./config/database');
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
  return d;
};

async function run() {
  console.log('✅ Connected via Prisma\n');

  try {
    // ── 1. Ensure payment methods ──────────────────────────
    console.log('💳 Ensuring payment methods...');
    const pmRows = await prisma.paymentMethod.findMany({ select: { id: true, type: true } });
    const pmMap = {};
    pmRows.forEach(r => pmMap[r.type] = r.id);

    if (!pmMap['cash']) {
      const r = await prisma.paymentMethod.create({ data: { name: 'Cash', type: 'cash' } });
      pmMap['cash'] = r.id;
      console.log('  ✅ Created cash payment method');
    }
    if (!pmMap['digital']) {
      const r = await prisma.paymentMethod.create({ data: { name: 'Card / Digital', type: 'digital' } });
      pmMap['digital'] = r.id;
      console.log('  ✅ Created digital payment method');
    }
    if (!pmMap['upi']) {
      const r = await prisma.paymentMethod.create({ data: { name: 'UPI', type: 'upi' } });
      pmMap['upi'] = r.id;
      console.log('  ✅ Created UPI payment method');
    }
    console.log('  Payment method IDs:', pmMap, '\n');

    // ── 2. Ensure users (admin + 2 staff) ─────────────────
    console.log('👤 Ensuring users...');
    const hash = await bcrypt.hash('staff123', 10);

    const ensureUser = async (name, email, role) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) { console.log(`  ↩ ${email} already exists (id=${existing.id})`); return existing.id; }
      const res = await prisma.user.create({
        data: { name, email, password: hash, role }
      });
      console.log(`  ✅ Created ${role} ${email} (id=${res.id})`);
      return res.id;
    };

    const adminId = await ensureUser('Admin User',  'admin@cafe.com',  'admin');
    const staff1  = await ensureUser('Priya Sharma', 'priya@cafe.com',  'staff');
    const staff2  = await ensureUser('Rahul Verma',  'rahul@cafe.com',  'staff');
    const userIds = [adminId, staff1, staff2];
    console.log();

    // ── 3. Resolve product IDs ─────────────────────────────
    console.log('📦 Resolving product IDs...');
    for (const p of PRODUCTS) {
      const existing = await prisma.product.findFirst({ where: { name: p.name } });
      if (existing) {
        p.id = existing.id;
        console.log(`  ✅ "${p.name}" → id ${p.id}`);
      } else {
        // Insert a minimal product row so it exists
        const cat = await prisma.category.findFirst();
        const catId = cat ? cat.id : null;
        const res = await prisma.product.create({
          data: { name: p.name, price: p.price, category_id: catId, send_to_kitchen: true }
        });
        p.id = res.id;
        console.log(`  ✅ Inserted "${p.name}" → id ${p.id}`);
      }
    }
    console.log();

    // ── 4. Seed sessions (last 7 days, 2/day) ─────────────
    console.log('🕐 Seeding sessions...');
    const sessionIds = [];
    for (let day = 6; day >= 0; day--) {
      // Morning session
      const s1 = await prisma.session.create({
        data: { user_id: pick(userIds), status: 'closed', opening_balance: 500, start_time: daysAgo(day, 9), end_time: daysAgo(day, 14) }
      });
      sessionIds.push(s1.id);

      // Evening session
      const s2 = await prisma.session.create({
        data: { user_id: pick(userIds), status: 'closed', opening_balance: 500, start_time: daysAgo(day, 16), end_time: daysAgo(day, 22) }
      });
      sessionIds.push(s2.id);
    }
    // One open session for today
    const sOpen = await prisma.session.create({
      data: { user_id: adminId, status: 'open', opening_balance: 1000, start_time: new Date() }
    });
    sessionIds.push(sOpen.id);
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
        const orderRes = await prisma.order.create({
          data: {
            order_number: orderNumber, session_id: sessionId, user_id: userId, status: 'completed',
            subtotal, tax_total: taxTotal, total, created_at: createdAt, updated_at: createdAt
          }
        });
        const orderId = orderRes.id;

        // Insert order lines
        for (const { prod, qty, lineTotal } of lines) {
          await prisma.orderLine.create({
            data: {
              order_id: orderId, product_id: prod.id, product_name: prod.name, quantity: qty,
              unit_price: prod.price, tax: 5.00, subtotal: lineTotal, kitchen_status: 'ready'
            }
          });
        }

        // Insert payment
        const payType = pick(payTypes);
        const methodId = pmMap[payType];
        await prisma.payment.create({
          data: { order_id: orderId, method_id: methodId, amount: total, status: 'completed', created_at: createdAt }
        });

        orderCount++;
        // small delay to avoid duplicate order_number
        await new Promise(r => setTimeout(r, 2));
      }
    }

    // Also seed ~3 orders TODAY with today's timestamp
    for (let o = 0; o < 3; o++) {
      const orderNumber = `ORD-TODAY-${Date.now()}-${rand(1000, 9999)}`;
      const userId = pick(userIds);
      const prod1 = pick(PRODUCTS);
      const prod2 = pick(PRODUCTS);
      const subtotal = prod1.price + prod2.price;
      const taxTotal = parseFloat((subtotal * 0.05).toFixed(2));
      const total    = parseFloat((subtotal + taxTotal).toFixed(2));

      const orderRes = await prisma.order.create({
        data: {
          order_number: orderNumber, session_id: sOpen.id, user_id: userId, status: 'completed',
          subtotal, tax_total: taxTotal, total
        }
      });
      const orderId = orderRes.id;

      for (const prod of [prod1, prod2]) {
        await prisma.orderLine.create({
          data: {
            order_id: orderId, product_id: prod.id, product_name: prod.name, quantity: 1,
            unit_price: prod.price, tax: 5.00, subtotal: prod.price, kitchen_status: 'ready'
          }
        });
      }

      const payType = pick(payTypes);
      await prisma.payment.create({
        data: { order_id: orderId, method_id: pmMap[payType], amount: total, status: 'completed' }
      });
      orderCount++;
      await new Promise(r => setTimeout(r, 2));
    }

    console.log(`  ✅ Created ${orderCount} orders with lines & payments\n`);

    // ── Summary ───────────────────────────────────────────
    const stats = await prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { status: 'completed' }
    });
    console.log('═══════════════════════════════════════');
    console.log('🎉 Analytics seed complete!');
    console.log(`   Total completed orders : ${stats._count.id}`);
    console.log(`   Total revenue          : ₹${stats._sum.total ? parseFloat(stats._sum.total).toFixed(2) : 0}`);
    console.log('═══════════════════════════════════════');
    console.log('\nNow go to Analytics → it should show live data ✅');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();

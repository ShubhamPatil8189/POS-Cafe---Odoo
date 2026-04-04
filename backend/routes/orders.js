<<<<<<< HEAD
import { Router } from 'express';
const router = Router();

// Helper: generate order number like ORD-20260404-001
function generateOrderNumber(db) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const count = db.prepare("SELECT COUNT(*) as c FROM orders WHERE DATE(created_at) = DATE('now')").get();
  const seq = String((count.c || 0) + 1).padStart(3, '0');
  return `ORD-${today}-${seq}`;
}

// GET all orders (optional ?status filter, ?limit)
router.get('/', (req, res) => {
  const { status, limit } = req.query;
  let query = `
    SELECT o.*, t.table_number, t.floor_id, f.name as floor_name,
           c.name as customer_name, u.name as staff_name
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN users u ON o.user_id = u.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const orders = req.db.prepare(query).all(...params);

  // Attach items to each order
  const itemStmt = req.db.prepare(`
    SELECT oi.*, p.name as product_name, p.is_veg
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `);

  const result = orders.map(order => ({
    ...order,
    items: itemStmt.all(order.id)
  }));

  res.json(result);
});

// GET single order
router.get('/:id', (req, res) => {
  const order = req.db.prepare(`
    SELECT o.*, t.table_number, t.floor_id, f.name as floor_name,
           c.name as customer_name
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = req.db.prepare(`
    SELECT oi.*, p.name as product_name, p.is_veg
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(req.params.id);

  res.json({ ...order, items });
});

// POST create order
router.post('/', (req, res) => {
  const { table_id, items, customer_id, notes, order_type, user_id, discount } = req.body;

  if (!table_id || !items || !items.length) {
    return res.status(400).json({ error: 'table_id and items are required' });
  }

  // Get active session
  const session = req.db.prepare("SELECT id FROM sessions WHERE status = 'open' ORDER BY id DESC LIMIT 1").get();
  const orderNumber = generateOrderNumber(req.db);

  // Calculate totals
  let totalAmount = 0;
  const productStmt = req.db.prepare('SELECT * FROM products WHERE id = ?');

  const validatedItems = items.map(item => {
    const product = productStmt.get(item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found`);
    const subtotal = product.price * item.quantity;
    const itemTax = subtotal * (product.tax / 100);
    totalAmount += subtotal + itemTax;
    return {
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      price: product.price,
      tax: product.tax,
      uom: product.uom,
      subtotal: subtotal + itemTax,
      discount: item.discount || 0,
      special_instructions: item.notes || item.special_instructions || ''
    };
  });

  totalAmount -= (discount || 0);

  // Insert order
  const orderResult = req.db.prepare(
    `INSERT INTO orders (session_id, table_id, user_id, customer_id, order_number, order_type, status, total_amount, discount, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
  ).run(
    session?.id || null, table_id, user_id || 1, customer_id || null,
    orderNumber, order_type || 'dine_in', totalAmount, discount || 0, notes || ''
  );

  const orderId = orderResult.lastInsertRowid;

  // Insert items
  const insertItem = req.db.prepare(
    'INSERT INTO order_items (order_id, product_id, variant_id, quantity, price, tax, uom, subtotal, discount, special_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  validatedItems.forEach(item => {
    insertItem.run(orderId, item.product_id, item.variant_id, item.quantity, item.price, item.tax, item.uom, item.subtotal, item.discount, item.special_instructions);
  });

  // Mark table as occupied
  req.db.prepare("UPDATE tables SET status = 'occupied', last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(table_id);

  // Create kitchen order for items that go to kitchen
  const kitchenItems = req.db.prepare(`
    SELECT oi.id FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ? AND p.send_to_kitchen = 1
  `).all(orderId);

  if (kitchenItems.length > 0) {
    const kitchenResult = req.db.prepare("INSERT INTO kitchen_orders (order_id, status) VALUES (?, 'to_cook')").run(orderId);
    const insertKitchenItem = req.db.prepare('INSERT INTO kitchen_order_items (kitchen_order_id, order_item_id) VALUES (?, ?)');
    kitchenItems.forEach(ki => insertKitchenItem.run(kitchenResult.lastInsertRowid, ki.id));
  }

  // Get full order for response
  const fullOrder = getFullOrder(req.db, orderId);

  // Emit to kitchen and POS
  req.io.to('kitchen').emit('new-order', fullOrder);
  req.io.emit('order-updated', fullOrder);
  req.io.emit('table-updated', req.db.prepare('SELECT * FROM tables WHERE id = ?').get(table_id));

  res.status(201).json(fullOrder);
});

// PATCH order status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['draft', 'pending', 'preparing', 'completed', 'paid'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  req.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

  // If completed or paid, free the table
  if (status === 'completed' || status === 'paid') {
    const order = req.db.prepare('SELECT table_id FROM orders WHERE id = ?').get(req.params.id);
    if (order) {
      const activeOrders = req.db.prepare(
        "SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status NOT IN ('completed', 'paid') AND id != ?"
      ).get(order.table_id, req.params.id);
      if (activeOrders.count === 0) {
        req.db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(order.table_id);
        req.io.emit('table-updated', req.db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id));
      }
    }
  }

  const fullOrder = getFullOrder(req.db, req.params.id);
  req.io.to('kitchen').emit('order-status-changed', fullOrder);
  req.io.emit('order-updated', fullOrder);

  res.json(fullOrder);
});

function getFullOrder(db, orderId) {
  const order = db.prepare(`
    SELECT o.*, t.table_number, f.name as floor_name, c.name as customer_name
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `).get(orderId);

  const items = db.prepare(`
    SELECT oi.*, p.name as product_name, p.is_veg
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(orderId);

  return { ...order, items };
}

export default router;
=======
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Protect all order routes
router.use(auth);

// POST /api/orders — Create order
router.post('/', orderController.createOrder);

// GET /api/orders/:id — Get single order
router.get('/:id', orderController.getOrderById);

// GET /api/orders/table/:tableId — Get active order for table
router.get('/table/:tableId', orderController.getActiveTableOrder);

// GET /api/orders/session/:sessionId — Get all orders for session
router.get('/session/:sessionId', orderController.getSessionOrders);

// POST /api/orders/:id/items — Add item to order
router.post('/:id/items', orderController.addItem);

// PUT /api/orders/:id/items/:itemId — Update item
router.put('/:id/items/:itemId', orderController.updateItem);

// DELETE /api/orders/:id/items/:itemId — Delete item
router.delete('/:id/items/:itemId', orderController.removeItem);

// PUT /api/orders/:id/status — Update order status
router.put('/:id/status', orderController.updateStatus);

// PUT /api/orders/:id/send-to-kitchen — Send to kitchen
router.put('/:id/send-to-kitchen', orderController.sendToKitchen);

module.exports = router;
>>>>>>> 41017e8b3191164f98fa1c469544a73c868f5f26

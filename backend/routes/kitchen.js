import { Router } from 'express';
const router = Router();

// GET all kitchen orders (active)
router.get('/', (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT ko.*, o.order_number, o.table_id, o.notes as order_notes,
           o.created_at as order_time, t.table_number, f.name as floor_name
    FROM kitchen_orders ko
    JOIN orders o ON ko.order_id = o.id
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE ko.status = ?';
    params.push(status);
  } else {
    query += " WHERE ko.status != 'completed'";
  }

  query += ' ORDER BY ko.id ASC';

  const kitchenOrders = req.db.prepare(query).all(...params);

  // Attach items
  const itemStmt = req.db.prepare(`
    SELECT koi.*, oi.quantity, oi.special_instructions, oi.price,
           p.name as product_name, p.is_veg
    FROM kitchen_order_items koi
    JOIN order_items oi ON koi.order_item_id = oi.id
    JOIN products p ON oi.product_id = p.id
    WHERE koi.kitchen_order_id = ?
  `);

  const result = kitchenOrders.map(ko => ({
    ...ko,
    items: itemStmt.all(ko.id)
  }));

  res.json(result);
});

// PATCH kitchen order status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['to_cook', 'preparing', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  req.db.prepare('UPDATE kitchen_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);

  // If kitchen order is completed, update the main order status too
  if (status === 'completed') {
    const ko = req.db.prepare('SELECT order_id FROM kitchen_orders WHERE id = ?').get(req.params.id);
    if (ko) {
      req.db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(ko.order_id);
      req.io.emit('order-updated', { id: ko.order_id, status: 'completed' });
    }
  }

  if (status === 'preparing') {
    const ko = req.db.prepare('SELECT order_id FROM kitchen_orders WHERE id = ?').get(req.params.id);
    if (ko) {
      req.db.prepare("UPDATE orders SET status = 'preparing' WHERE id = ?").run(ko.order_id);
      req.io.emit('order-updated', { id: ko.order_id, status: 'preparing' });
    }
  }

  // Get updated kitchen order
  const updated = req.db.prepare(`
    SELECT ko.*, o.order_number, t.table_number, f.name as floor_name
    FROM kitchen_orders ko
    JOIN orders o ON ko.order_id = o.id
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
    WHERE ko.id = ?
  `).get(req.params.id);

  req.io.emit('kitchen-order-updated', updated);
  req.io.to('pos').emit('order-status-changed', updated);

  res.json(updated);
});

// PATCH mark individual kitchen item as prepared
router.patch('/items/:id/prepared', (req, res) => {
  req.db.prepare('UPDATE kitchen_order_items SET is_prepared = 1, prepared_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

  const item = req.db.prepare(`
    SELECT koi.*, p.name as product_name
    FROM kitchen_order_items koi
    JOIN order_items oi ON koi.order_item_id = oi.id
    JOIN products p ON oi.product_id = p.id
    WHERE koi.id = ?
  `).get(req.params.id);

  // Check if all items in this kitchen order are prepared
  const stats = req.db.prepare(`
    SELECT COUNT(*) as total, SUM(is_prepared) as prepared
    FROM kitchen_order_items WHERE kitchen_order_id = ?
  `).get(item.kitchen_order_id);

  if (stats.total === stats.prepared) {
    req.db.prepare("UPDATE kitchen_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(item.kitchen_order_id);
    const ko = req.db.prepare('SELECT order_id FROM kitchen_orders WHERE id = ?').get(item.kitchen_order_id);
    if (ko) {
      req.db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(ko.order_id);
      req.io.emit('order-updated', { id: ko.order_id, status: 'completed' });
    }
  }

  req.io.emit('kitchen-item-updated', item);
  res.json(item);
});

export default router;

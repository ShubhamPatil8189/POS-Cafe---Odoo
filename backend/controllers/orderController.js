const pool = require('../config/database');

// Internal utility to recalculate order total
async function recalculateOrderTotal(orderId, connection = pool) {
  const [items] = await connection.query('SELECT subtotal, tax FROM order_lines WHERE order_id = ?', [orderId]);
  
  let subtotal = 0;
  let taxTotal = 0;
  
  items.forEach(item => {
    subtotal += parseFloat(item.subtotal);
    taxTotal += parseFloat(item.tax);
  });
  
  const total = subtotal + taxTotal;
  
  await connection.query(
    'UPDATE orders SET subtotal = ?, tax_total = ?, total = ? WHERE id = ?',
    [subtotal.toFixed(2), taxTotal.toFixed(2), total.toFixed(2), orderId]
  );
  
  return { subtotal, taxTotal, total };
}

// Internal utility to check if order is modifiable
async function isOrderModifiable(orderId, connection = pool) {
  const [orders] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
  if (orders.length === 0) return { error: 'Order not found', status: 404 };
  const status = orders[0].status;
  if (['completed', 'cancelled'].includes(status)) {
    return { error: `Order is ${status} and cannot be modified.`, status: 400 };
  }
  return { modifiable: true };
}

// ── Create Order ───────────────────────────────────────
exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { session_id, table_id, user_id, order_type = 'pos', checkout_type = 'kitchen', is_paid = false } = req.body;
    
    // Generate Order Number (e.g., ORD-20260404-XXXX)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const orderNumber = `ORD-${dateStr}-${randomHex}`;

    const [result] = await connection.query(
      `INSERT INTO orders (order_number, session_id, table_id, user_id, status, source, checkout_type, is_paid)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      [orderNumber, session_id || null, table_id || null, user_id || null, order_type, checkout_type, is_paid]
    );

    // If table provided, set table status to occupied
    if (table_id) {
      await connection.query(`UPDATE tables SET status = 'occupied' WHERE id = ?`, [table_id]);
    }

    await connection.commit();
    const [created] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  } finally {
    connection.release();
  }
};

// ── Get All Orders ─────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status, session_id, table_id, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (session_id) {
      query += ' AND session_id = ?';
      params.push(session_id);
    }
    if (table_id) {
      query += ' AND table_id = ?';
      params.push(table_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// ── Get Single Order ───────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found.' });
    
    const [items] = await pool.query('SELECT * FROM order_lines WHERE order_id = ?', [id]);
    
    // You could fetch table details here too if needed
    const order = orders[0];
    order.items = items;
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// ── Get Active Order For Table ─────────────────────────
exports.getActiveTableOrder = async (req, res) => {
  try {
    const { tableId } = req.params;
    
    // Find an order for this table that hasn't been completed/cancelled
    const [orders] = await pool.query(
      `SELECT * FROM orders 
       WHERE table_id = ? AND status NOT IN ('completed', 'cancelled')
       ORDER BY created_at DESC LIMIT 1`,
      [tableId]
    );
    
    if (orders.length === 0) return res.status(404).json({ error: 'No active order for this table.' });
    
    const order = orders[0];
    const [items] = await pool.query('SELECT * FROM order_lines WHERE order_id = ?', [order.id]);
    order.items = items;
    
    res.json(order);
  } catch (error) {
    console.error('Get table order error:', error);
    res.status(500).json({ error: 'Failed to fetch active order for table.' });
  }
};

// ── Get All Orders for Session ─────────────────────────
exports.getSessionOrders = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC', [sessionId]);
    res.json(orders);
  } catch (error) {
    console.error('Get session orders error:', error);
    res.status(500).json({ error: 'Failed to fetch session orders.' });
  }
};

// ── Add Item to Order ──────────────────────────────────
exports.addItem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params; // order id
    const { product_id, product_name, quantity, price, tax_rate, notes } = req.body;

    if (!product_id || !product_name || !price) {
      return res.status(400).json({ error: 'product_id, product_name, and price are required.' });
    }

    // Status Guard
    const guard = await isOrderModifiable(id, connection);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    const qty = quantity || 1;
    
    // CONSOLIDATION LOGIC: Check if item already exists
    const [existing] = await connection.query(
      'SELECT id, quantity FROM order_lines WHERE order_id = ? AND product_id = ? AND (notes = ? OR (notes IS NULL AND ? IS NULL))',
      [id, product_id, notes || null, notes || null]
    );

    let lineId;
    if (existing.length > 0) {
      // Update existing line
      lineId = existing[0].id;
      const newQty = parseFloat(existing[0].quantity) + parseFloat(qty);
      const newSubtotal = parseFloat(price) * newQty;
      const newTax = newSubtotal * ((parseFloat(tax_rate) || 0) / 100);

      await connection.query(
        'UPDATE order_lines SET quantity = ?, subtotal = ?, tax = ? WHERE id = ?',
        [newQty, newSubtotal.toFixed(2), newTax.toFixed(2), lineId]
      );
    } else {
      // Insert new line
      const itemSubtotal = parseFloat(price) * qty;
      const itemTax = itemSubtotal * ((parseFloat(tax_rate) || 0) / 100);

      const [result] = await connection.query(
        `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, tax, subtotal, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, product_id, product_name, qty, price, itemTax.toFixed(2), itemSubtotal.toFixed(2), notes || null]
      );
      lineId = result.insertId;
    }

    // Recalculate full order
    await recalculateOrderTotal(id, connection);
    
    await connection.commit();
    const [created] = await pool.query('SELECT * FROM order_lines WHERE id = ?', [lineId]);
    res.status(201).json(created[0]);
  } catch (error) {
    await connection.rollback();
    require('fs').appendFileSync('error.log', 'Add item error: ' + error.stack + '\n');
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item to order.' });
  } finally {
    connection.release();
  }
};

// ── Update Item Quantity/Notes ─────────────────────────
exports.updateItem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id, itemId } = req.params; // order id, line item id
    const { quantity, notes } = req.body;

    // Status Guard
    const guard = await isOrderModifiable(id, connection);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    const [existing] = await connection.query('SELECT * FROM order_lines WHERE id = ? AND order_id = ?', [itemId, id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Item not found in order.' });
    
    const item = existing[0];
    const newQty = quantity !== undefined ? parseFloat(quantity) : item.quantity;
    
    const newSubtotal = parseFloat(item.unit_price) * newQty;
    // Reverse engineer tax rate from old tax amount, or just calculate proportionally
    const taxRate = item.subtotal > 0 ? (parseFloat(item.tax) / parseFloat(item.subtotal)) : 0;
    const newTax = newSubtotal * taxRate;

    await connection.query(
      'UPDATE order_lines SET quantity = ?, subtotal = ?, tax = ?, notes = ? WHERE id = ?',
      [newQty, newSubtotal.toFixed(2), newTax.toFixed(2), notes !== undefined ? notes : item.notes, itemId]
    );

    await recalculateOrderTotal(id, connection);
    await connection.commit();
    
    const [updated] = await pool.query('SELECT * FROM order_lines WHERE id = ?', [itemId]);
    res.json(updated[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item.' });
  } finally {
    connection.release();
  }
};

// ── Remove Item ────────────────────────────────────────
exports.removeItem = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id, itemId } = req.params;

    // Status Guard
    const guard = await isOrderModifiable(id, connection);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    const [existing] = await connection.query('SELECT id FROM order_lines WHERE id = ? AND order_id = ?', [itemId, id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Item not found.' });

    await connection.query('DELETE FROM order_lines WHERE id = ?', [itemId]);
    
    await recalculateOrderTotal(id, connection);
    await connection.commit();
    
    res.json({ message: 'Item removed successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error('Remove item error:', error);
    res.status(500).json({ error: 'Failed to remove item.' });
  } finally {
    connection.release();
  }
};

// ── Update Order Status ────────────────────────────────
exports.updateStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // TABLE STATUS AUTO-RELEASE: If order is completed or cancelled, set table to available
    if (['completed', 'cancelled'].includes(status)) {
      const [order] = await connection.query('SELECT table_id FROM orders WHERE id = ?', [id]);
      if (order.length > 0 && order[0].table_id) {
        await connection.query("UPDATE tables SET status = 'available' WHERE id = ?", [order[0].table_id]);
      }
    }

    await connection.commit();
    res.json({ id, status });
  } catch (error) {
    await connection.rollback();
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  } finally {
    connection.release();
  }
};

// ── Send to Kitchen ────────────────────────────────────
exports.sendToKitchen = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Status Guard
    const guard = await isOrderModifiable(id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    // 1. Get the order
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found.' });
    const order = orders[0];

    // 2. Set order status to preparing
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['preparing', id]);
    
    // NOTE: Module D (Person 4) is responsible for the actual 'kitchen_orders' tables
    // Since the seed.js didn't create 'kitchen_orders' (it's part of D), 
    // we only update order status here and update order_lines kitchen_status.
    
    await pool.query(`UPDATE order_lines SET kitchen_status = 'preparing' WHERE order_id = ? AND kitchen_status = 'pending'`, [id]);

    // 3. Emit socket event if io exists (Person 4 wires this up)
    const io = req.app.get('io');
    if (io) {
      // Get full order details for the kitchen
      const [items] = await pool.query('SELECT * FROM order_lines WHERE order_id = ?', [id]);
      io.emit('kitchen:new-order', {
        orderId: order.id,
        orderNumber: order.order_number,
        tableId: order.table_id,
        items
      });
    }

    res.json({ message: 'Sent to kitchen section successfully.' });
  } catch (error) {
    console.error('Send to kitchen error:', error);
    res.status(500).json({ error: 'Failed to send to kitchen.' });
  }
};

const pool = require('../config/database');

// GET /api/kitchen/orders/active
exports.getActiveOrders = async (req, res) => {
  try {
    // Fetch orders that are preparing or ready
    const [orders] = await pool.query(
      `SELECT id, order_number, table_id as table_number, status, notes, updated_at 
       FROM orders 
       WHERE status IN ('preparing', 'ready') 
       ORDER BY updated_at ASC`
    );

    // If no orders, return early
    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.id);
    
    // Fetch order lines (items) for these active orders
    const [items] = await pool.query(
      `SELECT id, order_id, product_name, quantity, kitchen_status, notes 
       FROM order_lines 
       WHERE order_id IN (?)`,
      [orderIds]
    );

    // Group items into their respective orders
    const itemsMap = {};
    items.forEach(item => {
      if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
      // Translate kitchen_status into is_prepared boolean for the frontend
      itemsMap[item.order_id].push({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        is_prepared: item.kitchen_status === 'ready',
        special_instructions: item.notes
      });
    });

    // Attach items array and format correctly
    const formattedOrders = orders.map(order => ({
      ...order,
      items: itemsMap[order.id] || []
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Fetch active kitchen orders error:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen orders.' });
  }
};

// PUT /api/kitchen/orders/:id/stage
exports.updateOrderStage = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['preparing', 'ready', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid kitchen status.' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    
    // If ticket is completed, mark all its items ready internally
    if (status === 'completed' || status === 'ready') {
       await conn.query(`UPDATE order_lines SET kitchen_status = 'ready' WHERE order_id = ?`, [id]);
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('kitchen:stage-updated', { orderId: id, stage: status });
      // Notify customer display if they are watching
      io.to(`customer:${id}`).emit('kitchen:stage-updated', { orderId: id, stage: status });
    }

    res.json({ id, status, updated_at: new Date() });
  } catch(error) {
    await conn.rollback();
    console.error('Update kitchen stage error:', error);
    res.status(500).json({ error: 'Failed to update stage.' });
  } finally {
    conn.release();
  }
};

// PUT /api/kitchen/orders/:id/items/:itemId
exports.markItemPrepared = async (req, res) => {
  const { id, itemId } = req.params;
  const { is_prepared } = req.body;

  const kitchen_status = is_prepared ? 'ready' : 'preparing';
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.query('UPDATE order_lines SET kitchen_status = ? WHERE id = ?', [kitchen_status, itemId]);

    // Check if ALL items in this order are now prepared
    const [allItems] = await conn.query('SELECT kitchen_status FROM order_lines WHERE order_id = ?', [id]);
    const allReady = allItems.every(item => item.kitchen_status === 'ready');

    let orderStatusChanged = null;

    if (allReady) {
      // Auto move the root order to 'ready'
      await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['ready', id]);
      orderStatusChanged = 'ready';
    } else {
      // Ensure the root order says 'preparing'
      await conn.query('UPDATE orders SET status = ? WHERE id = ?', ['preparing', id]);
      orderStatusChanged = 'preparing';
    }

    await conn.commit();

    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('kitchen:item-prepared', { orderId: id, itemId, isPrepared: is_prepared });
      if (orderStatusChanged) {
        io.to('kitchen').emit('kitchen:stage-updated', { orderId: id, stage: orderStatusChanged });
      }
    }

    res.json({ id: itemId, is_prepared, prepared_at: is_prepared ? new Date() : null, orderStatusChanged });
  } catch(error) {
    await conn.rollback();
    console.error('Mark item prepared error:', error);
    res.status(500).json({ error: 'Failed to mark item prepared.' });
  } finally {
    conn.release();
  }
};

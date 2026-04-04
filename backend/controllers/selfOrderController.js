const pool = require('../config/database');
const crypto = require('crypto');

// Internal utility to recalculate order total (replicated from orderController for decoupling)
async function recalculateOrderTotal(orderId) {
  const [items] = await pool.query('SELECT subtotal, tax FROM order_lines WHERE order_id = ?', [orderId]);

  let subtotal = 0;
  let taxTotal = 0;

  items.forEach(item => {
    subtotal += parseFloat(item.subtotal);
    taxTotal += parseFloat(item.tax);
  });

  for (let i = 0; i < items.length; i++) {
    console.log(items[i].subtotal);
    console.log(items[i].tax);
  }

  const total = subtotal + taxTotal;

  await pool.query(
    'UPDATE orders SET subtotal = ?, tax_total = ?, total = ? WHERE id = ?',
    [subtotal.toFixed(2), taxTotal.toFixed(2), total.toFixed(2), orderId]
  );

  return { subtotal, taxTotal, total };
}

// ── GET /api/self-order/qr-codes ────────────────────────
exports.getQRData = async (req, res) => {
  try {
    const [tables] = await pool.query('SELECT id, table_number FROM tables WHERE is_active = TRUE');
    const baseUrl = process.env.FRONTEND_SELF_ORDER_URL || 'http://localhost:5173/self-order';

    const qrData = tables.map(t => ({
      table_id: t.id,
      table_number: t.table_number,
      qr_url: `${baseUrl}?tableId=${t.id}`
    }));

    res.json(qrData);
  } catch (error) {
    console.error('Get QR Data error:', error);
    res.status(500).json({ error: 'Failed to fetch QR data.' });
  }
};

// ── POST /api/self-order/place-order ────────────────────
exports.placeOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { table_id, items, checkout_type } = req.body; // checkout_type: 'advance' or 'kitchen'

    if (!table_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Table ID and items are required.' });
    }

    if (!['advance', 'kitchen'].includes(checkout_type)) {
      return res.status(400).json({ error: 'Invalid checkout type.' });
    }

    // 1. Generate Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const orderNumber = `SELF-${dateStr}-${randomHex}`;

    // 2. Create Order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, table_id, status, source, checkout_type, is_paid)
       VALUES (?, ?, 'confirmed', 'self-order', ?, ?)`,
      [orderNumber, table_id, checkout_type, checkout_type === 'advance']
    );
    const orderId = orderResult.insertId;

    // 3. Insert Order Lines
    for (const item of items) {
      const { product_id, name, quantity, price, tax_rate, notes } = item;
      const qty = quantity || 1;
      const itemSubtotal = parseFloat(price) * qty;
      const itemTax = itemSubtotal * ((parseFloat(tax_rate) || 0) / 100);

      await connection.query(
        `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, tax, subtotal, notes, kitchen_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [orderId, product_id, name, qty, price, itemTax.toFixed(2), itemSubtotal.toFixed(2), notes || null]
      );
    }

    // 4. Update Table Status
    if (checkout_type === 'advance') {
      // Pay in Advance: Mark occupied with 30-minute timer
      const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now
      await connection.query(
        `UPDATE tables SET status = 'occupied', self_order_expiry = ? WHERE id = ?`,
        [expiryDate, table_id]
      );
    } else {
      // Send to Kitchen: Mark occupied, no timer
      await connection.query(
        `UPDATE tables SET status = 'occupied', self_order_expiry = NULL WHERE id = ?`,
        [table_id]
      );
    }

    await connection.commit();

    // 5. Finalize totals (async)
    await recalculateOrderTotal(orderId);

    // 6. Notify Kitchen via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const [orderLines] = await pool.query('SELECT * FROM order_lines WHERE order_id = ?', [orderId]);
      io.emit('kitchen:new-order', {
        orderId,
        orderNumber,
        tableId: table_id,
        source: 'self-order',
        items: orderLines
      });
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      order_id: orderId,
      order_number: orderNumber,
      checkout_type
    });

  } catch (error) {
    await connection.rollback();
    console.error('Place self-order error:', error);
    res.status(500).json({ error: 'Failed to place self-order.' });
  } finally {
    connection.release();
  }
};

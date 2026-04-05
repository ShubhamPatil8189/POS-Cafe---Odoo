const pool = require('../config/database');

// GET /api/customer-display/board
exports.getActiveBoardOrders = async (req, res) => {
  try {
    // Fetch orders that are currently active or completed very recently
    // This feeds the customer display (Preparing, Ready, and the Ticker)
    const [orders] = await pool.query(
      `SELECT id, order_number, table_id, status, is_paid, created_at, updated_at 
       FROM orders 
       WHERE (status IN ('preparing', 'ready', 'confirmed'))
          OR (status = 'completed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE))
       ORDER BY created_at ASC`
    );

    let items = [];
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [lines] = await pool.query(
        `SELECT order_id, product_name as name, quantity as qty FROM order_lines WHERE order_id IN (?)`, 
        [orderIds]
      );
      items = lines;
    }

    const formattedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      tableNumber: o.table_id || '—',
      status: o.status,
      paid: Boolean(o.is_paid),
      createdAt: new Date(o.created_at).getTime(),
      items: items.filter(i => i.order_id === o.id),
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Fetch active board orders error:', error);
    res.status(500).json({ error: 'Failed to fetch board data.' });
  }
};

exports.getCustomerDisplay = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order details
    const [orders] = await pool.query(
      `SELECT o.order_number, o.table_id as table_number, o.total as total_amount, o.tax_total as tax_amount, o.status,
              p.status as payment_status, p.method_id
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       WHERE o.id = ?`,
       [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orders[0];

    // Determine final payment status manually if payment record doesn't strictly align
    let payment_status = 'unpaid';
    if (order.payment_status === 'completed' || order.status === 'completed') {
      payment_status = 'paid';
    }

    // Fetch items
    const [items] = await pool.query(
      `SELECT product_name as name, quantity, unit_price as price, subtotal
       FROM order_lines
       WHERE order_id = ?`,
       [orderId]
    );

    res.json({
      order_number: order.order_number,
      table_number: order.table_number,
      items: items.map(i => ({ ...i, quantity: parseFloat(i.quantity).toFixed(0) })),
      total_amount: parseFloat(order.total_amount),
      tax_amount: parseFloat(order.tax_amount),
      payment_status
    });

  } catch (error) {
    console.error('Fetch customer display error:', error);
    res.status(500).json({ error: 'Failed to fetch customer display data.' });
  }
};

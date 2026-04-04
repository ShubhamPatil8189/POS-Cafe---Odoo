const pool = require('../config/database');

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

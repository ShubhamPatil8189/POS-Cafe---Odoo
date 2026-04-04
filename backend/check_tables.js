const pool = require('./config/database');
async function check() {
  try {
    const [orders] = await pool.query('SHOW TABLES LIKE "orders"');
    const [payments] = await pool.query('SHOW TABLES LIKE "payments"');
    const [orderItems] = await pool.query('SHOW TABLES LIKE "order_items"');
    console.log({
      orders: orders.length > 0,
      payments: payments.length > 0,
      order_items: orderItems.length > 0
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

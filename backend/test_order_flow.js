const pool = require('./config/database');

async function testFlow() {
  try {
    // 1. Create order (like PaymentScreen does)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const orderNumber = `TEST-${dateStr}-${randomHex}`;

    const [result] = await pool.query(
      `INSERT INTO orders (order_number, status, source) VALUES (?, 'draft', 'pos')`,
      [orderNumber]
    );
    const orderId = result.insertId;
    console.log(`✅ Created order #${orderId} (${orderNumber})`);

    // 2. Add an item (simulate PaymentScreen adding cart items)
    const [itemResult] = await pool.query(
      `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, tax, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, 1, 'Test Item', 2, 199.50, 19.95, 399.00]
    );
    console.log(`✅ Added item, line ID: ${itemResult.insertId}`);

    // 3. Recalculate total (like addItem controller does)
    const [items] = await pool.query('SELECT subtotal, tax FROM order_lines WHERE order_id = ?', [orderId]);
    let subtotal = 0, taxTotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.subtotal);
      taxTotal += parseFloat(item.tax);
    });
    const total = subtotal + taxTotal;
    await pool.query('UPDATE orders SET subtotal = ?, tax_total = ?, total = ? WHERE id = ?',
      [subtotal.toFixed(2), taxTotal.toFixed(2), total.toFixed(2), orderId]);
    console.log(`✅ Recalculated total: ₹${total.toFixed(2)}`);

    // 4. Check what Razorpay would see
    const [orders] = await pool.query('SELECT id, total, order_number FROM orders WHERE id = ?', [orderId]);
    const order = orders[0];
    const amountInPaise = Math.round(Number(order.total) * 100);
    console.log(`✅ Razorpay would see: order_id=${order.id}, total=${order.total}, paise=${amountInPaise}`);

    // Cleanup
    await pool.query('DELETE FROM order_lines WHERE order_id = ?', [orderId]);
    await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);
    console.log(`✅ Cleaned up test data`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
testFlow();

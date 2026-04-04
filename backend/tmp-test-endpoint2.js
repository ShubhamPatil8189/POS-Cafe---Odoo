const pool = require('./config/database');

async function run() {
  try {
    const [orders] = await pool.query('SELECT id, total FROM orders ORDER BY id DESC LIMIT 5');
    console.log("Last 5 Orders:", orders);

    let validOrder = orders.find(o => Number(o.total) > 0);
    if (validOrder) {
        console.log("Testing with order:", validOrder);
        const resp = await fetch('http://localhost:5000/api/payments/razorpay/order', {
            method: 'POST',
            body: JSON.stringify({order_id: validOrder.id}),
            headers: {'content-type': 'application/json'}
        });
        const json = await resp.json();
        console.log("Razorpay Order creation result:", resp.status, json);
    } else {
        console.log("No orders with total > 0 found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

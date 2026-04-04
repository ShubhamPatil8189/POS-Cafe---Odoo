const pool = require('./config/database');

async function run() {
  try {
    const [orders] = await pool.query('SELECT id, total FROM orders ORDER BY id DESC LIMIT 1');
    console.log("Last Order:", orders[0]);

    if (orders.length > 0) {
        const order_id = orders[0].id;
        const resp = await fetch('http://localhost:5000/api/payments/razorpay/order', {
            method: 'POST',
            body: JSON.stringify({order_id}),
            headers: {'content-type': 'application/json'}
        });
        const json = await resp.json();
        console.log("Razorpay Order creation result:", resp.status, json);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

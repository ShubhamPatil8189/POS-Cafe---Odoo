async function run() {
  try {
    const orderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_type: 'pos' })
    });
    const order = await orderRes.json();
    console.log("Created Draft Order:", order);

    const itemRes = await fetch(`http://localhost:5000/api/orders/${order.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: 1,
        product_name: 'Test Product',
        quantity: 1,
        price: 150.50,
        tax_rate: 5
      })
    });
    console.log("Add Item Status:", itemRes.status);
    const itemText = await itemRes.text();
    console.log("Add Item Response:", itemText);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

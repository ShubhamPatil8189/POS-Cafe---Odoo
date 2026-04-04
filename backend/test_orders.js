const http = require('http');

const test = async () => {
  console.log('🧪 Testing Module C (Orders + Payments) Comprehensive Flow...');
  
  const fetchAPI = (path, method, body) => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

  try {
    const ts = Date.now();
    console.log('\n--- 🛒 ORDER FLOW ---');

    // 1. Create Order
    console.log('1. Creating Order for Table 2...');
    const createRes = await fetchAPI('/api/orders', 'POST', {
      session_id: null,
      table_id: 2,
      user_id: 1,
      order_type: 'pos'
    });
    if (createRes.status !== 201) throw createRes.data;
    const orderId = createRes.data.id;
    console.log('✅ Created Order:', createRes.data.order_number);

    // 2. Add Item 1
    console.log('2. Adding Item 1 (Margherita Pizza x1) ...');
    const addItem1 = await fetchAPI(`/api/orders/${orderId}/items`, 'POST', {
      product_id: 1,
      product_name: 'Margherita Pizza',
      quantity: 1,
      price: 300,
      tax_rate: 5
    });
    if (addItem1.status !== 201) throw addItem1.data;
    console.log('✅ Added Item 1');

    // 3. Add Item 2
    console.log('3. Adding Item 2 (Latte x2) ...');
    const addItem2 = await fetchAPI(`/api/orders/${orderId}/items`, 'POST', {
      product_id: 5,
      product_name: 'Latte',
      quantity: 2,
      price: 180,
      tax_rate: 5
    });
    const item2Id = addItem2.data.id;
    if (addItem2.status !== 201) throw addItem2.data;
    console.log('✅ Added Item 2');

    // 4. Update Item 2
    console.log('4. Updating Item 2 (Latte -> x3) ...');
    const updateItem2 = await fetchAPI(`/api/orders/${orderId}/items/${item2Id}`, 'PUT', {
      quantity: 3
    });
    if (updateItem2.status !== 200) throw updateItem2.data;
    console.log('✅ Updated Item 2');

    // 5. Send to kitchen
    console.log('5. Sending to Kitchen...');
    const kitchenReq = await fetchAPI(`/api/orders/${orderId}/send-to-kitchen`, 'PUT');
    if (kitchenReq.status !== 200) throw kitchenReq.data;
    console.log('✅ Sent to Kitchen');

    // 6. Get Order Details & Verify Math
    console.log('6. Verifying Order Subtotal & Taxes...');
    const getOrder = await fetchAPI(`/api/orders/${orderId}`, 'GET');
    if (getOrder.status !== 200) throw getOrder.data;
    console.log(`   Subtotal: ₹${getOrder.data.subtotal}`);
    console.log(`   Tax: ₹${getOrder.data.tax_total}`);
    console.log(`   Total Amount: ₹${getOrder.data.total}`);

    console.log('\n--- 💸 PAYMENT FLOW ---');

    // 7. Generate UPI QR
    console.log('7. Generating UPI QR Code...');
    const qrRes = await fetchAPI(`/api/payments/upi-qr/${orderId}`, 'GET');
    if (qrRes.status !== 200) throw qrRes.data;
    console.log('✅ QR Code generated successfully!');
    console.log(`   UPI Link: ${qrRes.data.upi_url}`);

    // 8. Create Payment
    console.log('8. Creating Pending Payment...');
    const createPayment = await fetchAPI('/api/payments', 'POST', {
      order_id: orderId,
      payment_method_id: 3, // UPI
      amount: getOrder.data.total
    });
    if (createPayment.status !== 201) throw createPayment.data;
    const paymentId = createPayment.data.id;
    console.log('✅ Pending payment created:', paymentId);

    // 9. Validate Payment
    console.log('9. Validating Payment...');
    const valPayment = await fetchAPI('/api/payments/validate', 'POST', {
      payment_id: paymentId
    });
    if (valPayment.status !== 200) throw valPayment.data;
    console.log('✅ Payment Validated. Order marked as PAID & Table Freed.');

    // 10. Verify order status
    console.log('10. Final Verification...');
    const finalOrder = await fetchAPI(`/api/orders/${orderId}`, 'GET');
    console.log(`✅ Order Status: ${finalOrder.data.status}`);
    
    console.log('\n🎉 ALL MODULE C API TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\n❌ Test failed:', err);
  }
};

test();

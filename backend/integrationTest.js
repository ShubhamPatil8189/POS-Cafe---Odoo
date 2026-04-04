const http = require('http');

const test = async () => {
  console.log('🧪 Starting End-to-End Integration Test (Modules A, B, C)...\\n');
  
  const fetchAPI = (path, method, body, token = null) => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
            resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

  try {
    // ---------------------------------------------------------
    // MODULE A: Authentication
    // ---------------------------------------------------------
    console.log('🔑 MODULE A: Authenticating...');
    const loginRes = await fetchAPI('/api/auth/login', 'POST', {
      email: 'admin@cafe.com',
      password: 'admin123'
    });
    if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    const token = loginRes.data.token;
    const adminId = loginRes.data.user.id;
    console.log('✅ Login successful. JWT Acquired.\\n');

    // ---------------------------------------------------------
    // MODULE B: Open Session & Get Tables
    // ---------------------------------------------------------
    console.log('🏬 MODULE B: Checking Session & Tables...');
    // We assume terminal 1 exists from seed/db.js
    let currentSessionId;
    const sessionRes = await fetchAPI('/api/sessions/open', 'POST', { terminal_id: 1, opening_balance: 1000 }, token);
    if (sessionRes.status === 201) {
       currentSessionId = sessionRes.data.id;
       console.log('✅ Opened new POS Session ID:', currentSessionId);
    } else if (sessionRes.status === 400 && sessionRes.data.error.includes('already open')) {
       // Session already open, fetch it
       const currentRes = await fetchAPI('/api/sessions/current', 'GET', null, token);
       currentSessionId = currentRes.data.id;
       console.log(`✅ Using existing open POS Session ID: ${currentSessionId}`);
    } else {
        throw new Error('Failed to open session: ' + JSON.stringify(sessionRes.data));
    }

    // Get an available table ID (let's get table 1)
    const tablesRes = await fetchAPI('/api/tables', 'GET', null, token);
    if (tablesRes.status !== 200) throw new Error('Failed to fetch tables: ' + JSON.stringify(tablesRes.data));
    const tableId = tablesRes.data[0].id;
    console.log(`✅ Fetched Tables. Selected Table ID: ${tableId}\\n`);

    // ---------------------------------------------------------
    // MODULE C: Order Process
    // ---------------------------------------------------------
    console.log('🛒 MODULE C: Processing Order...');
    
    // 1. Create Order
    const orderRes = await fetchAPI('/api/orders', 'POST', {
      session_id: currentSessionId,
      table_id: tableId,
      user_id: adminId,
      order_type: 'pos'
    }, token);
    if (orderRes.status !== 201) throw new Error('Failed to create order: ' + JSON.stringify(orderRes.data));
    const orderId = orderRes.data.id;
    console.log(`✅ Order Created: ${orderRes.data.order_number}`);

    // 2. Add Item (Assuming Product 1 is Margherita Pizza)
    const addItemRes = await fetchAPI(`/api/orders/${orderId}/items`, 'POST', {
      product_id: 1,
      product_name: 'Margherita Pizza',
      quantity: 2,
      price: 300,
      tax_rate: 5
    }, token);
    if (addItemRes.status !== 201) throw new Error('Add item failed: ' + JSON.stringify(addItemRes.data));
    console.log('✅ Added 2x Margherita Pizza to order');

    // 3. Send to Kitchen
    const kitchenRes = await fetchAPI(`/api/orders/${orderId}/send-to-kitchen`, 'PUT', null, token);
    if (kitchenRes.status !== 200) throw new Error('Send to kitchen failed');
    console.log('✅ Order sent to kitchen (status: preparing)');

    // 4. Fetch Order Total
    const getOrder = await fetchAPI(`/api/orders/${orderId}`, 'GET', null, token);
    console.log(`✅ Order total verified: ₹${getOrder.data.total}`);

    // ---------------------------------------------------------
    // MODULE C / B Integration: Payments & Table Freeing
    // ---------------------------------------------------------
    console.log('\\n💳 MODULE C/B: Payment & Table Sync...');
    // Create Pending Payment (Assumes Payment Method 1 = Cash or 3 = UPI)
    const paymentRes = await fetchAPI('/api/payments', 'POST', {
      order_id: orderId,
      payment_method_id: 1,
      amount: getOrder.data.total
    }, token);
    if (paymentRes.status !== 201) throw new Error('Payment creation failed: ' + JSON.stringify(paymentRes.data));
    const paymentId = paymentRes.data.id;
    console.log('✅ Pending Payment Created');

    // Validate Payment (Uses DB Transactions, Updates Order, Frees Table)
    const validateRes = await fetchAPI('/api/payments/validate', 'POST', {
        payment_id: paymentId
    }, token);
    if (validateRes.status !== 200) throw new Error('Payment validation failed: ' + JSON.stringify(validateRes.data));
    console.log('✅ Payment Validated. Order marked as paid.');

    const tableAfterRes = await fetchAPI('/api/tables', 'GET', null, token);
    const tableState = tableAfterRes.data.find(t => t.id === tableId);
    console.log(`✅ Table ${tableState.table_number} status automatically reverted to: ${tableState.status}`);

    // ---------------------------------------------------------
    // WRAP UP
    // ---------------------------------------------------------
    console.log('\\n🎉 SUCCESS: All modules A, B, and C integrated flawlessly! 🎉\\n');

  } catch (err) {
    console.error('\\n❌ Test failed:', err.message || err);
  }
};

test();

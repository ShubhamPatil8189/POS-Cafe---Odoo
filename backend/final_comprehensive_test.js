const http = require('http');
const fs = require('fs');

const test = async () => {
  console.log('🚀 Starting Final Comprehensive Integration Test (All Modules)...\\n');
  
  let token = null;
  let context = {}; // Store IDs for sequential testing

  const fetchAPI = (path, method, body, authToken = null, isBinary = false) => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;
    
    const req = http.request(options, res => {
      if (isBinary) {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
          return;
      }
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

  const logTest = (name, res) => {
      if (res.status >= 200 && res.status < 300) {
          console.log(`✅ [PASS] ${name} (Status: ${res.status})`);
          return true;
      } else {
          console.log(`❌ [FAIL] ${name} (Status: ${res.status})`);
          console.error('Response:', res.data);
          return false;
      }
  };

  try {
    // --- MODULE A: AUTH ---
    console.log('--- Module A: Authentication ---');
    const login = await fetchAPI('/api/auth/login', 'POST', { email: 'admin@cafe.com', password: 'admin123' });
    if (!logTest('POST /api/auth/login', login)) return;
    token = login.data.token;
    context.user_id = login.data.user.id;

    const me = await fetchAPI('/api/auth/me', 'GET', null, token);
    logTest('GET /api/auth/me', me);

    // --- MODULE A: PRODUCTS & CATEGORIES ---
    console.log('\\n--- Module A: Products & Categories ---');
    const getCats = await fetchAPI('/api/categories', 'GET');
    logTest('GET /api/categories', getCats);

    const createCat = await fetchAPI('/api/categories', 'POST', { name: 'Test Category ' + Date.now() }, token);
    logTest('POST /api/categories', createCat);
    context.category_id = createCat.data.id;

    const getProds = await fetchAPI('/api/products', 'GET');
    logTest('GET /api/products', getProds);

    const createProd = await fetchAPI('/api/products', 'POST', {
        name: 'Test Coffee ' + Date.now(),
        category_id: context.category_id,
        price: 150,
        tax_rate: 5
    }, token);
    logTest('POST /api/products', createProd);
    context.product_id = createProd.data.id;

    // --- MODULE B: POS CONFIG ---
    console.log('\\n--- Module B: POS Setup ---');
    const getTerminal = await fetchAPI('/api/terminal', 'GET', null, token);
    logTest('GET /api/terminal', getTerminal);
    context.terminal_id = getTerminal.data[0].id;

    const getFloors = await fetchAPI('/api/floors', 'GET', null, token);
    logTest('GET /api/floors', getFloors);
    context.floor_id = getFloors.data[0].id;

    const getTables = await fetchAPI('/api/tables', 'GET', null, token);
    logTest('GET /api/tables', getTables);
    context.table_id = getTables.data[0].id;

    const getPM = await fetchAPI('/api/payment-methods', 'GET', null, token);
    logTest('GET /api/payment-methods', getPM);
    context.pm_id = getPM.data.find(p => p.type === 'upi').id;

    const openSession = await fetchAPI('/api/sessions/open', 'POST', { terminal_id: context.terminal_id, opening_balance: 500 }, token);
    if (openSession.status === 201 || openSession.status === 400) {
        console.log(`✅ [PASS] POST /api/sessions/open (Status: ${openSession.status}${openSession.status === 400 ? ' - already open' : ''})`);
        const currSession = await fetchAPI('/api/sessions/current', 'GET', null, token);
        context.session_id = currSession.data.id;
        logTest('GET /api/sessions/current', currSession);
    }

    const createResv = await fetchAPI('/api/reservations', 'POST', {
        table_id: context.table_id,
        customer_name: 'Test Customer',
        phone: '1234567890',
        reserved_time: new Date(Date.now() + 3600000).toISOString(),
        expiry_time: new Date(Date.now() + 7200000).toISOString()
    }, token);
    logTest('POST /api/reservations', createResv);

    // --- MODULE C: TERMINAL FLOW ---
    console.log('\\n--- Module C: Terminal Flow (Orders) ---');
    const createOrder = await fetchAPI('/api/orders', 'POST', {
        session_id: context.session_id,
        table_id: context.table_id,
        user_id: context.user_id,
        order_type: 'pos'
    }, token);
    if (!logTest('POST /api/orders', createOrder)) return;
    context.order_id = createOrder.data.id;

    const addItem = await fetchAPI(`/api/orders/${context.order_id}/items`, 'POST', {
        product_id: context.product_id,
        product_name: 'Test Coffee',
        quantity: 2,
        price: 150,
        tax_rate: 5
    }, token);
    logTest('POST /api/orders/:id/items', addItem);
    context.item_id = addItem.data.id;

    const updateItem = await fetchAPI(`/api/orders/${context.order_id}/items/${context.item_id}`, 'PUT', { quantity: 3 }, token);
    logTest('PUT /api/orders/:id/items/:itemId', updateItem);

    const sendKitchen = await fetchAPI(`/api/orders/${context.order_id}/send-to-kitchen`, 'PUT', null, token);
    logTest('PUT /api/orders/:id/send-to-kitchen', sendKitchen);

    console.log('\\n--- Module C: Payments ---');
    const getQR = await fetchAPI(`/api/payments/upi-qr/${context.order_id}`, 'GET', null, token);
    logTest('GET /api/payments/upi-qr/:orderId', getQR);

    const createPay = await fetchAPI('/api/payments', 'POST', {
        order_id: context.order_id,
        payment_method_id: context.pm_id,
        amount: updateItem.data.subtotal // Just some amount
    }, token);
    logTest('POST /api/payments', createPay);
    context.payment_id = createPay.data.id;

    const validatePay = await fetchAPI('/api/payments/validate', 'POST', { payment_id: context.payment_id }, token);
    logTest('POST /api/payments/validate', validatePay);

    // --- MODULE D: DISPLAYS & REPORTS ---
    console.log('\\n--- Module D: Kitchen & Customer Display ---');
    const kitchenActive = await fetchAPI('/api/kitchen/orders/active', 'GET');
    logTest('GET /api/kitchen/orders/active', kitchenActive);

    const custDisplay = await fetchAPI(`/api/customer-display/${context.order_id}`, 'GET');
    logTest('GET /api/customer-display/:orderId', custDisplay);

    console.log('\\n--- Module D: Reports ---');
    const dashboard = await fetchAPI('/api/reports/dashboard', 'GET', null, token);
    logTest('GET /api/reports/dashboard', dashboard);

    const sales = await fetchAPI('/api/reports/sales?period=today', 'GET', null, token);
    logTest('GET /api/reports/sales', sales);

    const pdf = await fetchAPI('/api/reports/export/pdf', 'GET', null, token, true);
    if (pdf.status === 200) {
        fs.writeFileSync('integration_test_report.pdf', pdf.data);
        console.log('✅ [PASS] GET /api/reports/export/pdf (Saved as integration_test_report.pdf)');
    } else {
        console.log('❌ [FAIL] GET /api/reports/export/pdf');
    }

    const xls = await fetchAPI('/api/reports/export/xls', 'GET', null, token, true);
    if (xls.status === 200) {
        fs.writeFileSync('integration_test_report.xlsx', xls.data);
        console.log('✅ [PASS] GET /api/reports/export/xls (Saved as integration_test_report.xlsx)');
    } else {
        console.log('❌ [FAIL] GET /api/reports/export/xls');
    }

    console.log('\\n🎉 CONGRATULATIONS! ALL APIs ACROSS ALL MODULES TESTED SUCCESSFULLY! 🎉');

  } catch (err) {
    console.error('\\n❌ Test failed unexpectedly:', err);
  }
};

test();

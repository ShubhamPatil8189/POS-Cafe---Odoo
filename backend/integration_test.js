const API_BASE_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('🧪 Starting Integration Tests...');

    // 1. Login to get token
    console.log('🔑 Logging in...');
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cafe.com', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      throw new Error('Login failed: ' + await loginRes.text());
    }
    const { token } = await loginRes.json();
    console.log('✅ Login successful');

    // 2. Fetch Floors
    console.log('📋 Fetching floors and tables...');
    const floorRes = await fetch(`${API_BASE_URL}/floors`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const floors = await floorRes.json();
    console.log('Floors in DB:', JSON.stringify(floors, null, 2));

    const groundFloor = floors.find(f => f.name === 'Ground Floor');
    if (!groundFloor) {
      console.error('❌ Ground Floor not found!');
    } else {
      console.log(`✅ Ground Floor found with ${groundFloor.tables?.length} tables`);
    }

    // 3. Test Self-Order with Valid Table (Assume ID 1 or 2 exists now)
    if (groundFloor && groundFloor.tables && groundFloor.tables.length > 0) {
      const validTableId = groundFloor.tables[0].id;
      console.log(`🛒 Testing self-order with VALID Table ID: ${validTableId}`);
      const orderRes = await fetch(`${API_BASE_URL}/self-order/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: validTableId,
          checkout_type: 'kitchen',
          items: [{ product_id: 1, name: 'Margherita Pizza', quantity: 1, price: 300, tax_rate: 5 }]
        })
      });
      console.log('Status:', orderRes.status, await orderRes.json());
    }

    // 4. Test Self-Order with INVALID Table (ID 9999)
    console.log('🚫 Testing self-order with INVALID Table ID: 9999');
    const invalidOrderRes = await fetch(`${API_BASE_URL}/self-order/place-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: 9999,
        checkout_type: 'kitchen',
        items: [{ product_id: 1, name: 'Margherita Pizza', quantity: 1, price: 300 }]
      })
    });
    console.log('Status (Should be 404):', invalidOrderRes.status, await invalidOrderRes.json());

    console.log('🎉 Tests completed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();

async function runModuleATests() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('--- Starting API Tests for Module A (Shubham Code) ---');
  
  try {
    // 1. Test Categories
    console.log('\n[1] Testing GET /api/categories...');
    const catRes = await fetch(`${baseUrl}/categories`);
    const categories = await catRes.json();
    console.log(`✅ Categories fetch successful: Found ${categories.length || categories.data?.length || 0} categories.`);
    
    // 2. Test Products
    console.log('\n[2] Testing GET /api/products...');
    const prodRes = await fetch(`${baseUrl}/products`);
    const products = await prodRes.json();
    console.log(`✅ Products fetch successful: Found ${products.length || products.data?.length || 0} products.`);
    
    // 3. Test Auth (Login with seeded admin)
    console.log('\n[3] Testing POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: 'admin@cafe.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (loginData.token) {
        console.log(`✅ Auth login successful! Received JWT Token for ${loginData.user?.email || 'admin@cafe.com'}`);
    } else {
        console.log(`⚠️ Auth login failed or returned unexpected schema:`, loginData);
    }

    console.log('\n--- 🎉 All Module A Tests Executed ---');
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

runModuleATests();

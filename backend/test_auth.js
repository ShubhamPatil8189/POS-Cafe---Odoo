const http = require('http');

const test = async () => {
  console.log('Testing APIs...');
  
  const fetchAPI = (path, method, body, token) => new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
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
    
    console.log('1. Testing Signup');
    const signupRes = await fetchAPI('/api/auth/signup', 'POST', {
      name: 'Test User',
      email: 'test' + ts + '@test.com',
      password: 'password123'
    });
    console.log('Signup Status:', signupRes.status);
    console.log('Signup Data:', signupRes.data);
    if (signupRes.status !== 201) throw new Error('Signup failed');
    
    const token = signupRes.data.token;
    
    console.log('\n2. Testing Login');
    const loginRes = await fetchAPI('/api/auth/login', 'POST', {
      email: 'test' + ts + '@test.com',
      password: 'password123'
    });
    console.log('Login Status:', loginRes.status);
    console.log('Login Data:', loginRes.data);
    if (loginRes.status !== 200) throw new Error('Login failed');
    
    console.log('\n3. Testing Get Me');
    const meRes = await fetchAPI('/api/auth/me', 'GET', null, token);
    console.log('Get Me Status:', meRes.status);
    console.log('Get Me Data:', meRes.data);
    if (meRes.status !== 200) throw new Error('Get Me failed');
    
    console.log('\n✅ All Auth APIs tested successfully!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
};

test();

const http = require('http');

const data = JSON.stringify({
  product_id: 1,
  product_name: 'Test',
  quantity: 1,
  price: 150.5,
  tax_rate: 5
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/orders/180005/items', /* using the order id we generated earlier that succeeded */
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();

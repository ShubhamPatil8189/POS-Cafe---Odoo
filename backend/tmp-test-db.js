const pool = require('./config/database');
async function run() {
  const [methods] = await pool.query('SELECT * FROM payment_methods');
  console.log('Payment Methods:', methods);
  process.exit(0);
}
run();

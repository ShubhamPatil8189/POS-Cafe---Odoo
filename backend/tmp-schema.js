const pool = require('./config/database');
async function r() {
  const [c1] = await pool.query('SHOW CREATE TABLE products');
  const [c2] = await pool.query('SHOW CREATE TABLE order_lines');
  console.log(c1[0]['Create Table']);
  console.log('---');
  console.log(c2[0]['Create Table']);
  process.exit(0);
}
r();

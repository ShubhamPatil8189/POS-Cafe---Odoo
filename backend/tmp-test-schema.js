const pool = require('./config/database');
async function run() {
  const [cols] = await pool.query('SHOW CREATE TABLE payments');
  console.log(cols[0]['Create Table']);
  process.exit(0);
}
run();

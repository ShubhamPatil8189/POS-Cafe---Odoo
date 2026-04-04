const pool = require('./config/database');
const fs = require('fs');
async function run() {
  const [cols] = await pool.query('SHOW CREATE TABLE payments');
  fs.writeFileSync('schema.txt', cols[0]['Create Table']);
  process.exit(0);
}
run();

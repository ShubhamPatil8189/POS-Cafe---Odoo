const pool = require('./config/database');
async function run() {
  const [cols] = await pool.query('SHOW COLUMNS FROM payments');
  console.log(cols.map(c => c.Field));
  process.exit(0);
}
run();

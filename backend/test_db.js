const pool = require('./config/database');
async function check() {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_methods');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

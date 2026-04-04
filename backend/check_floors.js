const pool = require('./config/database');
async function check() {
  try {
    const [floors] = await pool.query('SELECT * FROM floors');
    const [tables] = await pool.query('SELECT * FROM tables');
    console.log('Floors:', floors);
    console.log('Tables:', tables);
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
}
check();

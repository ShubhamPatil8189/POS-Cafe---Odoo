const pool = require('./config/database');

async function checkTables() {
  try {
    const [rows] = await pool.query('SELECT * FROM tables');
    console.log('Tables in database:');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking tables:', err);
    process.exit(1);
  }
}

checkTables();

const pool = require('./config/database');
const fs = require('fs');
async function check() {
  try {
    const [rows] = await pool.query('SELECT id, table_number FROM tables');
    fs.writeFileSync('backend/tables_dump.json', JSON.stringify(rows));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('backend/tables_dump_error.txt', err.stack);
    process.exit(1);
  }
}
check();

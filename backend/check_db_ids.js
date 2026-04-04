const pool = require('./config/database');
async function check() {
  const [floors] = await pool.query('SELECT * FROM floors');
  console.log('--- FLOORS ---');
  console.log(JSON.stringify(floors, null, 2));
  
  const [tables] = await pool.query('SELECT * FROM tables');
  console.log('--- TABLES ---');
  console.log(JSON.stringify(tables, null, 2));
  
  process.exit(0);
}
check();

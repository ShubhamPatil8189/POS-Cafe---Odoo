const pool = require('./config/database');

async function forceSeed() {
  try {
    console.log('🚀 Starting Force Seed...');
    
    // 1. Ensure Ground Floor exists
    let [floors] = await pool.query("SELECT id FROM floors WHERE name = 'Ground Floor'");
    let floorId;
    
    if (floors.length === 0) {
      const [res] = await pool.query("INSERT INTO floors (name) VALUES ('Ground Floor')");
      floorId = res.insertId;
      console.log('✅ Created Ground Floor');
    } else {
      floorId = floors[0].id;
      console.log('ℹ️ Ground Floor already exists (ID: ' + floorId + ')');
    }

    // 2. Ensure Tables exist for this floor
    const [tables] = await pool.query("SELECT COUNT(*) as count FROM tables WHERE floor_id = ?", [floorId]);
    if (tables[0].count === 0) {
      await pool.query(`INSERT INTO tables (floor_id, table_number, seats, status) VALUES
        (?, 'T1', 4, 'available'), (?, 'T2', 4, 'available'), (?, 'T3', 6, 'available'), 
        (?, 'T4', 2, 'available'), (?, 'T5', 4, 'available'), (?, 'T6', 8, 'available')
      `, [floorId, floorId, floorId, floorId, floorId, floorId]);
      console.log('✅ Created 6 tables for Ground Floor');
    } else {
      console.log('ℹ️ Tables already exist for Ground Floor (' + tables[0].count + ' tables)');
    }

    console.log('🎉 Force Seed Completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Force Seed Failed:', err.message);
    process.exit(1);
  }
}

forceSeed();

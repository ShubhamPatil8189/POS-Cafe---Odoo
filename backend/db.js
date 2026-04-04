const pool = require('./config/database');

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS floors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT,
        table_number VARCHAR(50) NOT NULL,
        seats INT DEFAULT 2,
        is_active BOOLEAN DEFAULT TRUE,
        status VARCHAR(50) DEFAULT 'available',
        locked_by VARCHAR(255),
        last_activity DATETIME,
        self_order_token VARCHAR(255),
        self_order_expiry DATETIME
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        upi_id VARCHAR(255)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pos_terminal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        last_open_date DATETIME,
        last_sell_amount DECIMAL(10,2) DEFAULT 0.00,
        self_ordering_enabled BOOLEAN DEFAULT FALSE,
        self_ordering_type VARCHAR(50) DEFAULT 'qr',
        background_color VARCHAR(50) DEFAULT '#ffffff'
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        terminal_id INT,
        status VARCHAR(50) DEFAULT 'open',
        opening_balance DECIMAL(10,2) DEFAULT 0.00,
        closing_balance DECIMAL(10,2),
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ModuleB_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        reserved_time DATETIME NOT NULL,
        expiry_time DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'active'
      )
    `);

    // Seed Data: Floors
    const [existingGround] = await connection.query("SELECT id FROM floors WHERE name = 'Ground Floor'");
    let groundFloorId;
    
    if (existingGround.length === 0) {
      const [result] = await connection.query("INSERT INTO floors (name) VALUES ('Ground Floor')");
      groundFloorId = result.insertId;
      console.log('🌱 Seeded: Ground Floor');
    } else {
      groundFloorId = existingGround[0].id;
    }

    // Seed Data: Tables for Ground Floor
    console.log("🌱 Checking Ground Floor tables (T1-T6)...");
    for (let i = 1; i <= 6; i++) {
      const tableNum = `T${i}`;
      const [tableCheck] = await connection.query("SELECT id FROM tables WHERE floor_id = ? AND table_number = ?", [groundFloorId, tableNum]);
      if (tableCheck.length === 0) {
        await connection.query("INSERT INTO tables (floor_id, table_number, seats, status) VALUES (?, ?, ?, 'available')", [groundFloorId, tableNum, i === 3 ? 6 : (i === 6 ? 8 : (i === 4 ? 2 : 4))]);
        console.log(`🌱 Seeded Table: ${tableNum}`);
      }
    }

    // Seed Data: Payment Methods
    const [methods] = await connection.query('SELECT COUNT(*) as count FROM payment_methods');
    if (methods[0].count === 0) {
      await connection.query("INSERT INTO payment_methods (type, is_enabled, upi_id) VALUES ('cash', TRUE, NULL), ('digital', TRUE, NULL), ('upi', TRUE, '123@ybl.com')");
      console.log('🌱 Seeded: Payment methods');
    }

    // Seed Data: Pos Terminals
    const [terminals] = await connection.query('SELECT COUNT(*) as count FROM pos_terminal');
    if (terminals[0].count === 0) {
      await connection.query("INSERT INTO pos_terminal (name) VALUES ('Main Counter')");
      console.log('🌱 Seeded: POS Terminal');
    }

    connection.release();
  } catch (error) {
    if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
      console.error('❌ Database initialization error:', error.message);
    }
  }
};

module.exports = { pool, initDB };

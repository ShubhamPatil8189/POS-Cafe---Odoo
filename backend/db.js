import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.TIDB_HOST || process.env.DB_HOST,
  port: process.env.TIDB_PORT || process.env.DB_PORT || 4000,
  user: process.env.TIDB_USER || process.env.DB_USER,
  password: process.env.TIDB_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.TIDB_DATABASE || process.env.DB_NAME,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to TiDB database successfully.');
    
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
        FOREIGN KEY (floor_id) REFERENCES floors(id)
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
        end_time DATETIME,
        FOREIGN KEY (terminal_id) REFERENCES pos_terminal(id)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        table_id INT,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        reserved_time DATETIME NOT NULL,
        expiry_time DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        FOREIGN KEY (table_id) REFERENCES tables(id)
      )
    `);

    // Seed Data
    const [methods] = await connection.query('SELECT COUNT(*) as count FROM payment_methods');
    if (methods[0].count === 0) {
      await connection.query("INSERT INTO payment_methods (type, is_enabled, upi_id) VALUES ('cash', TRUE, NULL), ('digital', TRUE, NULL), ('upi', TRUE, '123@ybl.com')");
      console.log('✅ Seeded payment methods');
    }

    const [floors] = await connection.query('SELECT COUNT(*) as count FROM floors');
    if (floors[0].count === 0) {
      const [result] = await connection.query("INSERT INTO floors (name) VALUES ('Ground Floor')");
      const floorId = result.insertId;
      
      await connection.query(`INSERT INTO tables (floor_id, table_number, seats, status) VALUES
        (?, '1', 4, 'available'),
        (?, '2', 4, 'available'),
        (?, '3', 6, 'available'),
        (?, '4', 2, 'available'),
        (?, '5', 4, 'available'),
        (?, '6', 8, 'available')
      `, [floorId, floorId, floorId, floorId, floorId, floorId]);
      console.log('✅ Seeded default floor and tables');
    }

    const [terminals] = await connection.query('SELECT COUNT(*) as count FROM pos_terminal');
    if (terminals[0].count === 0) {
      await connection.query("INSERT INTO pos_terminal (name) VALUES ('Main Counter')");
      console.log('✅ Seeded default POS terminal');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database connection/initialization error:', error.message);
  }
};

export default pool;

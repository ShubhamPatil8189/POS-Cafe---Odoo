const pool = require('./config/database');

async function recreate() {
  try {
    await pool.query('DROP TABLE IF EXISTS payments');
    await pool.query('DROP TABLE IF EXISTS order_lines');
    await pool.query('DROP TABLE IF EXISTS orders');

    // Make sure Dinesh's tables exist
    const { initDB } = require('./db.js');
    await initDB();

    await pool.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        session_id INT,
        table_id INT,
        user_id INT,
        status ENUM('draft', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'draft',
        source ENUM('pos', 'self-order', 'online') DEFAULT 'pos',
        subtotal DECIMAL(10,2) DEFAULT 0.00,
        tax_total DECIMAL(10,2) DEFAULT 0.00,
        total DECIMAL(10,2) DEFAULT 0.00,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
        FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE order_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        product_name VARCHAR(100) NOT NULL,
        quantity DECIMAL(10,3) DEFAULT 1.000,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) DEFAULT 0.00,
        kitchen_status ENUM('pending', 'preparing', 'ready') DEFAULT 'pending',
        notes TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        method_id INT,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
      )
    `);

    console.log('Orders, Order Lines, and Payments tables beautifully recreated mapping to Dinesh schema!');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

recreate();

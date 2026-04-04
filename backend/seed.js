const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  let connection;
  try {
    // Build connection config
    const connConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 4000,
    };

    // TiDB Cloud requires SSL
    if (process.env.DB_SSL === 'true') {
      connConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      };
    }

    // Connect without database first
    connection = await mysql.createConnection(connConfig);
    console.log('🔗 Connected to TiDB Cloud');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    console.log(`📦 Using database: ${process.env.DB_NAME}`);

    // ── Create Tables ──────────────────────────────────
    console.log('📋 Creating tables...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ users');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#ff6b35',
        sequence INT DEFAULT 0,
        send_to_kitchen BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ categories');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category_id INT,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        tax DECIMAL(5, 2) DEFAULT 0.00,
        uom VARCHAR(50) DEFAULT 'piece',
        description TEXT,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        send_to_kitchen BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✅ products');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        attribute_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✅ product_attributes');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        attribute_id INT NOT NULL,
        value VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        extra_price DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✅ product_variants');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_extras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        extra_price DECIMAL(10, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✅ product_extras');

    // ── Unified Tables (Module B, C, D) ───────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS floors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        sequence INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ floors');

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
        position_x INT DEFAULT 0,
        position_y INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✅ tables');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        type VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        upi_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ payment_methods');

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
    console.log('  ✅ sessions');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        session_id INT,
        table_id INT,
        user_id INT,
        status ENUM('draft', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'draft',
        source ENUM('pos', 'self-order', 'online') DEFAULT 'pos',
        subtotal DECIMAL(10, 2) DEFAULT 0.00,
        tax_total DECIMAL(10, 2) DEFAULT 0.00,
        total DECIMAL(10, 2) DEFAULT 0.00,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ orders');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        product_name VARCHAR(150) NOT NULL,
        quantity INT DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(5, 2) DEFAULT 0.00,
        subtotal DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        kitchen_status ENUM('pending', 'preparing', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✅ order_lines');

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
    console.log('  ✅ ModuleB_reservations');

    // ── Seed Data ──────────────────────────────────────
    console.log('\n🌱 Seeding data...');

    // Users
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@cafe.com']);
    if (existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@cafe.com', hashedPassword, 'admin']
      );
      console.log('  ✅ Admin user created');
    }

    // Categories
    const [existingCategories] = await connection.query('SELECT id FROM categories LIMIT 1');
    if (existingCategories.length === 0) {
      await connection.query(`
        INSERT INTO categories (name, color, sequence, send_to_kitchen) VALUES
        ('Pizza', '#FF6B35', 1, TRUE),
        ('Coffee', '#8B4513', 2, TRUE),
        ('Pasta', '#FFD700', 3, TRUE),
        ('Burger', '#DC143C', 4, TRUE),
        ('Drinks', '#4169E1', 5, FALSE),
        ('Desserts', '#FF69B4', 6, TRUE)
      `);
      console.log('  ✅ Categories inserted');
    }

    // Products
    const [existingProducts] = await connection.query('SELECT id FROM products LIMIT 1');
    if (existingProducts.length === 0) {
      await connection.query(`
        INSERT INTO products (name, category_id, price, tax, uom, description, image_url, send_to_kitchen) VALUES
        ('Margherita Pizza', 1, 300.00, 5.00, 'piece', 'Classic tomato and mozzarella', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Pepperoni Pizza', 1, 400.00, 5.00, 'piece', 'Loaded with pepperoni', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Farmhouse Pizza', 1, 450.00, 5.00, 'piece', 'Fresh vegetables', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Cappuccino', 2, 150.00, 5.00, 'cup', 'Frothy Italian coffee', 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Latte', 2, 180.00, 5.00, 'cup', 'Smooth and creamy', 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Espresso', 2, 120.00, 5.00, 'cup', 'Strong and bold', 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Alfredo Pasta', 3, 350.00, 5.00, 'plate', 'Creamy white sauce', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Arrabbiata Pasta', 3, 320.00, 5.00, 'plate', 'Spicy red sauce', 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Classic Burger', 4, 250.00, 5.00, 'piece', 'Juicy beef patty', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Cheese Burger', 4, 300.00, 5.00, 'piece', 'Double cheese', 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop', TRUE),
        ('Water Bottle', 5, 20.00, 0.00, 'bottle', '500ml', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=600&auto=format&fit=crop', FALSE),
        ('Cold Coffee', 5, 200.00, 5.00, 'glass', 'Iced cold coffee', 'https://images.unsplash.com/photo-1517701604599-bb24b3180ddf?q=80&w=600&auto=format&fit=crop', FALSE),
        ('Lemon Soda', 5, 80.00, 5.00, 'glass', 'Fresh lemon soda', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop', FALSE),
        ('Chocolate Brownie', 6, 210.00, 5.00, 'piece', 'Walnut brownie', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop', TRUE)
      `);
      console.log('  ✅ Products inserted');
    }

    // Floors & Tables
    const [existingFloors] = await connection.query('SELECT id FROM floors LIMIT 1');
    if (existingFloors.length === 0) {
      const [res] = await connection.query("INSERT INTO floors (name, sequence) VALUES ('Ground Floor', 1)");
      const floorId = res.insertId;
      await connection.query(`
        INSERT INTO tables (floor_id, table_number, seats, status) VALUES
        (?, 'T1', 4, 'available'),
        (?, 'T2', 2, 'available'),
        (?, 'T3', 6, 'available'),
        (?, 'T4', 4, 'available'),
        (?, 'T5', 8, 'available'),
        (?, 'T6', 2, 'available')
      `, [floorId, floorId, floorId, floorId, floorId, floorId]);
      console.log('  ✅ Floor + Tables inserted');
    }

    console.log('\n🎉 Seed completed!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

seed();

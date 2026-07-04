-- =========================================
-- ODOO POS CAFE - FULL DATABASE SCHEMA (SQLite)
-- Adapted from MySQL schema for local development
-- =========================================

-- =========================================
-- USERS
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK(role IN ('admin','staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CUSTOMERS
-- =========================================
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    total_sales REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- POS TERMINAL
-- =========================================
CREATE TABLE IF NOT EXISTS pos_terminal (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    last_open_date TEXT,
    last_sell_amount REAL,
    self_ordering_enabled INTEGER DEFAULT 0,
    self_ordering_type TEXT CHECK(self_ordering_type IN ('online_ordering','qr_menu')),
    background_color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PAYMENT METHODS
-- =========================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('cash','digital','upi')),
    is_enabled INTEGER DEFAULT 1,
    upi_id TEXT
);

-- =========================================
-- FLOORS
-- =========================================
CREATE TABLE IF NOT EXISTS floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);

-- =========================================
-- FLOOR TERMINAL MAPPING
-- =========================================
CREATE TABLE IF NOT EXISTS floor_pos_terminal (
    floor_id INTEGER,
    terminal_id INTEGER,
    PRIMARY KEY (floor_id, terminal_id),
    FOREIGN KEY (floor_id) REFERENCES floors(id),
    FOREIGN KEY (terminal_id) REFERENCES pos_terminal(id)
);

-- =========================================
-- TABLES (WITH STATUS + VISUAL TYPE)
-- =========================================
CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    floor_id INTEGER,
    table_number TEXT,
    seats INTEGER,
    table_type TEXT DEFAULT 'rectangle' CHECK(table_type IN ('table-for-one','table-for-two','valentine','round','rectangle','group')),
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    status TEXT DEFAULT 'available' CHECK(status IN ('available','reserved','self_order','occupied')),
    locked_by TEXT,
    last_activity DATETIME,
    FOREIGN KEY (floor_id) REFERENCES floors(id)
);

-- =========================================
-- RESERVATIONS
-- =========================================
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER,
    customer_name TEXT,
    phone TEXT,
    reserved_time DATETIME,
    expiry_time DATETIME,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id)
);

-- =========================================
-- SESSIONS
-- =========================================
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    terminal_id INTEGER,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','closed')),
    opening_balance REAL,
    closing_balance REAL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (terminal_id) REFERENCES pos_terminal(id)
);

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    sequence INTEGER,
    send_to_kitchen INTEGER DEFAULT 1
);

-- =========================================
-- PRODUCTS
-- =========================================
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category_id INTEGER,
    price REAL,
    tax REAL DEFAULT 5.0,
    uom TEXT DEFAULT 'unit',
    description TEXT,
    image_url TEXT,
    is_veg INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    send_to_kitchen INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- =========================================
-- PRODUCT ATTRIBUTES
-- =========================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    attribute_name TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =========================================
-- PRODUCT VARIANTS
-- =========================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    attribute_id INTEGER,
    value TEXT,
    unit TEXT,
    extra_price REAL,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id)
);

-- =========================================
-- PRODUCT EXTRAS
-- =========================================
CREATE TABLE IF NOT EXISTS product_extras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    name TEXT,
    extra_price REAL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =========================================
-- SELF ORDER TOKENS
-- =========================================
CREATE TABLE IF NOT EXISTS self_order_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER,
    session_id INTEGER,
    token TEXT UNIQUE,
    type TEXT CHECK(type IN ('online_ordering','qr_menu')),
    is_used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- =========================================
-- ORDERS
-- =========================================
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    table_id INTEGER,
    user_id INTEGER,
    customer_id INTEGER,
    order_number TEXT UNIQUE,
    order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in','self_order','takeaway')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending','preparing','completed','paid')),
    total_amount REAL,
    discount REAL DEFAULT 0,
    notes TEXT,
    is_invoice INTEGER DEFAULT 0,
    self_order_token INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (table_id) REFERENCES tables(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (self_order_token) REFERENCES self_order_tokens(id)
);

-- =========================================
-- ORDER ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    variant_id INTEGER,
    quantity INTEGER,
    price REAL,
    tax REAL,
    uom TEXT,
    subtotal REAL,
    discount REAL DEFAULT 0,
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- =========================================
-- ORDER ITEM EXTRAS
-- =========================================
CREATE TABLE IF NOT EXISTS order_item_extras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER,
    extra_name TEXT,
    extra_price REAL,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

-- =========================================
-- PAYMENTS
-- =========================================
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    payment_method_id INTEGER,
    amount REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','success','failed')),
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

-- =========================================
-- KITCHEN ORDERS
-- =========================================
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    status TEXT DEFAULT 'to_cook' CHECK(status IN ('to_cook','preparing','completed')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =========================================
-- KITCHEN ORDER ITEMS
-- =========================================
CREATE TABLE IF NOT EXISTS kitchen_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kitchen_order_id INTEGER,
    order_item_id INTEGER,
    is_prepared INTEGER DEFAULT 0,
    prepared_at DATETIME,
    FOREIGN KEY (kitchen_order_id) REFERENCES kitchen_orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

-- =========================================
-- MOBILE ORDER IMAGES
-- =========================================
CREATE TABLE IF NOT EXISTS mobile_order_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    terminal_id INTEGER,
    image_path TEXT,
    sequence INTEGER,
    FOREIGN KEY (terminal_id) REFERENCES pos_terminal(id)
);

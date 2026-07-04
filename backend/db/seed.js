import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'pos_cafe.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

// Delete existing DB for fresh seed
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Removed existing database');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('✅ Schema created');

// --- Seed Users ---
const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
insertUser.run('Admin User', 'admin@odoocafe.com', 'admin123', 'admin');
insertUser.run('Staff Alex', 'alex@odoocafe.com', 'staff123', 'staff');
insertUser.run('Staff Maya', 'maya@odoocafe.com', 'staff123', 'staff');
console.log('✅ Users seeded');

// --- Seed POS Terminal ---
const insertTerminal = db.prepare('INSERT INTO pos_terminal (name, self_ordering_enabled, self_ordering_type, background_color) VALUES (?, ?, ?, ?)');
insertTerminal.run('Main Counter', 1, 'qr_menu', '#3D1D6B');
insertTerminal.run('Bar Counter', 0, null, '#1E1E2E');
console.log('✅ POS Terminals seeded');

// --- Seed Payment Methods ---
const insertPaymentMethod = db.prepare('INSERT INTO payment_methods (type, is_enabled, upi_id) VALUES (?, ?, ?)');
insertPaymentMethod.run('cash', 1, null);
insertPaymentMethod.run('digital', 1, null);
insertPaymentMethod.run('upi', 1, 'odooposcafe@upi');
console.log('✅ Payment Methods seeded');

// --- Seed Floors ---
const insertFloor = db.prepare('INSERT INTO floors (name) VALUES (?)');
insertFloor.run('Ground Floor');
insertFloor.run('First Floor');
console.log('✅ Floors seeded');

// --- Seed Floor-Terminal Mapping ---
const insertFloorTerminal = db.prepare('INSERT INTO floor_pos_terminal (floor_id, terminal_id) VALUES (?, ?)');
insertFloorTerminal.run(1, 1);
insertFloorTerminal.run(2, 1);
insertFloorTerminal.run(1, 2);
console.log('✅ Floor-Terminal mappings seeded');

// --- Seed Tables ---
const insertTable = db.prepare('INSERT INTO tables (floor_id, table_number, seats, table_type, position_x, position_y, status) VALUES (?, ?, ?, ?, ?, ?, ?)');

// Ground Floor tables (10 tables)
const groundFloorTables = [
  ['T1', 1, 'table-for-one', 0, 0, 'available'],
  ['T2', 1, 'table-for-one', 1, 0, 'available'],
  ['T3', 2, 'table-for-two', 2, 0, 'available'],
  ['T4', 2, 'table-for-two', 3, 0, 'available'],
  ['T5', 2, 'valentine',     0, 1, 'available'],
  ['T6', 4, 'round',         1, 1, 'available'],
  ['T7', 4, 'round',         2, 1, 'available'],
  ['T8', 6, 'rectangle',     3, 1, 'available'],
  ['T9', 8, 'group',         0, 2, 'available'],
  ['T10', 4, 'rectangle',    2, 2, 'available'],
];

groundFloorTables.forEach(([num, seats, type, x, y, status]) => {
  insertTable.run(1, num, seats, type, x, y, status);
});

// First Floor tables (7 tables)
const firstFloorTables = [
  ['T11', 2, 'table-for-two', 0, 0, 'available'],
  ['T12', 2, 'valentine',     1, 0, 'available'],
  ['T13', 4, 'round',         2, 0, 'available'],
  ['T14', 6, 'round',         3, 0, 'available'],
  ['T15', 4, 'rectangle',     0, 1, 'available'],
  ['T16', 10, 'group',        1, 1, 'available'],
  ['T17', 1, 'table-for-one', 3, 1, 'available'],
];

firstFloorTables.forEach(([num, seats, type, x, y, status]) => {
  insertTable.run(2, num, seats, type, x, y, status);
});
console.log('✅ Tables seeded (17 tables across 2 floors)');

// --- Seed Categories ---
const insertCategory = db.prepare('INSERT INTO categories (name, description, icon, color, sequence, send_to_kitchen) VALUES (?, ?, ?, ?, ?, ?)');
const categories = [
  ['Indian', 'Traditional Indian cuisine', '🍛', '#E67E22', 1, 1],
  ['Chinese', 'Indo-Chinese & authentic Chinese', '🥡', '#E74C3C', 2, 1],
  ['Italian', 'Pizzas, pastas & more', '🍕', '#27AE60', 3, 1],
  ['Continental', 'European classics', '🥘', '#3498DB', 4, 1],
  ['Japanese', 'Sushi, ramen & Japanese delicacies', '🍱', '#9B59B6', 5, 1],
  ['Beverages', 'Hot & cold drinks', '☕', '#F39C12', 6, 0],
  ['Desserts', 'Sweet treats & confections', '🍰', '#E91E63', 7, 1],
];
categories.forEach(([name, desc, icon, color, seq, kitchen]) => insertCategory.run(name, desc, icon, color, seq, kitchen));
console.log('✅ Categories seeded');

// --- Seed Products ---
const insertProduct = db.prepare('INSERT INTO products (name, category_id, price, tax, uom, description, is_veg, is_active, send_to_kitchen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

const products = [
  // Indian (cat 1)
  ['Butter Chicken', 1, 320, 5, 'plate', 'Creamy tomato-based curry with tender chicken', 0, 1, 1],
  ['Paneer Tikka Masala', 1, 280, 5, 'plate', 'Grilled paneer in rich spiced gravy', 1, 1, 1],
  ['Dal Makhani', 1, 220, 5, 'bowl', 'Slow-cooked black lentils with butter & cream', 1, 1, 1],
  ['Chicken Biryani', 1, 350, 5, 'plate', 'Fragrant basmati rice with spiced chicken', 0, 1, 1],
  ['Veg Biryani', 1, 250, 5, 'plate', 'Aromatic rice with seasonal vegetables', 1, 1, 1],
  ['Garlic Naan', 1, 60, 5, 'piece', 'Tandoor-baked bread with garlic butter', 1, 1, 1],
  ['Masala Dosa', 1, 150, 5, 'piece', 'Crispy crepe with spiced potato filling', 1, 1, 1],

  // Chinese (cat 2)
  ['Kung Pao Chicken', 2, 310, 5, 'plate', 'Spicy stir-fried chicken with peanuts', 0, 1, 1],
  ['Veg Hakka Noodles', 2, 200, 5, 'plate', 'Stir-fried noodles with vegetables', 1, 1, 1],
  ['Chicken Manchurian', 2, 280, 5, 'plate', 'Indo-Chinese chicken in tangy sauce', 0, 1, 1],
  ['Spring Rolls', 2, 180, 5, '4 pcs', 'Crispy rolls with vegetable filling', 1, 1, 1],
  ['Fried Rice', 2, 220, 5, 'plate', 'Wok-tossed rice with vegetables & egg', 0, 1, 1],

  // Italian (cat 3)
  ['Margherita Pizza', 3, 350, 5, 'piece', 'Classic tomato, mozzarella & fresh basil', 1, 1, 1],
  ['Penne Arrabbiata', 3, 280, 5, 'plate', 'Penne in spicy tomato sauce', 1, 1, 1],
  ['Chicken Alfredo Pasta', 3, 380, 5, 'plate', 'Creamy fettuccine with grilled chicken', 0, 1, 1],
  ['Bruschetta', 3, 200, 5, '4 pcs', 'Toasted bread with tomato & basil topping', 1, 1, 1],

  // Continental (cat 4)
  ['Grilled Chicken Steak', 4, 420, 5, 'plate', 'Herb-marinated chicken with sides', 0, 1, 1],
  ['Caesar Salad', 4, 250, 5, 'bowl', 'Romaine lettuce with parmesan & croutons', 1, 1, 1],
  ['Fish & Chips', 4, 380, 5, 'plate', 'Beer-battered fish with crispy fries', 0, 1, 1],
  ['Mushroom Soup', 4, 180, 5, 'bowl', 'Creamy wild mushroom bisque', 1, 1, 1],

  // Japanese (cat 5)
  ['Salmon Sushi Roll', 5, 450, 5, '6 pcs', 'Fresh salmon with seasoned rice', 0, 1, 1],
  ['Vegetable Tempura', 5, 260, 5, 'plate', 'Lightly battered fried vegetables', 1, 1, 1],
  ['Chicken Ramen', 5, 350, 5, 'bowl', 'Rich broth with noodles & chicken', 0, 1, 1],
  ['Edamame', 5, 150, 5, 'bowl', 'Steamed salted soybeans', 1, 1, 1],
  ['Miso Soup', 5, 120, 5, 'bowl', 'Traditional fermented soybean soup', 1, 1, 1],

  // Beverages (cat 6)
  ['Cappuccino', 6, 180, 5, 'cup', 'Espresso with steamed milk foam', 1, 1, 0],
  ['Cold Brew Coffee', 6, 200, 5, 'glass', 'Slow-steeped chilled coffee', 1, 1, 0],
  ['Mango Smoothie', 6, 220, 5, 'glass', 'Fresh mango blended with yogurt', 1, 1, 0],
  ['Matcha Latte', 6, 240, 5, 'cup', 'Japanese green tea with steamed milk', 1, 1, 0],
  ['Fresh Lime Soda', 6, 120, 5, 'glass', 'Zesty lime with soda water', 1, 1, 0],

  // Desserts (cat 7)
  ['Chocolate Lava Cake', 7, 280, 5, 'piece', 'Warm cake with molten chocolate center', 1, 1, 1],
  ['Crème Brûlée', 7, 260, 5, 'piece', 'Vanilla custard with caramelized sugar', 1, 1, 1],
  ['Gulab Jamun', 7, 150, 5, '2 pcs', 'Soft milk dumplings in rose syrup', 1, 1, 1],
  ['Cheesecake', 7, 300, 5, 'slice', 'New York style baked cheesecake', 1, 1, 1],
];

products.forEach(([name, catId, price, tax, uom, desc, isVeg, isActive, kitchen]) => {
  insertProduct.run(name, catId, price, tax, uom, desc, isVeg, isActive, kitchen);
});
console.log('✅ Products seeded (' + products.length + ' items)');

// --- Seed Customers ---
const insertCustomer = db.prepare('INSERT INTO customers (name, email, phone, city, state, total_sales) VALUES (?, ?, ?, ?, ?, ?)');
const customers = [
  ['Arjun Mehta', 'arjun@email.com', '9876543210', 'Mumbai', 'Maharashtra', 8500],
  ['Priya Sharma', 'priya@email.com', '9876543211', 'Delhi', 'Delhi', 5200],
  ['Rahul Verma', 'rahul@email.com', '9876543212', 'Bangalore', 'Karnataka', 3100],
  ['Sneha Patel', 'sneha@email.com', '9876543213', 'Ahmedabad', 'Gujarat', 12400],
  ['Vikram Singh', 'vikram@email.com', '9876543214', 'Jaipur', 'Rajasthan', 1800],
];
customers.forEach(([name, email, phone, city, state, sales]) => {
  insertCustomer.run(name, email, phone, city, state, sales);
});
console.log('✅ Customers seeded');

// --- Create initial session ---
db.prepare("INSERT INTO sessions (user_id, terminal_id, status, opening_balance) VALUES (1, 1, 'open', 5000)").run();
console.log('✅ Initial POS session created');

db.close();
console.log('\n🎉 Database seeded successfully!');

const mysql = require('mysql2/promise');
require('dotenv').config();

const PRODUCTS = [
  // PIZZAS (ID 1)
  { name: 'Four Cheese Pizza', price: 450, category_id: 1, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop' },
  { name: 'BBQ Chicken Pizza', price: 480, category_id: 1, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop' },
  { name: 'Veggie Garden Pizza', price: 420, category_id: 1, image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=400&fit=crop' },
  { name: 'Paneer Makhani Pizza', price: 500, category_id: 1, image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop' },
  { name: 'Spicy Hawaiian', price: 460, category_id: 1, image_url: 'https://images.unsplash.com/photo-1506354666786-959d6d493f1a?w=400&h=400&fit=crop' },
  { name: 'Farmhouse Special', price: 440, category_id: 1, image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400&h=400&fit=crop' },
  { name: 'Mushroom Magic Pizza', price: 430, category_id: 1, image_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b99c7?w=400&h=400&fit=crop' },

  // COFFEE (ID 2)
  { name: 'Vanilla Latte', price: 210, category_id: 2, image_url: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400&h=400&fit=crop' },
  { name: 'Hazelnut Macchiato', price: 230, category_id: 2, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop' },
  { name: 'Flat White Coffee', price: 190, category_id: 2, image_url: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=400&h=400&fit=crop' },
  { name: 'Mocha Fusion', price: 220, category_id: 2, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop' },
  { name: 'Irish Cream Cold Brew', price: 250, category_id: 2, image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop' },
  { name: 'Americano Smooth', price: 160, category_id: 2, image_url: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=400&h=400&fit=crop' },
  { name: 'Caramel Frappe', price: 280, category_id: 2, image_url: 'https://images.unsplash.com/photo-1572286258217-40142c1c6a70?w=400&h=400&fit=crop' },
  { name: 'Turkish Coffee', price: 200, category_id: 2, image_url: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400&h=400&fit=crop' },

  // PASTA (ID 3)
  { name: 'Pesto Cream Pasta', price: 380, category_id: 3, image_url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&h=400&fit=crop' },
  { name: 'Mushroom Risotto', price: 410, category_id: 3, image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=400&fit=crop' },
  { name: 'Carbonara Classic', price: 400, category_id: 3, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop' },
  { name: 'Mac & Cheese Gold', price: 320, category_id: 3, image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=400&fit=crop' },
  { name: 'Red Sauce Penne', price: 340, category_id: 3, image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop' },
  { name: 'Spaghetti Aglio Olio', price: 360, category_id: 3, image_url: 'https://images.unsplash.com/photo-1551892374-ecf60bb16061?w=400&h=400&fit=crop' },

  // BURGER (ID 4)
  { name: 'Double Cheese XL', price: 350, category_id: 4, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
  { name: 'Crispy Chicken Zinger', price: 320, category_id: 4, image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=400&h=400&fit=crop' },
  { name: 'Aloo Patty Surprise', price: 180, category_id: 4, image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop' },
  { name: 'Bacon Beef Supreme', price: 450, category_id: 4, image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop' },
  { name: 'Fish Fillet Burger', price: 380, category_id: 4, image_url: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&h=400&fit=crop' },
  { name: 'BBQ Pulled Pork', price: 420, category_id: 4, image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop' },
  { name: 'Halloumi Veggie Burger', price: 300, category_id: 4, image_url: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=400&h=400&fit=crop' },

  // DRINKS (ID 5)
  { name: 'Fresh Watermelon Juice', price: 150, category_id: 5, image_url: 'https://images.unsplash.com/photo-1562158074-90494902521d?w=400&h=400&fit=crop' },
  { name: 'Virgin Mojito', price: 180, category_id: 5, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop' },
  { name: 'Chocolate Milkshake', price: 220, category_id: 5, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop' },
  { name: 'Blue Lagoon Soda', price: 160, category_id: 5, image_url: 'https://images.unsplash.com/photo-1536935338213-d2c12334810a?w=400&h=400&fit=crop' },
  { name: 'Berry Blast Smoothie', price: 240, category_id: 5, image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=400&fit=crop' },
  { name: 'Iced Peach Tea', price: 140, category_id: 5, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop' },

  // DESSERTS (ID 6)
  { name: 'Red Velvet Cheesecake', price: 280, category_id: 6, image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=400&fit=crop' },
  { name: 'Apple Pie with Ice Cream', price: 250, category_id: 6, image_url: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=400&h=400&fit=crop' },
  { name: 'Molten Choco Lava', price: 180, category_id: 6, image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop' },
  { name: 'Sticky Toffee Pudding', price: 320, category_id: 6, image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=400&fit=crop' },
  { name: 'Tiramisu Bowl', price: 300, category_id: 6, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop' },
  { name: 'Mango Sorbet', price: 200, category_id: 6, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop' }
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '4000'),
    ssl: { rejectUnauthorized: false }
  });

  console.log('✅ Connected to TiDB for Product Seeding\n');

  try {
    for (const p of PRODUCTS) {
      // Check if already exists to avoid duplicates
      const [rows] = await conn.query('SELECT id FROM products WHERE name = ?', [p.name]);
      if (rows.length === 0) {
        await conn.query(
          'INSERT INTO products (name, price, category_id, image_url, is_active, send_to_kitchen) VALUES (?, ?, ?, ?, 1, 1)',
          [p.name, p.price, p.category_id, p.image_url]
        );
        console.log(`  ✅ Inserted: ${p.name}`);
      } else {
        console.log(`  ↩ Skipped: ${p.name} (Already exists)`);
      }
    }
    console.log('\n🎉 Product Seeding Complete! 40 New Items added.');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await conn.end();
  }
}

run();

const bcrypt = require('bcryptjs');
const prisma = require('./config/database');
require('dotenv').config();

async function seed() {
  try {
    console.log('🔗 Connected via Prisma');
    
    // Note: Table creation is now handled by Prisma (e.g. `npx prisma db push`).
    // This script only seeds initial data.
    
    // ── Seed Data ──────────────────────────────────────
    console.log('\n🌱 Seeding data...');

    // Users
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@cafe.com' }
    });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@cafe.com',
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('  ✅ Admin user created');
    }

    // Categories
    const categoriesCount = await prisma.category.count();
    if (categoriesCount === 0) {
      await prisma.category.createMany({
        data: [
          { name: 'Pizza', color: '#FF6B35', sequence: 1, send_to_kitchen: true },
          { name: 'Coffee', color: '#8B4513', sequence: 2, send_to_kitchen: true },
          { name: 'Pasta', color: '#FFD700', sequence: 3, send_to_kitchen: true },
          { name: 'Burger', color: '#DC143C', sequence: 4, send_to_kitchen: true },
          { name: 'Drinks', color: '#4169E1', sequence: 5, send_to_kitchen: false },
          { name: 'Desserts', color: '#FF69B4', sequence: 6, send_to_kitchen: true }
        ]
      });
      console.log('  ✅ Categories inserted');
    }

    // Products
    const productsCount = await prisma.product.count();
    if (productsCount === 0) {
      // Fetch categories to get their IDs
      const categories = await prisma.category.findMany();
      const getCategoryId = (name) => categories.find(c => c.name === name)?.id;
      
      await prisma.product.createMany({
        data: [
          { name: 'Margherita Pizza', category_id: getCategoryId('Pizza'), price: 300.00, tax: 5.00, uom: 'piece', description: 'Classic tomato and mozzarella', image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Pepperoni Pizza', category_id: getCategoryId('Pizza'), price: 400.00, tax: 5.00, uom: 'piece', description: 'Loaded with pepperoni', image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Farmhouse Pizza', category_id: getCategoryId('Pizza'), price: 450.00, tax: 5.00, uom: 'piece', description: 'Fresh vegetables', image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Cappuccino', category_id: getCategoryId('Coffee'), price: 150.00, tax: 5.00, uom: 'cup', description: 'Frothy Italian coffee', image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Latte', category_id: getCategoryId('Coffee'), price: 180.00, tax: 5.00, uom: 'cup', description: 'Smooth and creamy', image_url: 'https://images.unsplash.com/photo-1593443320739-77f74939d0da?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Espresso', category_id: getCategoryId('Coffee'), price: 120.00, tax: 5.00, uom: 'cup', description: 'Strong and bold', image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Alfredo Pasta', category_id: getCategoryId('Pasta'), price: 350.00, tax: 5.00, uom: 'plate', description: 'Creamy white sauce', image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Arrabbiata Pasta', category_id: getCategoryId('Pasta'), price: 320.00, tax: 5.00, uom: 'plate', description: 'Spicy red sauce', image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Classic Burger', category_id: getCategoryId('Burger'), price: 250.00, tax: 5.00, uom: 'piece', description: 'Juicy beef patty', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Cheese Burger', category_id: getCategoryId('Burger'), price: 300.00, tax: 5.00, uom: 'piece', description: 'Double cheese', image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true },
          { name: 'Water Bottle', category_id: getCategoryId('Drinks'), price: 20.00, tax: 0.00, uom: 'bottle', description: '500ml', image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=600&auto=format&fit=crop', send_to_kitchen: false },
          { name: 'Cold Coffee', category_id: getCategoryId('Drinks'), price: 200.00, tax: 5.00, uom: 'glass', description: 'Iced cold coffee', image_url: 'https://images.unsplash.com/photo-1517701604599-bb24b3180ddf?q=80&w=600&auto=format&fit=crop', send_to_kitchen: false },
          { name: 'Lemon Soda', category_id: getCategoryId('Drinks'), price: 80.00, tax: 5.00, uom: 'glass', description: 'Fresh lemon soda', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop', send_to_kitchen: false },
          { name: 'Chocolate Brownie', category_id: getCategoryId('Desserts'), price: 210.00, tax: 5.00, uom: 'piece', description: 'Walnut brownie', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600&auto=format&fit=crop', send_to_kitchen: true }
        ]
      });
      console.log('  ✅ Products inserted');
    }

    // Floors & Tables
    const floorsCount = await prisma.floor.count();
    if (floorsCount === 0) {
      await prisma.floor.createMany({
        data: [
          { id: 1, name: 'Ground Floor', sequence: 1 },
          { id: 2, name: 'First Floor', sequence: 2 }
        ]
      });
      
      await prisma.table.createMany({
        data: [
          { floor_id: 1, table_number: 'T1', seats: 4, status: 'available' },
          { floor_id: 1, table_number: 'T2', seats: 2, status: 'available' },
          { floor_id: 1, table_number: 'T3', seats: 6, status: 'available' },
          { floor_id: 1, table_number: 'T4', seats: 4, status: 'available' },
          { floor_id: 1, table_number: 'T5', seats: 8, status: 'available' },
          { floor_id: 1, table_number: 'T6', seats: 2, status: 'available' }
        ]
      });
      console.log('  ✅ Floors + Tables inserted');
    }
    
    // Payment Methods
    const methodsCount = await prisma.paymentMethod.count();
    if (methodsCount === 0) {
      await prisma.paymentMethod.createMany({
        data: [
          { name: 'Cash', type: 'cash', is_enabled: true },
          { name: 'Digital', type: 'digital', is_enabled: true },
          { name: 'UPI', type: 'upi', is_enabled: true, upi_id: 'merchant@upi' }
        ]
      });
      console.log('  ✅ Payment Methods inserted');
    }

    console.log('\n🎉 Seed completed!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();

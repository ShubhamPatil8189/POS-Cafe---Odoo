const prisma = require('./config/database');

const initDB = async () => {
  try {
    // With Prisma, schema is handled via prisma generate / prisma db push.
    // We only need to handle the seeding of default data.

    // Seed Data: Floors
    let groundFloorId;
    const existingGround = await prisma.floor.findFirst({
      where: { name: 'Ground Floor' }
    });
    
    if (!existingGround) {
      const result = await prisma.floor.create({
        data: { name: 'Ground Floor', sequence: 0 }
      });
      groundFloorId = result.id;
      console.log('🌱 Seeded: Ground Floor');
    } else {
      groundFloorId = existingGround.id;
    }

    const existingFirst = await prisma.floor.findFirst({
      where: {
        OR: [
          { name: 'First Floor' },
          { id: 2 }
        ]
      }
    });

    if (!existingFirst) {
      // Prisma create with specific ID is tricky with autoincrement if you don't explicitly pass it
      // but let's try to just create it
      await prisma.floor.create({
        data: { id: 2, name: 'First Floor', sequence: 1 }
      });
      console.log('🌱 Seeded: First Floor (ID = 2)');
    }

    // Seed Data: Tables for Ground Floor
    console.log("🌱 Checking Ground Floor tables (T1-T6)...");
    for (let i = 1; i <= 6; i++) {
      const tableNum = `T${i}`;
      const tableCheck = await prisma.table.findFirst({
        where: { floor_id: groundFloorId, table_number: tableNum }
      });
      if (!tableCheck) {
        await prisma.table.create({
          data: {
            floor_id: groundFloorId,
            table_number: tableNum,
            seats: i === 3 ? 6 : (i === 6 ? 8 : (i === 4 ? 2 : 4)),
            status: 'available'
          }
        });
        console.log(`🌱 Seeded Table: ${tableNum}`);
      }
    }

    // Seed Data: Payment Methods
    const methodsCount = await prisma.paymentMethod.count();
    if (methodsCount === 0) {
      await prisma.paymentMethod.createMany({
        data: [
          { type: 'cash', is_enabled: true },
          { type: 'digital', is_enabled: true },
          { type: 'upi', is_enabled: true, upi_id: '123@ybl.com' }
        ]
      });
      console.log('🌱 Seeded: Payment methods');
    }

    // Note: pos_terminal was in original db.js but not in schema.prisma.
    // If it's missing in Prisma schema, we might need to add it later. For now we skip it.
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
};

module.exports = { initDB, prisma };

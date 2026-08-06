const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ TiDB Cloud connected successfully (via Prisma)');
  })
  .catch(err => {
    console.error('❌ TiDB Cloud connection failed:', err.message);
  });

module.exports = prisma;

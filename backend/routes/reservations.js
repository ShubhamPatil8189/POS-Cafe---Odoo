const express = require('express');
const prisma = require('../config/database');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/ModuleB_reservations
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT r.*, t.table_number 
      FROM ModuleB_reservations r 
      JOIN tables t ON r.table_id = t.id 
      ORDER BY r.reserved_time DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ModuleB_reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ModuleB_reservations/active
router.get('/active', async (req, res) => {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT r.*, t.table_number 
      FROM ModuleB_reservations r 
      JOIN tables t ON r.table_id = t.id 
      WHERE r.status = "active"
      ORDER BY r.reserved_time ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active ModuleB_reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ModuleB_reservations
router.post('/', async (req, res) => {
  try {
    const { table_id, customer_name, phone, reserved_time, expiry_time } = req.body;
    
    // Check if table is available
    const table = await prisma.table.findUnique({
      where: { id: parseInt(table_id) },
      select: { status: true }
    });
    
    if (!table) return res.status(404).json({ error: 'Table not found' });
    if (table.status !== 'available') return res.status(400).json({ error: `Table is currently ${table.status}, cannot reserve.` });

    // Use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Insert reservation
      const reservation = await tx.moduleBReservation.create({
        data: {
          table_id: parseInt(table_id),
          customer_name,
          phone,
          reserved_time: new Date(reserved_time),
          expiry_time: new Date(expiry_time),
          status: 'active'
        }
      });

      // Update table status
      await tx.table.update({
        where: { id: parseInt(table_id) },
        data: { status: 'reserved' }
      });
      
      return reservation;
    });

    res.status(201).json({ id: result.id, table_id, customer_name, status: 'active' });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/ModuleB_reservations/:id/checkin
router.put('/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;

    const resRow = await prisma.moduleBReservation.findUnique({
      where: { id: parseInt(id) },
      select: { table_id: true, status: true }
    });
    
    if (!resRow) return res.status(404).json({ error: 'Reservation not found' });
    if (resRow.status !== 'active') return res.status(400).json({ error: 'Reservation is not active' });

    await prisma.$transaction(async (tx) => {
      // Update reservation
      await tx.moduleBReservation.update({
        where: { id: parseInt(id) },
        data: { status: 'completed' }
      });
      
      // Update table
      if (resRow.table_id) {
        await tx.table.update({
          where: { id: resRow.table_id },
          data: { status: 'occupied' }
        });
      }
    });

    res.json({ id: parseInt(id), status: 'completed' });
  } catch (error) {
    console.error('Error checking in reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reservations/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const resRow = await prisma.moduleBReservation.findUnique({
      where: { id: parseInt(id) },
      select: { table_id: true }
    });
    
    if (!resRow) return res.status(404).json({ error: 'Reservation not found' });

    await prisma.$transaction(async (tx) => {
      // Update reservation
      await tx.moduleBReservation.update({
        where: { id: parseInt(id) },
        data: { status: 'expired' }
      });
      
      // Update table
      if (resRow.table_id) {
        await tx.table.update({
          where: { id: resRow.table_id },
          data: { status: 'available' }
        });
      }
    });

    res.json({ id: parseInt(id), status: 'expired' });
  } catch (error) {
    console.error('Error canceling reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


const express = require('express');
const prisma = require('../config/database');

const router = express.Router();
const auth = require('../middleware/auth');

// GET /api/payment-methods (Public)
router.get('/', async (req, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany();
    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(auth);

// PUT /api/payment-methods/:id (Protected)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_enabled, upi_id } = req.body;

    const data = {};
    if (is_enabled !== undefined) data.is_enabled = is_enabled;
    if (upi_id !== undefined) data.upi_id = upi_id;

    if (Object.keys(data).length > 0) {
      const updated = await prisma.paymentMethod.update({
        where: { id: parseInt(id) },
        data
      });
      return res.json(updated);
    }

    const method = await prisma.paymentMethod.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!method) return res.status(404).json({ error: 'Payment method not found' });

    res.json(method);
  } catch (error) {
    console.error('Error updating payment method:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
const express = require('express');
const prisma = require('../config/database');

const router = express.Router();
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/sessions/current
router.get('/current', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { id: 'desc' }
    });
    
    if (!session) return res.json(null);
    
    // Calculate cash and digital sales for this session from the payments database
    const salesRows = await prisma.$queryRawUnsafe(`
      SELECT 
        SUM(CASE WHEN pm.type = 'cash' THEN p.amount ELSE 0 END) as cash,
        SUM(CASE WHEN pm.type != 'cash' THEN p.amount ELSE 0 END) as digital
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN payment_methods pm ON p.method_id = pm.id
      WHERE o.session_id = ?
    `, session.id);
    
    session.sales = {
      cash: salesRows[0]?.cash ? parseFloat(salesRows[0].cash) : 0,
      digital: salesRows[0]?.digital ? parseFloat(salesRows[0].digital) : 0
    };
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching current session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { start_time: 'desc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions/open
router.post('/open', async (req, res) => {
  try {
    const { terminal_id, opening_balance } = req.body;
    
    // Check if session already open
    const openSession = await prisma.session.findFirst({
      where: { status: 'open' }
    });
    
    if (openSession) {
      return res.status(400).json({ error: 'A session is already open' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Insert new session
      const newSession = await tx.session.create({
        data: {
          terminal_id: terminal_id ? parseInt(terminal_id) : null,
          status: 'open',
          opening_balance: opening_balance || 0,
          start_time: new Date()
        }
      });

      // Update pos_terminal
      if (terminal_id) {
        await tx.posTerminal.update({
          where: { id: parseInt(terminal_id) },
          data: { last_open_date: new Date() }
        });
      }
      
      return newSession;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error opening session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sessions/close
router.post('/close', async (req, res) => {
  try {
    const { session_id, closing_balance } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });

    const result = await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.session.updateMany({
        where: { id: parseInt(session_id), status: 'open' },
        data: {
          status: 'closed',
          end_time: new Date(),
          closing_balance: closing_balance || 0
        }
      });
      
      if (updatedSession.count === 0) {
         throw new Error('[NotFound] Session closed or not found');
      }

      const sessionData = await tx.session.findUnique({
        where: { id: parseInt(session_id) }
      });

      if (sessionData && sessionData.terminal_id) {
         await tx.posTerminal.update({
           where: { id: sessionData.terminal_id },
           data: { last_sell_amount: closing_balance || 0 }
         });
      }
      
      return sessionData;
    });

    res.json(result);
  } catch (error) {
    if (error.message.startsWith('[NotFound]')) {
       return res.json({ message: "Session closed or not found" });
    }
    console.error('Error closing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


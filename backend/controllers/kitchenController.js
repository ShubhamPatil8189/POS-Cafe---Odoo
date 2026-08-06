const prisma = require('../config/database');

// GET /api/kitchen/orders/active
exports.getActiveOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['preparing', 'ready'] }
      },
      orderBy: { updated_at: 'asc' },
      include: {
        order_lines: true
      }
    });

    if (orders.length === 0) {
      return res.json([]);
    }

    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.order_number,
      table_number: order.table_id,
      status: order.status,
      notes: order.notes,
      updated_at: order.updated_at,
      items: order.order_lines.map(item => ({
        id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        is_prepared: item.kitchen_status === 'ready',
        special_instructions: item.notes
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Fetch active kitchen orders error:', error);
    res.status(500).json({ error: 'Failed to fetch kitchen orders.' });
  }
};

// PUT /api/kitchen/orders/:id/stage
exports.updateOrderStage = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['preparing', 'ready', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid kitchen status.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: parseInt(id) },
        data: { status }
      });
      
      // If ticket is completed, mark all its items ready internally
      if (status === 'completed' || status === 'ready') {
        await tx.orderLine.updateMany({
          where: { order_id: parseInt(id) },
          data: { kitchen_status: 'ready' }
        });
         
        // Start 30-minute eating timer for self-orders when kitchen completes the order
        const order = await tx.order.findUnique({
          where: { id: parseInt(id) },
          select: { table_id: true, source: true }
        });

        if (order && order.table_id && order.source === 'self_order') {
          const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
          await tx.table.update({
            where: { id: order.table_id },
            data: { 
              status: "occupied", 
              self_order_expiry: expiryDate 
            }
          });
        }
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('kitchen:stage-updated', { orderId: id, stage: status });
      // Notify customer display if they are watching
      io.to(`customer:${id}`).emit('kitchen:stage-updated', { orderId: id, stage: status });
    }

    res.json({ id, status, updated_at: new Date() });
  } catch(error) {
    console.error('Update kitchen stage error:', error);
    res.status(500).json({ error: 'Failed to update stage.' });
  }
};

// PUT /api/kitchen/orders/:id/items/:itemId
exports.markItemPrepared = async (req, res) => {
  const { id, itemId } = req.params;
  const { is_prepared } = req.body;

  const kitchen_status = is_prepared ? 'ready' : 'preparing';

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.orderLine.update({
        where: { id: parseInt(itemId) },
        data: { kitchen_status }
      });

      // Check if ALL items in this order are now prepared
      const allItems = await tx.orderLine.findMany({
        where: { order_id: parseInt(id) },
        select: { kitchen_status: true }
      });

      const allReady = allItems.every(item => item.kitchen_status === 'ready');
      let orderStatusChanged = null;

      if (allReady) {
        // Auto move the root order to 'ready'
        await tx.order.update({
          where: { id: parseInt(id) },
          data: { status: 'ready' }
        });
        orderStatusChanged = 'ready';
      } else {
        // Ensure the root order says 'preparing'
        await tx.order.update({
          where: { id: parseInt(id) },
          data: { status: 'preparing' }
        });
        orderStatusChanged = 'preparing';
      }
      
      return orderStatusChanged;
    });

    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('kitchen:item-prepared', { orderId: id, itemId, isPrepared: is_prepared });
      if (result) {
        io.to('kitchen').emit('kitchen:stage-updated', { orderId: id, stage: result });
      }
    }

    res.json({ id: itemId, is_prepared, prepared_at: is_prepared ? new Date() : null, orderStatusChanged: result });
  } catch(error) {
    console.error('Mark item prepared error:', error);
    res.status(500).json({ error: 'Failed to mark item prepared.' });
  }
};

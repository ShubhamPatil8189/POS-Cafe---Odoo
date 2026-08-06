const prisma = require('../config/database');

// GET /api/customer-display/board
exports.getActiveBoardOrders = async (req, res) => {
  try {
    // Fetch orders that are currently active or completed very recently
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: { in: ['preparing', 'ready', 'confirmed'] } },
          { 
            status: 'completed',
            updated_at: { gte: fifteenMinsAgo }
          }
        ]
      },
      orderBy: { created_at: 'asc' },
      include: {
        order_lines: {
          select: {
            product_name: true,
            quantity: true,
            order_id: true
          }
        }
      }
    });

    const formattedOrders = orders.map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      tableNumber: o.table_id || '—',
      status: o.status,
      paid: Boolean(o.is_paid),
      createdAt: new Date(o.created_at).getTime(),
      items: o.order_lines.map(i => ({ name: i.product_name, qty: i.quantity }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Fetch active board orders error:', error);
    res.status(500).json({ error: 'Failed to fetch board data.' });
  }
};

exports.getCustomerDisplay = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch order details
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        order_lines: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Fetch payment status
    const payment = await prisma.payment.findFirst({
      where: { order_id: order.id },
      orderBy: { created_at: 'desc' }
    });

    // Determine final payment status manually
    let payment_status = 'unpaid';
    if ((payment && payment.status === 'completed') || order.status === 'completed') {
      payment_status = 'paid';
    }

    res.json({
      order_number: order.order_number,
      table_number: order.table_id,
      items: order.order_lines.map(i => ({ 
        name: i.product_name, 
        quantity: parseFloat(i.quantity).toFixed(0),
        price: parseFloat(i.unit_price),
        subtotal: parseFloat(i.subtotal)
      })),
      total_amount: parseFloat(order.total),
      tax_amount: parseFloat(order.tax_total),
      payment_status
    });

  } catch (error) {
    console.error('Fetch customer display error:', error);
    res.status(500).json({ error: 'Failed to fetch customer display data.' });
  }
};

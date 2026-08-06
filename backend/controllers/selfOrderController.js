const prisma = require('../config/database');
const crypto = require('crypto');
const QRCode = require('qrcode');

// Internal utility to recalculate order total (replicated from orderController for decoupling)
async function recalculateOrderTotal(orderId, tx = prisma) {
  const items = await tx.orderLine.findMany({
    where: { order_id: parseInt(orderId) },
    select: { subtotal: true, tax: true }
  });

  let subtotal = 0;
  let taxTotal = 0;

  items.forEach(item => {
    subtotal += parseFloat(item.subtotal || 0);
    taxTotal += parseFloat(item.tax || 0);
  });

  for (let i = 0; i < items.length; i++) {
    console.log(items[i].subtotal);
    console.log(items[i].tax);
  }

  const total = subtotal + taxTotal;

  await tx.order.update({
    where: { id: parseInt(orderId) },
    data: {
      subtotal: subtotal.toFixed(2),
      tax_total: taxTotal.toFixed(2),
      total: total.toFixed(2)
    }
  });

  return { subtotal, taxTotal, total };
}

// ── GET /api/self-order/qr-codes ────────────────────────
exports.getQRData = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      where: { is_active: true },
      select: { id: true, table_number: true }
    });
    
    const baseUrl = process.env.FRONTEND_SELF_ORDER_URL || `${req.protocol}://${req.get('host').replace(/:\d+/, ':5173')}/self-order`;

    const qrData = tables.map(t => ({
      table_id: t.id,
      table_number: t.table_number,
      qr_url: `${baseUrl}?tableId=${t.id}`
    }));

    res.json(qrData);
  } catch (error) {
    console.error('Get QR Data error:', error);
    res.status(500).json({ error: 'Failed to fetch QR data.' });
  }
};

// ── GET /api/self-order/qr/:tableId ─────────────────────
// Returns the actual QR image (buffer)
exports.getQRImage = async (req, res) => {
  try {
    const { tableId } = req.params;
    const baseUrl = process.env.FRONTEND_SELF_ORDER_URL || `${req.protocol}://${req.get('host').replace(/:\d+/, ':5173')}/self-order`;
    const url = `${baseUrl}?tableId=${tableId}`;

    const qrBuffer = await QRCode.toBuffer(url, {
      margin: 1,
      width: 400,
      color: {
        dark: '#4f46e5', // INDIGO-600
        light: '#ffffff'
      }
    });

    res.type('image/png').send(qrBuffer);
  } catch (err) {
    console.error('QR Gen error:', err);
    res.status(500).json({ error: 'Failed' });
  }
};

// ── POST /api/self-order/place-order ────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const { table_id: raw_table_id, items, checkout_type } = req.body; // checkout_type: 'advance' or 'kitchen'
    const table_id = parseInt(raw_table_id);

    if (isNaN(table_id) || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid Table ID and items are required.' });
    }

    if (!['advance', 'kitchen'].includes(checkout_type)) {
      return res.status(400).json({ error: 'Invalid checkout type.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 0. Verify Table Existence
      const tableCheck = await tx.table.findUnique({
        where: { id: table_id },
        select: { id: true }
      });
      
      if (!tableCheck) {
        throw new Error(`[NotFound] 404:Table ID ${table_id} does not exist. Please scan the latest QR code.`);
      }

      // 1. Generate Order Number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const orderNumber = `SELF-${dateStr}-${randomHex}`;

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          table_id: table_id,
          status: 'draft',
          source: 'self_order',
          checkout_type: checkout_type,
          is_paid: checkout_type === 'advance'
        }
      });

      // 3. Insert Order Lines
      const orderLinesData = items.map(item => {
        const qty = item.quantity ? parseFloat(item.quantity) : 1;
        const itemSubtotal = parseFloat(item.price) * qty;
        const itemTax = itemSubtotal * ((parseFloat(item.tax_rate) || 0) / 100);
        
        return {
          order_id: order.id,
          product_id: parseInt(item.product_id),
          product_name: item.name,
          quantity: qty,
          unit_price: parseFloat(item.price).toFixed(2),
          tax: itemTax.toFixed(2),
          subtotal: itemSubtotal.toFixed(2),
          notes: item.notes || null,
          kitchen_status: 'pending'
        };
      });

      await tx.orderLine.createMany({
        data: orderLinesData
      });

      // 4. Update Table Status
      if (checkout_type === 'advance') {
        // Pay in Advance: Mark occupied with 5-minute timer (USER REQUESTED 5 MIN)
        const expiryDate = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
        await tx.table.update({
          where: { id: table_id },
          data: { status: 'occupied', self_order_expiry: expiryDate }
        });
      } else {
        // Send to Kitchen: Mark occupied, no timer
        await tx.table.update({
          where: { id: table_id },
          data: { status: 'occupied', self_order_expiry: null }
        });
      }

      // 5. Finalize totals (async)
      await recalculateOrderTotal(order.id, tx);
      
      return { order_id: order.id, order_number: orderNumber };
    });

    // 6. Notify Kitchen via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const orderLines = await prisma.orderLine.findMany({
        where: { order_id: result.order_id }
      });
      
      io.emit('kitchen:new-order', {
        orderId: result.order_id,
        orderNumber: result.order_number,
        tableId: table_id,
        source: 'self_order',
        items: orderLines
      });
    }

    res.status(201).json({
      message: 'Order placed successfully.',
      order_id: result.order_id,
      order_number: result.order_number,
      checkout_type
    });

  } catch (error) {
    if (error.message.startsWith('[NotFound]')) {
      const parts = error.message.replace('[NotFound] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    console.error('Place self-order error:', error);
    res.status(500).json({ error: 'Failed to place self-order.' });
  }
};

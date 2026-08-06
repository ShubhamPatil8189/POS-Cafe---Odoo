const prisma = require('../config/database');

// Internal utility to recalculate order total
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

// Internal utility to check if order is modifiable
async function isOrderModifiable(orderId, tx = prisma) {
  const order = await tx.order.findUnique({
    where: { id: parseInt(orderId) },
    select: { status: true }
  });
  
  if (!order) return { error: 'Order not found', status: 404 };
  
  if (['completed', 'cancelled'].includes(order.status)) {
    return { error: `Order is ${order.status} and cannot be modified.`, status: 400 };
  }
  return { modifiable: true };
}

// ── Create Order ───────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { session_id, table_id, user_id, order_type = 'pos', checkout_type = 'kitchen', is_paid = false } = req.body;
    
    // Generate Order Number (e.g., ORD-20260404-XXXX)
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const orderNumber = `ORD-${dateStr}-${randomHex}`;

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          session_id: session_id ? parseInt(session_id) : null,
          table_id: table_id ? parseInt(table_id) : null,
          user_id: user_id ? parseInt(user_id) : null,
          status: 'draft',
          source: order_type === 'self-order' ? 'self_order' : (order_type || 'pos'),
          checkout_type: checkout_type || 'kitchen',
          is_paid: Boolean(is_paid)
        }
      });

      // If table provided, set table status to occupied
      if (table_id) {
        await tx.table.update({
          where: { id: parseInt(table_id) },
          data: { status: 'occupied' }
        });
      }

      return order;
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order.' });
  }
};

// ── Get All Orders ─────────────────────────────────────
exports.getOrders = async (req, res) => {
  try {
    const { status, session_id, table_id, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (session_id) where.session_id = parseInt(session_id);
    if (table_id) where.table_id = parseInt(table_id);

    const orders = await prisma.order.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { created_at: 'desc' },
      include: {
        table: {
          select: { table_number: true }
        }
      }
    });

    const formattedOrders = orders.map(o => ({
      ...o,
      table_number: o.table?.table_number || null,
      table: undefined
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// ── Get Order Items ────────────────────────────────────
exports.getOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const items = await prisma.orderLine.findMany({
      where: { order_id: parseInt(id) }
    });
    res.json(items);
  } catch (error) {
    console.error('Get order items error:', error);
    res.status(500).json({ error: 'Failed to fetch order items.' });
  }
};

// ── Get Single Order ───────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { order_lines: true }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    
    const formattedOrder = {
      ...order,
      items: order.order_lines
    };
    delete formattedOrder.order_lines;
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// ── Get Active Order For Table ─────────────────────────
exports.getActiveTableOrder = async (req, res) => {
  try {
    const { tableId } = req.params;
    
    // Find an order for this table that hasn't been completed/cancelled
    const order = await prisma.order.findFirst({
      where: {
        table_id: parseInt(tableId),
        status: { notIn: ['completed', 'cancelled'] }
      },
      orderBy: { created_at: 'desc' },
      include: { order_lines: true }
    });
    
    if (!order) return res.status(404).json({ error: 'No active order for this table.' });
    
    const formattedOrder = {
      ...order,
      items: order.order_lines
    };
    delete formattedOrder.order_lines;
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('Get table order error:', error);
    res.status(500).json({ error: 'Failed to fetch active order for table.' });
  }
};

// ── Get All Orders for Session ─────────────────────────
exports.getSessionOrders = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const orders = await prisma.order.findMany({
      where: { session_id: parseInt(sessionId) },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Get session orders error:', error);
    res.status(500).json({ error: 'Failed to fetch session orders.' });
  }
};

// ── Add Item to Order ──────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const { product_id, product_name, quantity, price, tax_rate, notes } = req.body;

    if (!product_id || !product_name || !price) {
      return res.status(400).json({ error: 'product_id, product_name, and price are required.' });
    }

    const created = await prisma.$transaction(async (tx) => {
      // Status Guard
      const guard = await isOrderModifiable(id, tx);
      if (guard.error) throw new Error(`[StatusGuard] ${guard.status}:${guard.error}`);

      const qty = quantity ? parseFloat(quantity) : 1;
      
      // CONSOLIDATION LOGIC: Check if item already exists
      const existing = await tx.orderLine.findFirst({
        where: {
          order_id: parseInt(id),
          product_id: parseInt(product_id),
          notes: notes || null
        }
      });

      let lineItem;
      if (existing) {
        // Update existing line
        const newQty = parseFloat(existing.quantity || 0) + qty;
        const newSubtotal = parseFloat(price) * newQty;
        const newTax = newSubtotal * ((parseFloat(tax_rate) || 0) / 100);

        lineItem = await tx.orderLine.update({
          where: { id: existing.id },
          data: {
            quantity: newQty,
            subtotal: newSubtotal.toFixed(2),
            tax: newTax.toFixed(2)
          }
        });
      } else {
        // Insert new line
        const itemSubtotal = parseFloat(price) * qty;
        const itemTax = itemSubtotal * ((parseFloat(tax_rate) || 0) / 100);

        lineItem = await tx.orderLine.create({
          data: {
            order_id: parseInt(id),
            product_id: parseInt(product_id),
            product_name,
            quantity: qty,
            unit_price: parseFloat(price).toFixed(2),
            tax: itemTax.toFixed(2),
            subtotal: itemSubtotal.toFixed(2),
            notes: notes || null
          }
        });
      }

      // Recalculate full order
      await recalculateOrderTotal(id, tx);
      
      return lineItem;
    });

    res.status(201).json(created);
  } catch (error) {
    if (error.message.startsWith('[StatusGuard]')) {
      const parts = error.message.replace('[StatusGuard] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    require('fs').appendFileSync('error.log', 'Add item error: ' + error.stack + '\n');
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item to order.' });
  }
};

// ── Update Item Quantity/Notes ─────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const { id, itemId } = req.params; // order id, line item id
    const { quantity, notes } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      // Status Guard
      const guard = await isOrderModifiable(id, tx);
      if (guard.error) throw new Error(`[StatusGuard] ${guard.status}:${guard.error}`);

      const item = await tx.orderLine.findUnique({
        where: { id: parseInt(itemId) }
      });
      
      if (!item || item.order_id !== parseInt(id)) {
        throw new Error(`[NotFound] 404:Item not found in order.`);
      }
      
      const newQty = quantity !== undefined ? parseFloat(quantity) : parseFloat(item.quantity || 1);
      
      const newSubtotal = parseFloat(item.unit_price) * newQty;
      // Reverse engineer tax rate from old tax amount, or just calculate proportionally
      const oldSubtotal = parseFloat(item.subtotal || 0);
      const oldTax = parseFloat(item.tax || 0);
      const taxRate = oldSubtotal > 0 ? (oldTax / oldSubtotal) : 0;
      const newTax = newSubtotal * taxRate;

      const lineItem = await tx.orderLine.update({
        where: { id: parseInt(itemId) },
        data: {
          quantity: newQty,
          subtotal: newSubtotal.toFixed(2),
          tax: newTax.toFixed(2),
          notes: notes !== undefined ? notes : item.notes
        }
      });

      await recalculateOrderTotal(id, tx);
      return lineItem;
    });
    
    res.json(updated);
  } catch (error) {
    if (error.message.startsWith('[StatusGuard]')) {
      const parts = error.message.replace('[StatusGuard] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    if (error.message.startsWith('[NotFound]')) {
      const parts = error.message.replace('[NotFound] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item.' });
  }
};

// ── Remove Item ────────────────────────────────────────
exports.removeItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    await prisma.$transaction(async (tx) => {
      // Status Guard
      const guard = await isOrderModifiable(id, tx);
      if (guard.error) throw new Error(`[StatusGuard] ${guard.status}:${guard.error}`);

      const existing = await tx.orderLine.findUnique({
        where: { id: parseInt(itemId) }
      });
      
      if (!existing || existing.order_id !== parseInt(id)) {
        throw new Error(`[NotFound] 404:Item not found.`);
      }

      await tx.orderLine.delete({
        where: { id: parseInt(itemId) }
      });
      
      await recalculateOrderTotal(id, tx);
    });
    
    res.json({ message: 'Item removed successfully.' });
  } catch (error) {
    if (error.message.startsWith('[StatusGuard]')) {
      const parts = error.message.replace('[StatusGuard] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    if (error.message.startsWith('[NotFound]')) {
      const parts = error.message.replace('[NotFound] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    console.error('Remove item error:', error);
    res.status(500).json({ error: 'Failed to remove item.' });
  }
};

// ── Update Order Status ────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_paid, payment_method_type, session_id } = req.body;

    await prisma.$transaction(async (tx) => {
      if (status) {
        const validStatuses = ['draft', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
          throw new Error(`[BadRequest] 400:Invalid status.`);
        }
        await tx.order.update({
          where: { id: parseInt(id) },
          data: { status }
        });
      }

      if (is_paid !== undefined) {
        const updateData = { is_paid: Boolean(is_paid) };
        if (session_id) updateData.session_id = parseInt(session_id);
        
        await tx.order.update({
          where: { id: parseInt(id) },
          data: updateData
        });

        if (is_paid === true) {
          const paymentExists = await tx.payment.findFirst({
            where: { order_id: parseInt(id), status: 'completed' }
          });
          if (!paymentExists) {
            const order = await tx.order.findUnique({ where: { id: parseInt(id) } });
            const pmtType = payment_method_type || 'cash';
            const method = await tx.paymentMethod.findFirst({ where: { type: pmtType } });
            await tx.payment.create({
              data: {
                order_id: parseInt(id),
                method_id: method ? method.id : null,
                amount: order.total || 0,
                status: 'completed'
              }
            });
          }
        }
      }

      // TABLE STATUS AUTO-RELEASE: If order is cancelled, set table to available.
      // If order is completed or paid:
      //   - For self-orders, start the 30-min eating timer when completed.
      //   - For standard dine-in, release table (make available) ONLY when payment is explicitly processed in this request!
      const order = await tx.order.findUnique({
        where: { id: parseInt(id) },
        select: { table_id: true, source: true }
      });

      if (order && order.table_id) {
        if (status === 'cancelled') {
          await tx.table.update({
            where: { id: order.table_id },
            data: { status: 'available', self_order_expiry: null }
          });
        } else {
          if (order.source === 'self_order') {
            if (status === 'completed') {
              const expiryDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
              await tx.table.update({
                where: { id: order.table_id },
                data: { status: 'occupied', self_order_expiry: expiryDate }
              });
            }
          } else {
            // Standard dine-in: release table ONLY when cashier explicitly registers payment (is_paid: true) in this request
            if (is_paid === true) {
              await tx.table.update({
                where: { id: order.table_id },
                data: { status: 'available', self_order_expiry: null }
              });
            }
          }
        }
      }
    });

    res.json({ id: parseInt(id), status, is_paid });
  } catch (error) {
    if (error.message.startsWith('[BadRequest]')) {
      const parts = error.message.replace('[BadRequest] ', '').split(':');
      return res.status(parseInt(parts[0])).json({ error: parts.slice(1).join(':') });
    }
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status.' });
  }
};

// ── Send to Kitchen ────────────────────────────────────
exports.sendToKitchen = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Status Guard
    const guard = await isOrderModifiable(id);
    if (guard.error) return res.status(guard.status).json({ error: guard.error });

    // 1. Get the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { order_lines: true }
    });
    
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // 2. Set order status to preparing
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: parseInt(id) },
        data: { status: 'preparing' }
      });
      
      await tx.orderLine.updateMany({
        where: {
          order_id: parseInt(id),
          kitchen_status: 'pending'
        },
        data: { kitchen_status: 'preparing' }
      });
    });

    // 3. Emit socket event if io exists
    const io = req.app.get('io');
    if (io) {
      // Re-fetch items for socket
      const items = await prisma.orderLine.findMany({
        where: { order_id: parseInt(id) }
      });
      io.emit('kitchen:new-order', {
        orderId: order.id,
        orderNumber: order.order_number,
        tableId: order.table_id,
        items
      });
    }

    res.json({ message: 'Sent to kitchen section successfully.' });
  } catch (error) {
    console.error('Send to kitchen error:', error);
    res.status(500).json({ error: 'Failed to send to kitchen.' });
  }
};

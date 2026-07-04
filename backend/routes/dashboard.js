import { Router } from 'express';
const router = Router();

// GET dashboard stats
router.get('/', (req, res) => {
  // Total revenue today
  const revenueToday = req.db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments WHERE status = 'success' AND DATE(created_at) = DATE('now')
  `).get();

  // Total revenue all time
  const revenueTotal = req.db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM payments WHERE status = 'success'
  `).get();

  // Orders today
  const ordersToday = req.db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE('now')
  `).get();

  // Active orders
  const activeOrders = req.db.prepare(`
    SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('completed', 'paid')
  `).get();

  // Tables occupied
  const tablesOccupied = req.db.prepare(`
    SELECT COUNT(*) as count FROM tables WHERE status = 'occupied'
  `).get();

  // Total tables
  const totalTables = req.db.prepare(`
    SELECT COUNT(*) as count FROM tables WHERE is_active = 1
  `).get();

  // Total customers
  const totalCustomers = req.db.prepare(`
    SELECT COUNT(*) as count FROM customers
  `).get();

  // Recent orders
  const recentOrders = req.db.prepare(`
    SELECT o.*, t.table_number, f.name as floor_name
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    JOIN floors f ON t.floor_id = f.id
    ORDER BY o.created_at DESC LIMIT 10
  `).all();

  // Payment method breakdown
  const paymentMethods = req.db.prepare(`
    SELECT pm.type, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total
    FROM payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
    WHERE p.status = 'success'
    GROUP BY pm.type
  `).all();

  // Top selling products
  const topProducts = req.db.prepare(`
    SELECT p.name, p.is_veg, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  // Orders by status
  const ordersByStatus = req.db.prepare(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `).all();

  // Current session info
  const currentSession = req.db.prepare(`
    SELECT s.*, u.name as user_name, pt.name as terminal_name
    FROM sessions s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN pos_terminal pt ON s.terminal_id = pt.id
    WHERE s.status = 'open'
    ORDER BY s.id DESC LIMIT 1
  `).get();

  res.json({
    revenue: { today: revenueToday.total, total: revenueTotal.total },
    orders: { today: ordersToday.count, active: activeOrders.count, byStatus: ordersByStatus },
    tables: { occupied: tablesOccupied.count, total: totalTables.count },
    customers: { total: totalCustomers.count },
    recentOrders,
    paymentMethods,
    topProducts,
    currentSession
  });
});

export default router;

const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Helper function to build WHERE clause based on filters
const buildFilters = (query) => {
  const { period, session_id, user_id, product_id, start_date, end_date } = query;
  let conditions = ['1=1'];
  let params = [];

  if (period === 'today') {
    conditions.push('DATE(o.created_at) = CURDATE()');
  } else if (period === 'week') {
    conditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
  } else if (start_date && end_date) {
    conditions.push('o.created_at BETWEEN ? AND ?');
    params.push(start_date, end_date);
  }

  if (session_id) {
    conditions.push('o.session_id = ?');
    params.push(parseInt(session_id));
  }

  if (user_id) {
    conditions.push('o.user_id = ?');
    params.push(parseInt(user_id));
  }

  if (product_id) {
    conditions.push('ol.product_id = ?');
    params.push(parseInt(product_id));
  }

  return { sql: conditions.join(' AND '), params };
};

exports.getDashboard = async (req, res) => {
  try {
    // 1. Total Sales and Orders (Overall)
    const [totals] = await pool.query(
      `SELECT SUM(total) as total_sales, COUNT(id) as total_orders FROM orders WHERE status = 'completed'`
    );
    const total_sales = parseFloat(totals[0].total_sales || 0);
    const total_orders = totals[0].total_orders || 0;
    const avg_order_value = total_orders > 0 ? (total_sales / total_orders).toFixed(2) : 0;

    // 2. Today's figures
    const [today] = await pool.query(
      `SELECT SUM(total) as sales_today, COUNT(id) as orders_today 
       FROM orders WHERE status = 'completed' AND DATE(created_at) = CURDATE()`
    );

    // 3. Top Products
    const [topProducts] = await pool.query(
      `SELECT product_name as name, SUM(quantity) as quantity_sold, SUM(subtotal) as revenue 
       FROM order_lines ol
       JOIN orders o ON o.id = ol.order_id
       WHERE o.status = 'completed'
       GROUP BY product_name
       ORDER BY quantity_sold DESC
       LIMIT 5`
    );

    // 4. Payment Breakdown
    const [payments] = await pool.query(
      `SELECT pm.type, SUM(p.amount) as total
       FROM payments p
       JOIN payment_methods pm ON p.method_id = pm.id
       WHERE p.status = 'completed'
       GROUP BY pm.type`
    );
    // Calculate percentages
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const paymentBreakdown = payments.map(p => ({
      type: p.type,
      total: parseFloat(p.total),
      percentage: totalPayments > 0 ? ((parseFloat(p.total) / totalPayments) * 100).toFixed(0) : 0
    }));

    // 5. Sales by Day (last 7 days approx)
    const [salesByDay] = await pool.query(
      `SELECT DATE(created_at) as date, SUM(total) as total
       FROM orders
       WHERE status = 'completed'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC
       LIMIT 7`
    );

    res.json({
      total_sales,
      total_orders,
      avg_order_value: parseFloat(avg_order_value),
      orders_today: today[0].orders_today || 0,
      sales_today: parseFloat(today[0].sales_today || 0),
      top_products: topProducts.map(tp => ({ ...tp, quantity_sold: parseFloat(tp.quantity_sold), revenue: parseFloat(tp.revenue) })),
      payment_breakdown: paymentBreakdown,
      sales_by_day: salesByDay.map(s => ({ date: s.date, total: parseFloat(s.total) }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

exports.getSales = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    
    // We LEFT JOIN with order_lines if product_id is requested to filter it properly
    const query = `
      SELECT DISTINCT o.id as order_id, o.order_number, o.created_at as date, o.total,
             pm.type as payment_method, u.email as staff
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      LEFT JOIN users u ON o.user_id = u.id
      ${req.query.product_id ? 'LEFT JOIN order_lines ol ON ol.order_id = o.id' : ''}
      WHERE o.status = 'completed' AND ${filters.sql}
      ORDER BY o.created_at DESC
    `;
    
    const [orders] = await pool.query(query, filters.params);
    res.json(orders);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Failed to fetch sales report.' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const query = `
      SELECT DISTINCT o.order_number, o.created_at as date, o.total, pm.type as payment_method
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      ${req.query.product_id ? 'LEFT JOIN order_lines ol ON ol.order_id = o.id' : ''}
      WHERE o.status = 'completed' AND ${filters.sql}
      ORDER BY o.created_at DESC
    `;
    const [orders] = await pool.query(query, filters.params);

    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    
    doc.pipe(res);
    
    // PDF Body
    doc.fontSize(20).text('POS Cafe - Sales Report', { align: 'center' });
    doc.moveDown();
    
    let totalRevenue = 0;
    
    orders.forEach(order => {
       doc.fontSize(12).text(`Order: ${order.order_number} | Date: ${new Date(order.date).toLocaleString()} | Method: ${order.payment_method || 'N/A'} | Total: INR ${order.total}`);
       totalRevenue += parseFloat(order.total);
    });
    
    doc.moveDown();
    doc.fontSize(14).text(`Total Orders: ${orders.length}`);
    doc.fontSize(14).text(`Total Revenue: INR ${totalRevenue.toFixed(2)}`);
    
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to export PDF.' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const query = `
      SELECT DISTINCT o.order_number, o.created_at as date, o.total, pm.type as payment_method
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      ${req.query.product_id ? 'LEFT JOIN order_lines ol ON ol.order_id = o.id' : ''}
      WHERE o.status = 'completed' AND ${filters.sql}
      ORDER BY o.created_at DESC
    `;
    const [orders] = await pool.query(query, filters.params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Order Number', key: 'order_number', width: 25 },
      { header: 'Date', key: 'date', width: 25 },
      { header: 'Payment Method', key: 'payment_method', width: 15 },
      { header: 'Total (INR)', key: 'total', width: 15 }
    ];

    let totalRevenue = 0;
    orders.forEach(order => {
      worksheet.addRow({
        order_number: order.order_number,
        date: new Date(order.date).toLocaleString(),
        payment_method: order.payment_method || 'N/A',
        total: parseFloat(order.total)
      });
      totalRevenue += parseFloat(order.total);
    });

    worksheet.addRow({});
    worksheet.addRow({ payment_method: 'TOTAL', total: totalRevenue });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to export Excel.' });
  }
};

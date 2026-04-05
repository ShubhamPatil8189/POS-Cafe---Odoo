const pool = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// ─── Helper: Build WHERE clause from query params ──────────────
const buildFilters = (query) => {
  const { period, session_id, user_id, product_id, start_date, end_date } = query;
  let conditions = ['o.status = \'completed\''];
  let params = [];

  if (period === 'today') {
    conditions.push('DATE(o.created_at) = CURDATE()');
  } else if (period === 'week') {
    conditions.push('o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)');
  } else if (start_date && end_date) {
    conditions.push('DATE(o.created_at) BETWEEN ? AND ?');
    params.push(start_date, end_date);
  } else if (start_date) {
    conditions.push('DATE(o.created_at) >= ?');
    params.push(start_date);
  } else if (end_date) {
    conditions.push('DATE(o.created_at) <= ?');
    params.push(end_date);
  }

  if (session_id) {
    conditions.push('o.session_id = ?');
    params.push(parseInt(session_id));
  }

  if (user_id) {
    conditions.push('o.user_id = ?');
    params.push(parseInt(user_id));
  }

  // product_id filter is handled at join level — flag it separately
  return {
    sql: conditions.join(' AND '),
    params,
    hasProductFilter: !!product_id,
    product_id: product_id ? parseInt(product_id) : null,
  };
};

// ─── GET /api/reports/dashboard ──────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const f = buildFilters(req.query);
    const productJoin = f.hasProductFilter
      ? 'JOIN order_lines ol_filter ON ol_filter.order_id = o.id AND ol_filter.product_id = ?'
      : '';
    const productParams = f.hasProductFilter ? [f.product_id] : [];

    // 1. All-time totals
    const [totals] = await pool.query(
      `SELECT SUM(o.total) as total_sales, COUNT(DISTINCT o.id) as total_orders
       FROM orders o
       ${productJoin}
       WHERE ${f.sql}`,
      [...productParams, ...f.params]
    );
    const total_sales = parseFloat(totals[0].total_sales || 0);
    const total_orders = parseInt(totals[0].total_orders || 0);
    const avg_order_value = total_orders > 0
      ? parseFloat((total_sales / total_orders).toFixed(2))
      : 0;

    // 2. Today's figures
    const [today] = await pool.query(
      `SELECT SUM(o.total) as sales_today, COUNT(DISTINCT o.id) as orders_today
       FROM orders o
       ${productJoin}
       WHERE ${f.sql} AND DATE(o.created_at) = CURDATE()`,
      [...productParams, ...f.params]
    );

    // 3. Top 5 Products
    const [topProducts] = await pool.query(
      `SELECT ol.product_name as name,
              SUM(ol.quantity) as quantity_sold,
              SUM(ol.subtotal) as revenue
       FROM order_lines ol
       JOIN orders o ON o.id = ol.order_id
       ${productJoin}
       WHERE ${f.sql}
       GROUP BY ol.product_name
       ORDER BY quantity_sold DESC
       LIMIT 5`,
      [...productParams, ...f.params]
    );

    // 4. Payment method breakdown
    const [payments] = await pool.query(
      `SELECT pm.type, SUM(p.amount) as total
       FROM payments p
       JOIN payment_methods pm ON p.method_id = pm.id
       JOIN orders o ON o.id = p.order_id
       ${productJoin}
       WHERE p.status = 'completed' AND ${f.sql}
       GROUP BY pm.type`,
      [...productParams, ...f.params]
    );
    const totalPayments = payments.reduce((s, p) => s + parseFloat(p.total || 0), 0);
    const payment_breakdown = payments.map(p => ({
      type: p.type,
      total: parseFloat(p.total || 0),
      percentage: totalPayments > 0
        ? parseInt(((parseFloat(p.total) / totalPayments) * 100).toFixed(0))
        : 0,
    }));

    // 5. Sales trend
    const [salesByDay] = await pool.query(
      `SELECT DATE(o.created_at) as date, SUM(o.total) as total
       FROM orders o
       ${productJoin}
       WHERE ${f.sql}
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at) ASC`,
      [...productParams, ...f.params]
    );

    res.json({
      total_sales,
      total_orders,
      avg_order_value,
      orders_today: parseInt(today[0].orders_today || 0),
      sales_today: parseFloat(today[0].sales_today || 0),
      top_products: topProducts.map(tp => ({
        name: tp.name,
        quantity_sold: parseFloat(tp.quantity_sold || 0),
        revenue: parseFloat(tp.revenue || 0),
      })),
      payment_breakdown,
      sales_by_day: salesByDay.map(s => ({
        date: s.date,
        total: parseFloat(s.total || 0),
      })),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.', detail: error.message });
  }
};

// ─── GET /api/reports/sales ───────────────────────────────────
exports.getSales = async (req, res) => {
  try {
    const f = buildFilters(req.query);

    const productJoin = f.hasProductFilter
      ? 'JOIN order_lines ol_filter ON ol_filter.order_id = o.id AND ol_filter.product_id = ?'
      : '';
    const productParams = f.hasProductFilter ? [f.product_id] : [];

    const query = `
      SELECT DISTINCT
        o.id            AS order_id,
        o.order_number,
        o.created_at    AS date,
        o.total,
        pm.type         AS payment_method,
        u.name          AS staff_name,
        u.email         AS staff_email,
        s.id            AS session_id
      FROM orders o
      LEFT JOIN payments p  ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN sessions s ON o.session_id = s.id
      ${productJoin}
      WHERE ${f.sql}
      ORDER BY o.created_at DESC
      LIMIT 500
    `;

    const [orders] = await pool.query(query, [...productParams, ...f.params]);
    res.json(orders);
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Failed to fetch sales report.', detail: error.message });
  }
};

// ─── GET /api/reports/staff ───────────────────────────────────
exports.getStaff = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, role FROM users ORDER BY name ASC`
    );
    res.json(users);
  } catch (error) {
    console.error('Staff list error:', error);
    res.status(500).json({ error: 'Failed to fetch staff list.', detail: error.message });
  }
};

// ─── GET /api/reports/sessions ────────────────────────────────
exports.getSessions = async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `SELECT s.id, s.status, s.start_time, s.end_time, s.opening_balance,
              u.name AS opened_by
       FROM sessions s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.start_time DESC
       LIMIT 50`
    );
    res.json(sessions);
  } catch (error) {
    console.error('Sessions list error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions.', detail: error.message });
  }
};

// ─── GET /api/reports/export/pdf ─────────────────────────────
exports.exportPDF = async (req, res) => {
  try {
    const f = buildFilters(req.query);
    const productJoin = f.hasProductFilter
      ? 'JOIN order_lines ol_filter ON ol_filter.order_id = o.id AND ol_filter.product_id = ?'
      : '';
    const productParams = f.hasProductFilter ? [f.product_id] : [];

    const query = `
      SELECT DISTINCT
        o.order_number,
        o.created_at  AS date,
        o.total,
        pm.type       AS payment_method,
        u.name        AS staff_name
      FROM orders o
      LEFT JOIN payments p  ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      LEFT JOIN users u ON o.user_id = u.id
      ${productJoin}
      WHERE ${f.sql}
      ORDER BY o.created_at DESC
    `;
    const [orders] = await pool.query(query, [...productParams, ...f.params]);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    doc.pipe(res);

    // ── Header ──
    doc.fontSize(22).font('Helvetica-Bold').text('POS Cafe — Sales Report', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Table header ──
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000');
    doc.text('Order #', 50, doc.y, { width: 130, continued: true });
    doc.text('Date', { width: 150, continued: true });
    doc.text('Staff', { width: 110, continued: true });
    doc.text('Method', { width: 70, continued: true });
    doc.text('Total (₹)', { width: 80, align: 'right' });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);

    let totalRevenue = 0;
    doc.font('Helvetica').fontSize(9);
    orders.forEach((order, i) => {
      const y = doc.y;
      if (i % 2 === 0) {
        doc.rect(50, y - 4, 510, 18).fillColor('#f9fafb').fill();
        doc.fillColor('#000');
      }
      doc.text(order.order_number || '—', 50, y, { width: 130, continued: true });
      doc.text(new Date(order.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), { width: 150, continued: true });
      doc.text(order.staff_name || '—', { width: 110, continued: true });
      doc.text(order.payment_method || '—', { width: 70, continued: true });
      doc.text(`${parseFloat(order.total || 0).toFixed(2)}`, { width: 80, align: 'right' });
      totalRevenue += parseFloat(order.total || 0);

      if (doc.y > 700) { doc.addPage(); }
    });

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#6d28d9').lineWidth(1.5).stroke();
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#6d28d9');
    doc.text(`Total Orders: ${orders.length}`, 50, doc.y, { continued: true });
    doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF.', detail: error.message });
    }
  }
};

// ─── GET /api/reports/export/xls ─────────────────────────────
exports.exportExcel = async (req, res) => {
  try {
    const f = buildFilters(req.query);
    const productJoin = f.hasProductFilter
      ? 'JOIN order_lines ol_filter ON ol_filter.order_id = o.id AND ol_filter.product_id = ?'
      : '';
    const productParams = f.hasProductFilter ? [f.product_id] : [];

    const query = `
      SELECT DISTINCT
        o.order_number,
        o.created_at  AS date,
        o.total,
        pm.type       AS payment_method,
        u.name        AS staff_name
      FROM orders o
      LEFT JOIN payments p  ON p.order_id = o.id AND p.status = 'completed'
      LEFT JOIN payment_methods pm ON p.method_id = pm.id
      LEFT JOIN users u ON o.user_id = u.id
      ${productJoin}
      WHERE ${f.sql}
      ORDER BY o.created_at DESC
    `;
    const [orders] = await pool.query(query, [...productParams, ...f.params]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS Cafe';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Sales Report', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Title row
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'POS Cafe — Sales Report';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF6D28D9' } };
    titleCell.alignment = { horizontal: 'center' };

    ws.mergeCells('A2:F2');
    const subCell = ws.getCell('A2');
    subCell.value = `Generated: ${new Date().toLocaleString('en-IN')}`;
    subCell.font = { size: 10, color: { argb: 'FF666666' } };
    subCell.alignment = { horizontal: 'center' };

    ws.addRow([]);

    // Column definitions
    ws.columns = [
      { key: 'order_number', width: 22 },
      { key: 'date',         width: 28 },
      { key: 'staff_name',   width: 22 },
      { key: 'payment_method', width: 18 },
      { key: 'total',        width: 18 },
    ];

    // Header row
    const headerRow = ws.addRow(['Order #', 'Date & Time', 'Staff', 'Payment Method', 'Total (₹)']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } };
    headerRow.alignment = { horizontal: 'center' };

    let totalRevenue = 0;
    orders.forEach((order, i) => {
      const row = ws.addRow([
        order.order_number || '—',
        new Date(order.date).toLocaleString('en-IN'),
        order.staff_name || '—',
        order.payment_method || '—',
        parseFloat(order.total || 0),
      ]);
      // Alternating row colours
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      const totalCell = row.getCell(5);
      totalCell.numFmt = '₹#,##0.00';
      totalRevenue += parseFloat(order.total || 0);
    });

    // Totals row
    ws.addRow([]);
    const totalRow = ws.addRow(['', '', '', 'TOTAL', totalRevenue]);
    totalRow.font = { bold: true, color: { argb: 'FF6D28D9' } };
    totalRow.getCell(5).numFmt = '₹#,##0.00';

    // Summary worksheet
    const summaryWs = workbook.addWorksheet('Summary');
    summaryWs.columns = [{ key: 'key', width: 30 }, { key: 'value', width: 20 }];
    summaryWs.addRow(['Metric', 'Value']).font = { bold: true };
    summaryWs.addRow(['Total Orders', orders.length]);
    summaryWs.addRow(['Total Revenue (₹)', totalRevenue]);
    summaryWs.addRow(['Report Generated', new Date().toLocaleString('en-IN')]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export Excel.', detail: error.message });
    }
  }
};

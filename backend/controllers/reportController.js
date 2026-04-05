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

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
    doc.pipe(res);

    // ── Header Styling ──
    doc.rect(0, 0, 612, 100).fill('#6d28d9'); // Solid header bar
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff').text('POS CAFE', 40, 30);
    doc.fontSize(14).font('Helvetica').text('Sales & Revenue Report', 40, 60);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString('en-IN')}`, 40, 80, { align: 'right', width: 532 });

    doc.moveDown(4);

    // ── Column Definitions ──
    const colOrder = 40;
    const colDate = 160;
    const colStaff = 310;
    const colMethod = 430;
    const colTotal = 500;

    // ── Table Header ──
    const drawTableHeader = (y) => {
      doc.rect(40, y - 5, 532, 20).fill('#f1f5f9');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569');
      doc.text('ORDER #', colOrder, y);
      doc.text('DATE & TIME', colDate, y);
      doc.text('STAFF', colStaff, y);
      doc.text('METHOD', colMethod, y);
      doc.text('TOTAL (₹)', colTotal, y, { width: 72, align: 'right' });
      doc.moveTo(40, y + 15).lineTo(572, y + 15).strokeColor('#e2e8f0').lineWidth(1).stroke();
    };

    drawTableHeader(doc.y);
    doc.moveDown(1);

    let totalRevenue = 0;
    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    orders.forEach((order, i) => {
      // Page break check
      if (doc.y > 750) {
        doc.addPage();
        drawTableHeader(40);
        doc.y = 65;
        doc.font('Helvetica').fontSize(9).fillColor('#1e293b');
      }

      const y = doc.y;
      
      // Zebra striping
      if (i % 2 !== 0) {
        doc.rect(40, y - 4, 532, 18).fillColor('#f8fafc').fill();
      }
      doc.fillColor('#1e293b');

      // Data Rows
      const orderNum = order.order_number || '—';
      doc.text(orderNum.length > 20 ? orderNum.substring(0, 18) + '..' : orderNum, colOrder, y);
      
      const dateStr = new Date(order.date).toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
      });
      doc.text(dateStr, colDate, y);
      
      doc.text(order.staff_name || 'Admin', colStaff, y);
      
      const method = (order.payment_method || '—').toUpperCase();
      doc.text(method, colMethod, y);
      
      doc.text(parseFloat(order.total || 0).toFixed(2), colTotal, y, { width: 72, align: 'right' });
      
      totalRevenue += parseFloat(order.total || 0);
      doc.moveDown(0.8);
    });

    // ── Summary Section ──
    doc.moveDown(2);
    const summaryY = doc.y;
    if (summaryY > 700) doc.addPage();
    
    doc.rect(340, doc.y, 232, 80).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#1e293b');
    doc.fontSize(11).font('Helvetica-Bold').text('REPORT SUMMARY', 355, doc.y + 10);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Orders:`, 355, doc.y + 15);
    doc.text(`${orders.length}`, 520, doc.y - 12, { align: 'right', width: 40 });
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#6d28d9');
    doc.text(`GRAND TOTAL:`, 355, doc.y + 10);
    doc.text(`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, doc.y - 14, { align: 'right', width: 110 });

    // ── Footer ──
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Page ${i + 1} of ${pages.count} — System Generated Sales Report`,
        40, 
        doc.page.height - 30, 
        { align: 'center' }
      );
    }

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

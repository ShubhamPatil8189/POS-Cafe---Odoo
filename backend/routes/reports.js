const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Protect all report routes with JWT
router.use(auth);

// ── Admin-only guard middleware ──────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// GET /api/reports/dashboard  (admin only)
router.get('/dashboard', adminOnly, reportController.getDashboard);

// GET /api/reports/sales  (admin only)
router.get('/sales', adminOnly, reportController.getSales);

// GET /api/reports/staff  (admin only) — list all users for filter dropdown
router.get('/staff', adminOnly, reportController.getStaff);

// GET /api/reports/sessions  (admin only) — list sessions for filter dropdown
router.get('/sessions', adminOnly, reportController.getSessions);

// GET /api/reports/export/pdf  (admin only)
router.get('/export/pdf', adminOnly, reportController.exportPDF);

// GET /api/reports/export/xls  (admin only)
router.get('/export/xls', adminOnly, reportController.exportExcel);

module.exports = router;

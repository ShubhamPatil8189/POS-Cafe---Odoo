const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Protect all report routes (only staff/admin can view)
router.use(auth);

// GET /api/reports/dashboard
router.get('/dashboard', reportController.getDashboard);

// GET /api/reports/sales
router.get('/sales', reportController.getSales);

// GET /api/reports/export/pdf
router.get('/export/pdf', reportController.exportPDF);

// GET /api/reports/export/xls
router.get('/export/xls', reportController.exportExcel);

module.exports = router;

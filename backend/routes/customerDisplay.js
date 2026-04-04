const express = require('express');
const router = express.Router();
const customerDisplayController = require('../controllers/customerDisplayController');

// GET /api/customer-display/:orderId
router.get('/:orderId', customerDisplayController.getCustomerDisplay);

module.exports = router;

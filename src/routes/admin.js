const express = require('express');
const {
    getUsers,
    getStats,
    bulkGenerateCoupons,
    getCoupons
} = require('../controllers/admin');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here are admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/stats', getStats);
router.get('/coupons', getCoupons);
router.post('/coupons/bulk-generate', bulkGenerateCoupons);

module.exports = router;

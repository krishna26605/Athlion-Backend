const express = require('express');
const {
    getUsers,
    getStats,
    bulkGenerateCoupons,
    getCoupons,
    createOrUpdateEarlyBirdConfig,
    getAllEarlyBirdConfigs,
    getEarlyBirdConfig,
    deleteEarlyBirdConfig,
    getEarlyAccessLeads,
    getEarlyAccessAnalytics,
    getGymAnalytics,
    notifyEarlyAccessLeads,
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

// Early Bird Config routes
router.post('/early-bird', createOrUpdateEarlyBirdConfig);
router.get('/early-bird', getAllEarlyBirdConfigs);
router.get('/early-bird/:eventId', getEarlyBirdConfig);
router.delete('/early-bird/:eventId', deleteEarlyBirdConfig);

// Early Access Lead & Gym Analytics routes
router.get('/early-access/leads', getEarlyAccessLeads);
router.get('/early-access/analytics', getEarlyAccessAnalytics);
router.get('/early-access/gym-analytics', getGymAnalytics);
router.post('/early-access/notify', notifyEarlyAccessLeads);

module.exports = router;


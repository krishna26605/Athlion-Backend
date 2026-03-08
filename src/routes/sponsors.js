const express = require('express');
const {
    createSponsor,
    getSponsors,
    deleteSponsor,
    createCoupon,
    validateCoupon,
} = require('../controllers/sponsors');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
    .post(protect, authorize('admin'), createSponsor)
    .get(getSponsors);

router.delete('/:id', protect, authorize('admin'), deleteSponsor);

router.post('/coupons', protect, authorize('admin'), createCoupon);
router.post('/coupons/validate', protect, validateCoupon);

module.exports = router;

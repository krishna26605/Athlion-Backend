const express = require('express');
const {
    bookEvent,
    verifyPayment,
    getMyRegistrations,
    getAllRegistrations,
    verifyAthlete,
    checkDiscount,
    testRegister,
} = require('../controllers/registrations');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/book/:eventId', protect, bookEvent);
router.post('/test-register/:eventId', protect, testRegister);
router.post('/verify', protect, verifyPayment);
router.get('/my', protect, getMyRegistrations);
router.get('/check-discount/:eventId', protect, checkDiscount);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), getAllRegistrations);
router.post('/admin/verify/:id', protect, authorize('admin'), verifyAthlete);

module.exports = router;

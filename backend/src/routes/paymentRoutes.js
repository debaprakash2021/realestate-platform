const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// All routes require login
router.use(authMiddleware);

// ─── Guest Routes ─────────────────────────────────────────────────
router.post('/initiate', PaymentController.initiatePayment);     // Pay for booking
router.get('/my-payments', PaymentController.getMyPayments);       // My payment history
router.get('/booking/:bookingId', PaymentController.getPaymentByBooking); // Payment by booking

// ─── Host Routes ──────────────────────────────────────────────────
router.get('/my-earnings', PaymentController.getMyEarnings);       // Host earnings

// ─── Admin Routes ─────────────────────────────────────────────────
router.put('/:id/release', roleMiddleware('admin'), PaymentController.releasePayment); // Release to host
router.put('/:id/refund', roleMiddleware('admin'), PaymentController.refundPayment);  // Refund guest

module.exports = router;
const express           = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware    = require('../middlewares/authMiddleware');
const roleMiddleware    = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(authMiddleware);

// ─── Razorpay Flow ────────────────────────────────────────────────
router.post('/razorpay/create-order', PaymentController.createRazorpayOrder); // Step 1: Create order
router.post('/razorpay/verify',       PaymentController.verifyRazorpayPayment);// Step 2: Verify after success

// ─── Pay on Arrival ───────────────────────────────────────────────
router.post('/pay-on-arrival',        PaymentController.payOnArrival);

// ─── Fallback / Testing ───────────────────────────────────────────
router.post('/initiate',              PaymentController.initiatePayment);

// ─── Guest ────────────────────────────────────────────────────────
router.get('/my-payments',            PaymentController.getMyPayments);
router.get('/booking/:bookingId',     PaymentController.getPaymentByBooking);

// ─── Host ─────────────────────────────────────────────────────────
router.get('/my-earnings',            PaymentController.getMyEarnings);

// ─── Admin ────────────────────────────────────────────────────────
router.get('/admin/all',              roleMiddleware('admin'), PaymentController.getAllPayments);
router.put('/:id/release',            roleMiddleware('admin'), PaymentController.releasePayment);
router.put('/:id/refund',             roleMiddleware('admin'), PaymentController.refundPayment);

module.exports = router;
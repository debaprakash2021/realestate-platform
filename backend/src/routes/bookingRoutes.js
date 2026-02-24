const express = require('express');
const BookingController = require('../controllers/bookingController');
const authMiddleware    = require('../middlewares/authMiddleware');
const roleMiddleware    = require('../middlewares/roleMiddleware');

const router = express.Router();

// All booking routes require login
router.use(authMiddleware);

// ─── Guest Routes ─────────────────────────────────────────────────
router.post('/',                BookingController.createBooking);   // Create booking
router.get('/my-bookings',      BookingController.getMyBookings);   // Guest's bookings
router.put('/:id/cancel',       BookingController.cancelBooking);   // Cancel booking

// ─── Host Routes ──────────────────────────────────────────────────
router.get('/host-bookings',    BookingController.getHostBookings); // Host's bookings
router.put('/:id/confirm',      BookingController.confirmBooking);  // Confirm booking
router.put('/:id/reject',       BookingController.rejectBooking);   // Reject booking

// ─── Admin Routes ─────────────────────────────────────────────────
router.get('/',  roleMiddleware('admin'), BookingController.getAllBookings);  // All bookings
router.put('/:id/complete', roleMiddleware('admin'), BookingController.completeBooking); // Complete booking

// ─── Shared (guest + host) ────────────────────────────────────────
router.get('/:id',              BookingController.getBooking);      // Single booking

module.exports = router;
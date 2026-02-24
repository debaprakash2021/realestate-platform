const BookingService = require('../services/bookingService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class BookingController {

  // POST /api/bookings
  static async createBooking(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }
      const booking = await BookingService.createBooking(req.user.id, req.body);
      return ResponseHandler.success(res, booking, 'Booking created successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/bookings (admin)
  static async getAllBookings(req, res) {
    try {
      const result = await BookingService.getAllBookings(req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/bookings/:id
  static async getBooking(req, res) {
    try {
      const booking = await BookingService.getBookingById(req.params.id, req.user.id);
      return ResponseHandler.success(res, booking);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // GET /api/bookings/my-bookings (guest)
  static async getMyBookings(req, res) {
    try {
      const result = await BookingService.getGuestBookings(req.user.id, req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/bookings/host-bookings (host)
  static async getHostBookings(req, res) {
    try {
      const result = await BookingService.getHostBookings(req.user.id, req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // PUT /api/bookings/:id/confirm (host)
  static async confirmBooking(req, res) {
    try {
      const booking = await BookingService.confirmBooking(req.params.id, req.user.id);
      return ResponseHandler.success(res, booking, 'Booking confirmed successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/bookings/:id/reject (host)
  static async rejectBooking(req, res) {
    try {
      const booking = await BookingService.rejectBooking(req.params.id, req.user.id, req.body.reason);
      return ResponseHandler.success(res, booking, 'Booking rejected');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/bookings/:id/cancel (guest or host)
  static async cancelBooking(req, res) {
    try {
      const result = await BookingService.cancelBooking(req.params.id, req.user.id, req.body.reason);
      return ResponseHandler.success(res, result, `Booking cancelled. Refund: $${result.refundAmount}`);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/bookings/:id/complete (system/admin)
  static async completeBooking(req, res) {
    try {
      const booking = await BookingService.completeBooking(req.params.id);
      return ResponseHandler.success(res, booking, 'Booking completed, payment released to host');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = BookingController;
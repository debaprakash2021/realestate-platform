const PaymentService  = require('../services/paymentService');
const ResponseHandler = require('../utils/responseHandler');

class PaymentController {

  // POST /api/payments/initiate
  static async initiatePayment(req, res) {
    try {
      const { bookingId, method } = req.body;
      const payment = await PaymentService.initiatePayment(req.user.id, bookingId, method);
      return ResponseHandler.success(res, payment, 'Payment initiated successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/payments/:id/release
  static async releasePayment(req, res) {
    try {
      const payment = await PaymentService.releasePayment(req.params.id);
      return ResponseHandler.success(res, payment, 'Payment released to host');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/payments/:id/refund
  static async refundPayment(req, res) {
    try {
      const { reason, refundAmount } = req.body;
      const payment = await PaymentService.refundPayment(req.params.id, reason, refundAmount);
      return ResponseHandler.success(res, payment, 'Payment refunded successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/payments/booking/:bookingId
  static async getPaymentByBooking(req, res) {
    try {
      const payment = await PaymentService.getPaymentByBooking(req.params.bookingId, req.user.id);
      return ResponseHandler.success(res, payment);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/payments/my-payments
  static async getMyPayments(req, res) {
    try {
      const payments = await PaymentService.getGuestPayments(req.user.id);
      return ResponseHandler.success(res, payments);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/payments/my-earnings
  static async getMyEarnings(req, res) {
    try {
      const data = await PaymentService.getHostEarnings(req.user.id);
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = PaymentController;
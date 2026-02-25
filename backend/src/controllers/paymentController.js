const PaymentService  = require('../services/paymentService');
const ResponseHandler = require('../utils/responseHandler');

class PaymentController {

  // POST /api/payments/razorpay/create-order
  static async createRazorpayOrder(req, res) {
    try {
      const { bookingId, method } = req.body;
      const order = await PaymentService.createRazorpayOrder(req.user.id, bookingId, method);
      return ResponseHandler.success(res, order, 'Razorpay order created', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/payments/razorpay/verify
  static async verifyRazorpayPayment(req, res) {
    try {
      const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      const payment = await PaymentService.verifyRazorpayPayment(
        req.user.id, bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature
      );
      return ResponseHandler.success(res, payment, 'Payment verified successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/payments/pay-on-arrival
  static async payOnArrival(req, res) {
    try {
      const { bookingId } = req.body;
      const payment = await PaymentService.payOnArrival(req.user.id, bookingId);
      return ResponseHandler.success(res, payment, 'Pay on Arrival selected. ₹300 surcharge applied.', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/payments/initiate  (fallback / testing)
  static async initiatePayment(req, res) {
    try {
      const { bookingId, method } = req.body;
      const payment = await PaymentService.initiatePayment(req.user.id, bookingId, method);
      return ResponseHandler.success(res, payment, 'Payment initiated successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/payments/:id/release  (admin)
  static async releasePayment(req, res) {
    try {
      const payment = await PaymentService.releasePayment(req.params.id);
      return ResponseHandler.success(res, payment, 'Payment released to host');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/payments/:id/refund  (admin)
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

  // GET /api/payments/admin/all  (admin)
  static async getAllPayments(req, res) {
    try {
      const data = await PaymentService.getAllPayments(req.query);
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = PaymentController;
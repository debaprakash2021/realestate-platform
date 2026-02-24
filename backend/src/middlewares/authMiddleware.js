const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ResponseHandler.error(res, 'Not authorized to access this route', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        return ResponseHandler.error(res, 'User not found', 401);
      }

      if (!user.isActive) {
        return ResponseHandler.error(res, 'Account is deactivated', 401);
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error(`JWT verification error: ${error.message}`);
      return ResponseHandler.error(res, 'Not authorized to access this route', 401);
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return ResponseHandler.error(res, 'Server error', 500);
  }
};

module.exports = authMiddleware;

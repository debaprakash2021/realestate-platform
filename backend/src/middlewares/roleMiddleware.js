const ResponseHandler = require('../utils/responseHandler');

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.error(res, 'Not authorized', 401);
    }

    if (!roles.includes(req.user.role)) {
      return ResponseHandler.error(
        res, 
        `Role ${req.user.role} is not authorized to access this route`, 
        403
      );
    }

    next();
  };
};

module.exports = roleMiddleware;

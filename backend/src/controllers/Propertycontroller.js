const PropertyService = require('../services/propertyService');
const ResponseHandler = require('../utils/responseHandler');
const { validationResult } = require('express-validator');

class PropertyController {

  // POST /api/properties
  static async createProperty(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHandler.error(res, 'Validation failed', 400, errors.array());
      }
      const property = await PropertyService.createProperty(req.user.id, req.body);
      return ResponseHandler.success(res, property, 'Property created successfully', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/properties
  static async getAllProperties(req, res) {
    try {
      const result = await PropertyService.getAllProperties(req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/properties/:id
  static async getProperty(req, res) {
    try {
      const property = await PropertyService.getPropertyById(req.params.id);
      return ResponseHandler.success(res, property);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 404);
    }
  }

  // PUT /api/properties/:id
  static async updateProperty(req, res) {
    try {
      const property = await PropertyService.updateProperty(req.params.id, req.user.id, req.body);
      return ResponseHandler.success(res, property, 'Property updated successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // DELETE /api/properties/:id
  static async deleteProperty(req, res) {
    try {
      const result = await PropertyService.deleteProperty(req.params.id, req.user.id);
      return ResponseHandler.success(res, result, 'Property deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/properties/nearby?longitude=xx&latitude=yy&radius=10000
  static async getNearbyProperties(req, res) {
    try {
      const { longitude, latitude, radius } = req.query;
      if (!longitude || !latitude) {
        return ResponseHandler.error(res, 'Longitude and latitude are required', 400);
      }
      const properties = await PropertyService.findNearby(longitude, latitude, radius);
      return ResponseHandler.success(res, properties);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/properties/my-properties
  static async getMyProperties(req, res) {
    try {
      const properties = await PropertyService.getMyProperties(req.user.id);
      return ResponseHandler.success(res, properties);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/properties/:id/availability?checkIn=xx&checkOut=yy
  static async checkAvailability(req, res) {
    try {
      const { checkIn, checkOut } = req.query;
      if (!checkIn || !checkOut) {
        return ResponseHandler.error(res, 'checkIn and checkOut dates are required', 400);
      }
      const result = await PropertyService.checkAvailability(req.params.id, checkIn, checkOut);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = PropertyController;
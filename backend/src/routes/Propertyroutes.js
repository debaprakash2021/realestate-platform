const express = require('express');
const PropertyController = require('../controllers/propertyController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────────
router.get('/',        PropertyController.getAllProperties);
router.get('/nearby',  PropertyController.getNearbyProperties);

// ─── Protected specific routes BEFORE /:id ──────────────────────
router.get('/host/my-properties', authMiddleware, PropertyController.getMyProperties);

// ─── Public dynamic routes ───────────────────────────────────────
router.get('/:id',                PropertyController.getProperty);
router.get('/:id/availability',   PropertyController.checkAvailability);

// ─── Protected dynamic routes ────────────────────────────────────
router.post('/',       authMiddleware, PropertyController.createProperty);
router.put('/:id',     authMiddleware, PropertyController.updateProperty);
router.delete('/:id',  authMiddleware, PropertyController.deleteProperty);

module.exports = router;
const express = require('express');
const PropertyController = require('../controllers/Propertycontroller');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// ─── Public Routes ──────────────────────────────────────────────
router.get('/',        PropertyController.getAllProperties);
router.get('/nearby',  PropertyController.getNearbyProperties);
router.get('/:id',     PropertyController.getProperty);
router.get('/:id/availability', PropertyController.checkAvailability);

// ─── Protected Routes (login required) ─────────────────────────
router.post('/',       authMiddleware, PropertyController.createProperty);
router.put('/:id',     authMiddleware, PropertyController.updateProperty);
router.delete('/:id',  authMiddleware, PropertyController.deleteProperty);
router.get('/host/my-properties', authMiddleware, PropertyController.getMyProperties);

module.exports = router;
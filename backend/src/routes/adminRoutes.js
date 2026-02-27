const express = require('express');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ResponseHandler = require('../utils/responseHandler');

const router = express.Router();

// All routes require login + admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// ─────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────

// GET /api/admin/users  — list all users with filters
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);
    return ResponseHandler.success(res, {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    return ResponseHandler.error(res, err.message, 500);
  }
});

// GET /api/admin/users/:id  — single user detail
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return ResponseHandler.error(res, 'User not found', 404);
    return ResponseHandler.success(res, user);
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// PUT /api/admin/users/:id  — update role or active status
router.put('/users/:id', async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const allowed = {};
    if (role !== undefined) allowed.role = role;
    if (isActive !== undefined) allowed.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      allowed,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return ResponseHandler.error(res, 'User not found', 404);
    return ResponseHandler.success(res, user, 'User updated successfully');
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// DELETE /api/admin/users/:id  — deactivate (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return ResponseHandler.error(res, 'Cannot deactivate yourself', 400);
    }
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    return ResponseHandler.success(res, { message: 'User deactivated' });
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// ─────────────────────────────────────────────────────────────────
// PROPERTY MANAGEMENT
// ─────────────────────────────────────────────────────────────────

// GET /api/admin/properties  — all properties with filters
router.get('/properties', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, isVerified, isFeatured } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.country': { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('host', 'name email avatar')
        .select('title location pricing details ratings status isVerified isFeatured images host stats createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter)
    ]);
    return ResponseHandler.success(res, {
      properties,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    return ResponseHandler.error(res, err.message, 500);
  }
});

// PUT /api/admin/properties/:id/verify  — verify a listing
router.put('/properties/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isVerified: isVerified !== false },
      { new: true }
    ).populate('host', 'name email');
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);
    return ResponseHandler.success(res, property, `Property ${property.isVerified ? 'verified' : 'unverified'}`);
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// PUT /api/admin/properties/:id/feature  — feature/unfeature
router.put('/properties/:id/feature', async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { isFeatured: isFeatured !== false },
      { new: true }
    ).populate('host', 'name email');
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);
    return ResponseHandler.success(res, property, `Property ${property.isFeatured ? 'featured' : 'unfeatured'}`);
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// PUT /api/admin/properties/:id/status  — change status (active/inactive/suspended/pending/rejected)
router.put('/properties/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'inactive', 'suspended', 'pending', 'rejected'];
    if (!allowed.includes(status)) {
      return ResponseHandler.error(res, 'Invalid status. Must be: active, inactive, suspended, pending, or rejected', 400);
    }
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('host', 'name email');
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);
    return ResponseHandler.success(res, property, `Property status set to ${status}`);
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// PUT /api/admin/properties/:id/approve  — approve a pending listing
router.put('/properties/:id/approve', async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).populate('host', 'name email _id');
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);

    // Notify the host
    await Notification.create({
      user: property.host._id,
      type: 'property_approved',
      title: '🎉 Property Approved!',
      message: `Your property "${property.title}" has been approved and is now live on the platform.`,
      data: { propertyId: property._id }
    });

    return ResponseHandler.success(res, property, 'Property approved and now live');
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// PUT /api/admin/properties/:id/reject  — reject a pending listing
router.put('/properties/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('host', 'name email _id');
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);

    // Notify the host
    await Notification.create({
      user: property.host._id,
      type: 'booking_cancelled',
      title: '❌ Property Rejected',
      message: `Your property "${property.title}" was not approved.${reason ? ' Reason: ' + reason : ''} Please review and resubmit.`,
      data: { propertyId: property._id }
    });

    return ResponseHandler.success(res, property, 'Property rejected');
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

// DELETE /api/admin/properties/:id  — hard delete
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return ResponseHandler.error(res, 'Property not found', 404);
    return ResponseHandler.success(res, { message: 'Property deleted permanently' });
  } catch (err) {
    return ResponseHandler.error(res, err.message, 400);
  }
});

module.exports = router;
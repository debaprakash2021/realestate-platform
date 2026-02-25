// This file REPLACES Propertyservice.js (capital P)
// On Linux, require('../services/propertyService') will fail if file is named Propertyservice.js
// Rename the file from Propertyservice.js → propertyService.js

const Property = require('../models/Property');

class PropertyService {

  // ─── Create Property ────────────────────────────────────────────
  static async createProperty(hostId, data) {
    const property = await Property.create({ ...data, host: hostId });
    return property;
  }

  // ─── Get All Properties (with filters) ──────────────────────────
  static async getAllProperties(query) {
    const {
      city, country, propertyType, roomType,
      minPrice, maxPrice,
      bedrooms, bathrooms, maxGuests,
      amenities,
      checkIn, checkOut,
      page = 1, limit = 12,
      sortBy = 'createdAt', order = 'desc'
    } = query;

    const filter = { status: 'active' };

    if (city)         filter['location.city']    = { $regex: city, $options: 'i' };
    if (country)      filter['location.country'] = { $regex: country, $options: 'i' };
    if (propertyType) filter.propertyType        = propertyType;
    if (roomType)     filter.roomType            = roomType;

    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    if (bedrooms)  filter['details.bedrooms']  = { $gte: Number(bedrooms) };
    if (bathrooms) filter['details.bathrooms'] = { $gte: Number(bathrooms) };
    if (maxGuests) filter['details.maxGuests'] = { $gte: Number(maxGuests) };

    if (amenities) {
      const amenityList = amenities.split(',');
      amenityList.forEach(amenity => {
        filter[`amenities.${amenity.trim()}`] = true;
      });
    }

    if (checkIn && checkOut) {
      filter.blockedDates = {
        $not: {
          $elemMatch: {
            startDate: { $lt: new Date(checkOut) },
            endDate:   { $gt: new Date(checkIn) }
          }
        }
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('host', 'name avatar hostInfo.isVerified')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments(filter)
    ]);

    return {
      properties,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  // ─── Get Property By ID ──────────────────────────────────────────
  static async getPropertyById(propertyId) {
    const property = await Property.findById(propertyId)
      .populate('host', 'name avatar phone hostInfo');
    if (!property) throw new Error('Property not found');
    return property;
  }

  // ─── Update Property ─────────────────────────────────────────────
  static async updateProperty(propertyId, hostId, data) {
    const property = await Property.findOne({ _id: propertyId, host: hostId });
    if (!property) throw new Error('Property not found or unauthorized');
    Object.assign(property, data);
    await property.save();
    return property;
  }

  // ─── Delete Property ─────────────────────────────────────────────
  static async deleteProperty(propertyId, hostId) {
    const property = await Property.findOne({ _id: propertyId, host: hostId });
    if (!property) throw new Error('Property not found or unauthorized');
    await property.deleteOne();
    return { message: 'Property deleted successfully' };
  }

  // ─── Get My Properties (host) ─────────────────────────────────────
  static async getMyProperties(hostId) {
    const properties = await Property.find({ host: hostId }).sort({ createdAt: -1 });
    return properties;
  }

  // ─── Get Nearby Properties ────────────────────────────────────────
  static async getNearbyProperties(lng, lat, maxDistance = 50000) {
    const properties = await Property.find({
      status: 'active',
      'location.coordinates': {
        $near: {
          $geometry:    { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance)
        }
      }
    }).limit(20);
    return properties;
  }

  // ─── Check Availability ───────────────────────────────────────────
  static async checkAvailability(propertyId, checkIn, checkOut) {
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const isBlocked = property.blockedDates.some(d =>
      new Date(checkIn) < new Date(d.endDate) &&
      new Date(checkOut) > new Date(d.startDate)
    );

    return { available: !isBlocked, propertyId };
  }
}

module.exports = PropertyService;
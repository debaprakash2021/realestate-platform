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

    // Location filters
    if (city)        filter['location.city']    = { $regex: city, $options: 'i' };
    if (country)     filter['location.country'] = { $regex: country, $options: 'i' };

    // Type filters
    if (propertyType) filter.propertyType = propertyType;
    if (roomType)     filter.roomType     = roomType;

    // Price range
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    // Guests & rooms
    if (bedrooms)  filter['details.bedrooms']  = { $gte: Number(bedrooms) };
    if (bathrooms) filter['details.bathrooms'] = { $gte: Number(bathrooms) };
    if (maxGuests) filter['details.maxGuests'] = { $gte: Number(maxGuests) };

    // Amenities filter (e.g. amenities=wifi,pool,kitchen)
    if (amenities) {
      const amenityList = amenities.split(',');
      amenityList.forEach(amenity => {
        filter[`amenities.${amenity.trim()}`] = true;
      });
    }

    // Availability filter
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
        .populate('host', 'name avatar')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Property.countDocuments(filter)
    ]);

    return {
      properties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  // ─── Get Single Property ────────────────────────────────────────
  static async getPropertyById(id) {
    const property = await Property.findById(id)
      .populate('host', 'name avatar email createdAt');

    if (!property) throw new Error('Property not found');

    // Increment view count
    await Property.findByIdAndUpdate(id, { $inc: { 'stats.viewCount': 1 } });

    return property;
  }

  // ─── Update Property ────────────────────────────────────────────
  static async updateProperty(id, hostId, data) {
    const property = await Property.findOne({ _id: id, host: hostId });
    if (!property) throw new Error('Property not found or unauthorized');

    const updated = await Property.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true
    });
    return updated;
  }

  // ─── Delete Property ────────────────────────────────────────────
  static async deleteProperty(id, hostId) {
    const property = await Property.findOne({ _id: id, host: hostId });
    if (!property) throw new Error('Property not found or unauthorized');

    await Property.findByIdAndDelete(id);
    return { message: 'Property deleted successfully' };
  }

  // ─── Geospatial Search ──────────────────────────────────────────
  static async findNearby(longitude, latitude, radius = 10000) {
    const properties = await Property.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      parseInt(radius)
    ).populate('host', 'name avatar').lean();

    return properties;
  }

  // ─── Get Host Properties ────────────────────────────────────────
  static async getHostProperties(hostId) {
    const properties = await Property.find({ host: hostId })
      .sort({ createdAt: -1 });
    return properties;
  }

  // ─── Check Availability ─────────────────────────────────────────
  static async checkAvailability(id, checkIn, checkOut) {
    const property = await Property.findById(id);
    if (!property) throw new Error('Property not found');

    const available = property.isAvailable(checkIn, checkOut);
    return { available, propertyId: id, checkIn, checkOut };
  }

  // ─── Toggle Featured ────────────────────────────────────────────
  static async toggleFeatured(id) {
    const property = await Property.findById(id);
    if (!property) throw new Error('Property not found');

    property.isFeatured = !property.isFeatured;
    await property.save();
    return property;
  }
}

module.exports = PropertyService;
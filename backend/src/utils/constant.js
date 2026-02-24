// ─── User Roles ───────────────────────────────────────────────────
const USER_ROLES = {
  GUEST: 'guest',
  HOST:  'host',
  ADMIN: 'admin'
};

// ─── Property ─────────────────────────────────────────────────────
const PROPERTY_TYPES = {
  APARTMENT:   'apartment',
  HOUSE:       'house',
  VILLA:       'villa',
  CONDO:       'condo',
  STUDIO:      'studio',
  CABIN:       'cabin',
  COTTAGE:     'cottage',
  FARMHOUSE:   'farmhouse',
  LOFT:        'loft',
  OTHER:       'other'
};

const ROOM_TYPES = {
  ENTIRE_PLACE:  'entire_place',
  PRIVATE_ROOM:  'private_room',
  SHARED_ROOM:   'shared_room'
};

const PROPERTY_STATUS = {
  ACTIVE:    'active',
  INACTIVE:  'inactive',
  PENDING:   'pending',
  SUSPENDED: 'suspended'
};

// ─── Booking ───────────────────────────────────────────────────────
const BOOKING_STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REJECTED:  'rejected'
};

// ─── Cancellation Policy ──────────────────────────────────────────
const CANCELLATION_POLICIES = {
  FLEXIBLE: 'flexible',   // Full refund 1 day prior
  MODERATE: 'moderate',   // Full refund 5 days prior
  STRICT:   'strict'      // 50% refund up to 1 week prior
};

// ─── Payment ──────────────────────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING:   'pending',
  HELD:      'held',      // Escrow - held until check-in
  RELEASED:  'released',  // Released to host after check-in
  REFUNDED:  'refunded',
  FAILED:    'failed'
};

// ─── Review ───────────────────────────────────────────────────────
const REVIEW_CATEGORIES = [
  'cleanliness',
  'accuracy',
  'communication',
  'location',
  'checkIn',
  'value'
];

// ─── Currencies ───────────────────────────────────────────────────
const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  INR: 'INR',
  AUD: 'AUD',
  CAD: 'CAD'
};

// ─── JWT ──────────────────────────────────────────────────────────
const JWT_CONFIG = {
  EXPIRE:         '7d',
  REFRESH_EXPIRE: '30d',
  COOKIE_EXPIRE:  7
};

// ─── Pagination Defaults ──────────────────────────────────────────
const PAGINATION = {
  DEFAULT_PAGE:  1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT:     50
};

module.exports = {
  USER_ROLES,
  PROPERTY_TYPES,
  ROOM_TYPES,
  PROPERTY_STATUS,
  BOOKING_STATUS,
  CANCELLATION_POLICIES,
  PAYMENT_STATUS,
  REVIEW_CATEGORIES,
  CURRENCIES,
  JWT_CONFIG,
  PAGINATION
};
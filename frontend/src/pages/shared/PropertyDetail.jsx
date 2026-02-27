import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, MapPin, Users, Bed, Bath, Wifi, Car, Wind, Flame, Tv, Utensils, ArrowLeft, Heart, MessageCircle } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', adults: 1, children: 0 })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  // ─── Live price calculation ──────────────────────────────────────
  const priceCalc = useMemo(() => {
    if (!booking.checkIn || !booking.checkOut || !property) return null
    const msPerDay = 1000 * 60 * 60 * 24
    const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / msPerDay)
    if (nights <= 0) return null

    const p = property.pricing
    const basePrice = p?.basePrice || 0
    const subtotal = basePrice * nights

    let weeklyDiscount = 0
    let monthlyDiscount = 0
    if (nights >= 30 && p?.monthlyDiscount > 0)
      monthlyDiscount = Math.round(subtotal * (p.monthlyDiscount / 100))
    else if (nights >= 7 && p?.weeklyDiscount > 0)
      weeklyDiscount = Math.round(subtotal * (p.weeklyDiscount / 100))

    const cleaningFee = p?.cleaningFee || 0
    const serviceFee = p?.serviceFee || 0
    const total = subtotal - weeklyDiscount - monthlyDiscount + cleaningFee + serviceFee

    return { nights, basePrice, subtotal, weeklyDiscount, monthlyDiscount, cleaningFee, serviceFee, total }
  }, [booking.checkIn, booking.checkOut, property])

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, revRes] = await Promise.all([
          api.get(`/properties/${id}`),
          api.get(`/reviews/property/${id}`)
        ])
        setProperty(propRes.data.data)
        setReviews(revRes.data.data?.reviews || [])
      } catch { toast.error('Property not found') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please login to book'); navigate('/login'); return }
    setBookingLoading(true)
    try {
      const res = await api.post('/bookings', {
        propertyId: id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: { adults: booking.adults, children: booking.children, infants: 0 }
      })
      toast.success('Booking created! Redirecting to payment... 🎉')
      navigate(`/payment/${res.data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  const handleMessage = async () => {
    if (!user) { toast.error('Please login to message host'); navigate('/login'); return }
    try {
      await api.post('/messages/conversation', { propertyId: id })
      toast.success('Conversation started!')
      navigate('/messages')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation')
    }
  }

  const amenityIcons = {
    wifi: <Wifi size={16} />, freeParking: <Car size={16} />, airConditioning: <Wind size={16} />,
    heating: <Flame size={16} />, tv: <Tv size={16} />, kitchen: <Utensils size={16} />
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="bg-gray-200 rounded-2xl h-80 mb-6" />
      <div className="bg-gray-200 h-8 w-2/3 rounded mb-4" />
      <div className="bg-gray-200 h-4 w-1/2 rounded" />
    </div>
  )

  if (!property) return <div className="text-center py-20 text-gray-500">Property not found</div>

  const images = property.images?.length ? property.images : [{ url: 'https://placehold.co/800x500?text=No+Image' }]

  // FIX #9: Compare IDs as strings. user.id is a string from JWT payload,
  // but property.host._id is a MongoDB ObjectId. Direct !== comparison would
  // always be true (different types), so the "Message Host" button would never
  // hide for the host viewing their own property.
  const isOwnProperty = user && property.host?._id &&
    (user.id?.toString() === property.host._id.toString() ||
      user._id?.toString() === property.host._id.toString())

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
        {property.ratings?.average > 0 && (
          <span className="flex items-center gap-1"><Star size={14} className="fill-gray-900 text-gray-900" /> {property.ratings.average} ({property.ratings.count} reviews)</span>
        )}
        <span className="flex items-center gap-1"><MapPin size={14} /> {property.location?.city}, {property.location?.state}, {property.location?.country}</span>
      </div>

      {/* Images */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gray-100">
        <img src={images[imgIdx]?.url} alt={property.title} className="w-full h-80 sm:h-96 object-cover" onError={e => e.target.src = 'https://placehold.co/800x500?text=No+Image'} />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl text-sm">
            <span className="flex items-center gap-1.5 text-gray-700"><Users size={16} className="text-rose-500" /> {property.details?.maxGuests} guests</span>
            <span className="flex items-center gap-1.5 text-gray-700"><Bed size={16} className="text-rose-500" /> {property.details?.bedrooms} bedrooms</span>
            <span className="flex items-center gap-1.5 text-gray-700"><Bath size={16} className="text-rose-500" /> {property.details?.bathrooms} bathrooms</span>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About this place</h2>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(property.amenities || {}).filter(([, v]) => v).map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-rose-500">{amenityIcons[key] || '✓'}</span>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </div>
              ))}
            </div>
          </div>

          {/* Host */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <img src={property.host?.avatar?.url || 'https://via.placeholder.com/50'} alt={property.host?.name}
              className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-sm">{property.host?.name}</p>
              <p className="text-xs text-gray-500">Host</p>
            </div>
            {/* FIX #9 applied: only show "Message Host" when logged in and not the property owner */}
            {user && !isOwnProperty && (
              <button onClick={handleMessage} className="ml-auto flex items-center gap-2 btn-secondary text-sm">
                <MessageCircle size={16} /> Message Host
              </button>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                <Star size={18} className="inline fill-gray-900 text-gray-900 mr-1" />
                {property.ratings?.average} · {reviews.length} reviews
              </h2>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={r.guest?.avatar?.url || 'https://via.placeholder.com/40'} alt={r.guest?.name}
                        className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium">{r.guest?.name}</p>
                        <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-sm">
                        <Star size={13} className="fill-gray-900 text-gray-900" /> {r.ratings?.overall}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                    {r.hostResponse?.comment && (
                      <div className="mt-3 pl-3 border-l-2 border-rose-200 bg-rose-50 rounded-r-lg py-2 pr-2">
                        <p className="text-xs font-medium text-rose-600 mb-1">Host response:</p>
                        <p className="text-xs text-gray-600">{r.hostResponse.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Booking Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="mb-4">
              <span className="text-2xl font-bold text-gray-900">₹{property.pricing?.basePrice?.toLocaleString()}</span>
              <span className="text-gray-500 text-sm"> /night</span>
            </div>

            {/* Hide booking form if user is the host */}
            {isOwnProperty ? (
              <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-xl">
                This is your property
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
                    <input type="date" required min={new Date().toISOString().split('T')[0]} className="input-field text-sm"
                      value={booking.checkIn} onChange={e => setBooking({ ...booking, checkIn: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
                    <input type="date" required min={booking.checkIn || new Date().toISOString().split('T')[0]} className="input-field text-sm"
                      value={booking.checkOut} onChange={e => setBooking({ ...booking, checkOut: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">Adults</label>
                      <input type="number" min="1" max={property.details?.maxGuests} className="input-field text-sm"
                        value={booking.adults} onChange={e => setBooking({ ...booking, adults: Number(e.target.value) })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">Children</label>
                      <input type="number" min="0" className="input-field text-sm"
                        value={booking.children} onChange={e => setBooking({ ...booking, children: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={bookingLoading} className="btn-primary w-full py-3">
                  {bookingLoading ? 'Booking...' : 'Reserve'}
                </button>
              </form>
            )}

            {!isOwnProperty && priceCalc && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>₹{priceCalc.basePrice.toLocaleString()} × {priceCalc.nights} night{priceCalc.nights > 1 ? 's' : ''}</span>
                  <span>₹{priceCalc.subtotal.toLocaleString()}</span>
                </div>
                {priceCalc.weeklyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Weekly discount</span>
                    <span>−₹{priceCalc.weeklyDiscount.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.monthlyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Monthly discount</span>
                    <span>−₹{priceCalc.monthlyDiscount.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.cleaningFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Cleaning fee</span>
                    <span>₹{priceCalc.cleaningFee.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.serviceFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Service fee</span>
                    <span>₹{priceCalc.serviceFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{priceCalc.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-3">You won't be charged yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}
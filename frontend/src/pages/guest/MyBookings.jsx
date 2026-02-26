import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ReviewForm from '../../components/common/ReviewForm'

const STATUS_STYLES = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={14} /> },
  confirmed: { cls: 'bg-blue-100 text-blue-700',      icon: <CheckCircle size={14} /> },
  completed: { cls: 'bg-green-100 text-green-700',    icon: <CheckCircle size={14} /> },
  cancelled: { cls: 'bg-red-100 text-red-700',        icon: <XCircle size={14} /> },
  rejected:  { cls: 'bg-gray-100 text-gray-700',      icon: <AlertCircle size={14} /> }
}

export default function MyBookings() {
  const [bookings, setBookings]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [reviewBooking, setReviewBooking] = useState(null)

  useEffect(() => {
    // FIX #11: The Booking model has a `hasReview` boolean field that is set to true
    // by reviewService when a review is submitted. We must use this server value as the
    // authoritative source — not local optimistic state alone. Without this, after
    // logout/login the "Leave Review" button reappears for already-reviewed bookings
    // because the local state resets. The field is now seeded directly from the API.
    api.get('/bookings/my-bookings')
      .then(r => setBookings(r.data.data?.bookings || r.data.data || []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.put(`/bookings/${id}/cancel`)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed')
    }
  }

  const handleReviewSubmitted = (bookingId) => {
    // Update local state immediately so UI is responsive
    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, hasReview: true } : b))
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-36" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings yet</h3>
          <p className="text-gray-400 mb-6">Start exploring properties to make your first booking</p>
          <Link to="/" className="btn-primary">Explore Properties</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => {
            const status = STATUS_STYLES[b.status] || STATUS_STYLES.pending
            const image  = b.property?.images?.[0]?.url || b.property?.primaryImage || 'https://placehold.co/200x150?text=No+Image'
            return (
              <div key={b._id} className="card flex flex-col sm:flex-row overflow-hidden">
                <img
                  src={image}
                  alt={b.property?.title}
                  className="w-full sm:w-40 h-40 sm:h-auto object-cover"
                  onError={e => e.target.src = 'https://placehold.co/200x150?text=No+Image'}
                />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link to={`/property/${b.property?._id}`} className="font-semibold text-gray-900 hover:text-rose-500 transition-colors">
                        {b.property?.title}
                      </Link>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${status.cls}`}>
                        {status.icon} {b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                      <MapPin size={13} /> {b.property?.location?.city}, {b.property?.location?.state}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={13} />
                      {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                      <span className="ml-1 text-gray-400">({b.nights} nights)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold text-gray-900">₹{b.pricing?.totalAmount?.toLocaleString()}</span>
                    <div className="flex items-center gap-3">
                      {(b.status === 'pending' || b.status === 'confirmed') && (
                        <button onClick={() => handleCancel(b._id)} className="text-sm text-red-500 hover:text-red-700 font-medium">
                          Cancel
                        </button>
                      )}
                      {/* hasReview comes from DB — persists across login/logout */}
                      {b.status === 'completed' && !b.hasReview && (
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="flex items-center gap-1.5 text-sm text-rose-500 font-medium hover:text-rose-700 transition-colors"
                        >
                          <Star size={14} /> Leave Review
                        </button>
                      )}
                      {b.status === 'completed' && b.hasReview && (
                        <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                          <CheckCircle size={14} /> Reviewed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Inline Review Modal */}
      {reviewBooking && (
        <ReviewForm
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => handleReviewSubmitted(reviewBooking._id)}
        />
      )}
    </div>
  )
}
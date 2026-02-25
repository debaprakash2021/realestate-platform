import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, CreditCard, Heart, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Star, TrendingUp } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending:        { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={13} /> },
  confirmed:      { cls: 'bg-blue-100 text-blue-700',    icon: <CheckCircle size={13} /> },
  completed:      { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle size={13} /> },
  cancelled:      { cls: 'bg-red-100 text-red-700',      icon: <XCircle size={13} /> },
  rejected:       { cls: 'bg-gray-100 text-gray-600',    icon: <AlertCircle size={13} /> }
}

const PAYMENT_STYLES = {
  pending:        'bg-yellow-100 text-yellow-700',
  paid:           'bg-green-100 text-green-700',
  pay_on_arrival: 'bg-orange-100 text-orange-700',
  refunded:       'bg-red-100 text-red-700',
  held:           'bg-blue-100 text-blue-700'
}

export default function GuestDashboard() {
  const { user }            = useAuth()
  const navigate            = useNavigate()
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [bkRes, pmRes] = await Promise.all([
          api.get('/bookings/my-bookings?limit=5'),
          api.get('/payments/my-payments')
        ])
        setBookings(bkRes.data.data?.bookings || [])
        setPayments(pmRes.data.data || [])
      } catch { toast.error('Failed to load dashboard') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  // Stats
  const totalSpent    = payments.filter(p => ['held','released','pay_on_arrival'].includes(p.status)).reduce((s, p) => s + p.amount.total, 0)
  const totalBookings = bookings.length
  const upcoming      = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) > new Date()).length
  const completed     = bookings.filter(b => b.status === 'completed').length

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's a summary of your stays and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Calendar size={20} />, label: 'Total Bookings',  value: totalBookings, color: 'blue' },
          { icon: <CheckCircle size={20} />, label: 'Upcoming Stays', value: upcoming,   color: 'green' },
          { icon: <Star size={20} />, label: 'Completed Stays',       value: completed,   color: 'yellow' },
          { icon: <CreditCard size={20} />, label: 'Total Spent',     value: `₹${totalSpent.toLocaleString()}`, color: 'rose' }
        ].map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`w-9 h-9 bg-${s.color}-100 rounded-xl flex items-center justify-center mb-3`}>
              <span className={`text-${s.color}-500`}>{s.icon}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Bookings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={17} className="text-rose-500" /> Recent Bookings
            </h2>
            <Link to="/my-bookings" className="text-xs text-rose-500 hover:underline">View all →</Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No bookings yet</p>
              <Link to="/" className="btn-primary text-sm mt-3 inline-block">Explore Properties</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 4).map(b => {
                const st    = STATUS_STYLES[b.status] || STATUS_STYLES.pending
                const image = b.property?.images?.[0]?.url || b.property?.primaryImage || 'https://placehold.co/50x50?text=🏠'
                const needsPayment = b.status === 'confirmed' && b.payment?.status === 'pending'
                return (
                  <div key={b._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0"
                      onError={e => e.target.src = 'https://placehold.co/50x50?text=🏠'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.property?.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {b.property?.location?.city}
                        <span className="ml-1">· {new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                        {st.icon} {b.status}
                      </span>
                      {needsPayment && (
                        <button onClick={() => navigate(`/payment/${b._id}`)}
                          className="mt-1.5 text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full hover:bg-rose-600">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={17} className="text-rose-500" /> Payment History
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {p.booking?.checkIn ? (
                        `${new Date(p.booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      ) : 'Booking'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 capitalize">
                      {p.method?.replace('_', ' ')} · {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-gray-900">₹{p.amount.total.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status === 'pay_on_arrival' ? 'On Arrival' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '🏠', label: 'Explore',    to: '/' },
          { icon: '📅', label: 'Bookings',   to: '/my-bookings' },
          { icon: '❤️', label: 'Favorites',  to: '/favorites' },
          { icon: '💬', label: 'Messages',   to: '/messages' }
        ].map(a => (
          <Link key={a.to} to={a.to}
            className="card p-4 text-center hover:border-rose-200 hover:bg-rose-50/50 transition-colors border border-transparent">
            <p className="text-2xl mb-1">{a.icon}</p>
            <p className="text-sm font-medium text-gray-700">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
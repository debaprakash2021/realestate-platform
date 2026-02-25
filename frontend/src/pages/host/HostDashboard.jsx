import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Home, Calendar, Star, DollarSign, TrendingUp, PlusSquare, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
  confirmed: { cls: 'bg-blue-100 text-blue-700',     icon: <CheckCircle size={12} /> },
  completed: { cls: 'bg-green-100 text-green-700',   icon: <CheckCircle size={12} /> },
  cancelled: { cls: 'bg-red-100 text-red-700',       icon: <XCircle size={12} /> },
  rejected:  { cls: 'bg-gray-100 text-gray-600',     icon: <AlertCircle size={12} /> }
}

const PAYMENT_LABELS = {
  pending:        { cls: 'bg-yellow-100 text-yellow-700', label: 'Unpaid' },
  paid:           { cls: 'bg-green-100 text-green-700',   label: '✅ Paid Online' },
  held:           { cls: 'bg-blue-100 text-blue-700',     label: '💰 In Escrow' },
  pay_on_arrival: { cls: 'bg-orange-100 text-orange-700', label: '🏠 Pay on Arrival' },
  released:       { cls: 'bg-green-100 text-green-700',   label: '✅ Released' },
  refunded:       { cls: 'bg-red-100 text-red-700',       label: '↩ Refunded' }
}

const StatCard = ({ icon, label, value, sub, color = 'rose' }) => (
  <div className="card p-5">
    <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
      <span className={`text-${color}-500`}>{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
)

export default function HostDashboard() {
  const [overview,      setOverview]      = useState(null)
  const [revenue,       setRevenue]       = useState(null)
  const [analyticsBook, setAnalyticsBook] = useState(null)
  const [properties,    setProperties]    = useState([])
  const [recentBookings,setRecentBookings]= useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, revRes, bkRes, prRes, hostBkRes] = await Promise.all([
          api.get('/analytics/host/dashboard'),
          api.get('/analytics/host/revenue'),
          api.get('/analytics/host/bookings'),
          api.get('/analytics/host/properties'),
          api.get('/bookings/host-bookings?limit=10')
        ])
        setOverview(ovRes.data.data?.overview)
        setRevenue(revRes.data.data)
        setAnalyticsBook(bkRes.data.data)
        setProperties(prRes.data.data || [])
        setRecentBookings(hostBkRes.data.data?.bookings || [])
      } catch { toast.error('Failed to load dashboard') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28" />)}
      </div>
    </div>
  )

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 size={24} className="text-rose-500" /> Host Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your properties, bookings & earnings</p>
        </div>
        <Link to="/host/properties/new" className="btn-primary flex items-center gap-2 text-sm">
          <PlusSquare size={16} /> List Property
        </Link>
      </div>

      {/* Stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Home size={20} />}       label="Properties"    value={overview.totalProperties} sub={`${overview.activeProperties} active`} />
          <StatCard icon={<Calendar size={20} />}   label="Bookings"      value={overview.totalBookings}   sub={`${overview.activeBookings} active`}   color="blue" />
          <StatCard icon={<Star size={20} />}       label="Avg Rating"    value={overview.avgRating || '—'} sub={`${overview.totalReviews} reviews`}   color="yellow" />
          <StatCard icon={<DollarSign size={20} />} label="Revenue"       value={`₹${(overview.totalRevenue||0).toLocaleString()}`} sub={`₹${(overview.pendingPayout||0).toLocaleString()} pending`} color="green" />
        </div>
      )}

      {/* Recent Bookings — with full guest + payment details */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base flex items-center gap-2"><Calendar size={17} className="text-rose-500" /> Recent Bookings</h2>
          <Link to="/host/bookings" className="text-sm text-rose-500 hover:underline">View all →</Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-400">No bookings yet — list your first property!</p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map(b => {
              const st  = STATUS_STYLES[b.status]           || STATUS_STYLES.pending
              const pm  = PAYMENT_LABELS[b.payment?.status] || PAYMENT_LABELS.pending
              const img = b.property?.images?.[0]?.url      || 'https://placehold.co/56x56?text=🏠'
              return (
                <div key={b._id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">

                    {/* Property */}
                    <div className="flex gap-3 min-w-0 flex-1">
                      <img src={img} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0"
                        onError={e => e.target.src = 'https://placehold.co/56x56?text=🏠'} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{b.property?.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} /> {b.property?.location?.city}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Guest */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Guest</p>
                      <div className="flex items-center gap-2">
                        <img src={b.guest?.avatar?.url || 'https://via.placeholder.com/28'} alt=""
                          className="w-7 h-7 rounded-full shrink-0 object-cover" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{b.guest?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{b.guest?.email}</p>
                          {b.guest?.phone && <p className="text-xs text-gray-400">📞 {b.guest.phone}</p>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{b.guests?.total} guest{b.guests?.total > 1 ? 's' : ''}</p>
                    </div>

                    {/* Status + Payment + Amount */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
                        {st.icon} {b.status}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pm.cls}`}>
                        {pm.label}
                      </span>
                      <p className="text-sm font-bold text-gray-900">₹{b.pricing?.totalAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {analyticsBook && (
          <div className="card p-6">
            <h2 className="font-semibold text-sm mb-5 flex items-center gap-2"><Calendar size={17} className="text-rose-500" /> Booking Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(analyticsBook.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 capitalize">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: analyticsBook.total ? `${(count / analyticsBook.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Avg stay: {analyticsBook.avgNights} nights</p>
          </div>
        )}

        {revenue && (
          <div className="card p-6">
            <h2 className="font-semibold text-sm mb-5 flex items-center gap-2"><TrendingUp size={17} className="text-rose-500" /> Revenue (Last 6 Months)</h2>
            {revenue.revenueData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No revenue data yet</p>
            ) : revenue.revenueData.map(d => (
              <div key={d.month} className="flex items-center gap-3 mb-3">
                <span className="text-sm text-gray-600 w-20">{d.month}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: revenue.totalRevenue ? `${(d.revenue / revenue.totalRevenue) * 100}%` : '0%' }} />
                </div>
                <span className="text-sm font-medium">₹{d.revenue.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold">₹{revenue.totalRevenue?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Property Performance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Home size={17} className="text-rose-500" /> Property Performance</h2>
          <Link to="/host/properties" className="text-sm text-rose-500 hover:underline">Manage →</Link>
        </div>
        {properties.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm mb-4">No properties listed yet</p>
            <Link to="/host/properties/new" className="btn-primary text-sm">List your first property</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-3 font-medium">Property</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-center">Bookings</th>
                  <th className="pb-3 font-medium text-center">Rating</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {properties.map(p => (
                  <tr key={p.propertyId} className="hover:bg-gray-50">
                    <td className="py-3 font-medium max-w-[200px] truncate">{p.title}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                    </td>
                    <td className="py-3 text-center text-gray-600">{p.bookingCount}</td>
                    <td className="py-3 text-center text-gray-600">{p.rating > 0 ? `⭐ ${p.rating}` : '—'}</td>
                    <td className="py-3 text-right font-medium">₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
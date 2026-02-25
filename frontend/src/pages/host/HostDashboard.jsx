import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, Home, Calendar, Star, DollarSign, TrendingUp, Clock, PlusSquare } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

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
  const [overview, setOverview]     = useState(null)
  const [revenue, setRevenue]       = useState(null)
  const [bookings, setBookings]     = useState(null)
  const [properties, setProperties] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, revRes, bkRes, prRes] = await Promise.all([
          api.get('/analytics/host/dashboard'),
          api.get('/analytics/host/revenue'),
          api.get('/analytics/host/bookings'),
          api.get('/analytics/host/properties')
        ])
        setOverview(ovRes.data.data?.overview)
        setRevenue(revRes.data.data)
        setBookings(bkRes.data.data)
        setProperties(prRes.data.data || [])
      } catch { toast.error('Failed to load dashboard') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="animate-pulse grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(8)].map((_, i) => <div key={i} className="card h-28" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 size={24} className="text-rose-500" /> Host Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Your properties and earnings overview</p>
        </div>
        <Link to="/host/properties/new" className="btn-primary flex items-center gap-2">
          <PlusSquare size={16} /> List Property
        </Link>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Home size={20} />}     label="Properties"        value={overview.totalProperties}  sub={`${overview.activeProperties} active`} />
          <StatCard icon={<Calendar size={20} />} label="Total Bookings"    value={overview.totalBookings}    sub={`${overview.activeBookings} active`} color="blue" />
          <StatCard icon={<Star size={20} />}     label="Avg Rating"        value={overview.avgRating || '—'} sub={`${overview.totalReviews} reviews`} color="yellow" />
          <StatCard icon={<DollarSign size={20} />} label="Total Revenue"   value={`₹${(overview.totalRevenue || 0).toLocaleString()}`} sub={`₹${(overview.pendingPayout || 0).toLocaleString()} pending`} color="green" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Booking Stats */}
        {bookings && (
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><Calendar size={18} className="text-rose-500" /> Booking Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(bookings.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 capitalize">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: bookings.total ? `${(count / bookings.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Avg stay: {bookings.avgNights} nights</p>
          </div>
        )}

        {/* Revenue Stats */}
        {revenue && (
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><TrendingUp size={18} className="text-rose-500" /> Revenue (Last 6 Months)</h2>
            {revenue.revenueData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No revenue data yet</p>
            ) : (
              <div className="space-y-3">
                {revenue.revenueData.map(d => (
                  <div key={d.month} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">{d.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: revenue.totalRevenue ? `${(d.revenue / revenue.totalRevenue) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-sm font-medium">₹{d.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">₹{revenue.totalRevenue?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Property Performance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold flex items-center gap-2"><Home size={18} className="text-rose-500" /> Property Performance</h2>
          <Link to="/host/properties" className="text-sm text-rose-500 hover:underline">View all →</Link>
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
                    <td className="py-3 font-medium text-gray-900 max-w-[200px] truncate">{p.title}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
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
import { useState, useEffect } from 'react'
import { Search, Users, Home, Calendar, DollarSign, TrendingUp, MapPin, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected:  'bg-gray-100 text-gray-600'
}

const PAYMENT_LABELS = {
  pending:        { cls: 'bg-yellow-100 text-yellow-700', label: 'Unpaid' },
  paid:           { cls: 'bg-green-100 text-green-700',   label: '✅ Paid' },
  held:           { cls: 'bg-blue-100 text-blue-700',     label: '💰 Held' },
  pay_on_arrival: { cls: 'bg-orange-100 text-orange-700', label: '🏠 On Arrival' },
  released:       { cls: 'bg-green-100 text-green-700',   label: '✅ Released' },
  refunded:       { cls: 'bg-red-100 text-red-700',       label: '↩ Refunded' }
}

const StatCard = ({ icon, label, value, color = 'rose' }) => (
  <div className="card p-5">
    <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
      <span className={`text-${color}-500`}>{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-0.5">{label}</p>
  </div>
)

export default function AdminDashboard() {
  const [stats,    setStats]    = useState(null)
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [loading,  setLoading]  = useState(true)

  // Search state
  const [searchType,  setSearchType]  = useState('bookingId')
  const [searchValue, setSearchValue] = useState('')
  const [searching,   setSearching]   = useState(false)
  const [searchResults, setSearchResults] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, bkRes, pmRes] = await Promise.all([
          api.get('/analytics/admin/platform'),
          api.get('/bookings?limit=10'),
          api.get('/payments/admin/all?limit=10')
        ])
        setStats(statsRes.data.data)
        setBookings(bkRes.data.data?.bookings || [])
        setPayments(pmRes.data.data?.payments || [])
      } catch { toast.error('Failed to load admin dashboard') }
      finally  { setLoading(false) }
    }
    load()
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchValue.trim()) return
    setSearching(true)
    setSearchResults(null)
    try {
      let query = ''
      if (searchType === 'bookingId') query = `bookingId=${searchValue.trim()}`
      if (searchType === 'guestId')   query = `guestId=${searchValue.trim()}`
      if (searchType === 'hostId')    query = `hostId=${searchValue.trim()}`

      const res = await api.get(`/bookings?${query}&limit=20`)
      setSearchResults(res.data.data?.bookings || [])
      if ((res.data.data?.bookings || []).length === 0) toast('No results found')
    } catch (err) {
      toast.error('Search failed')
    } finally { setSearching(false) }
  }

  const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const BookingRow = ({ b }) => {
    const pm  = PAYMENT_LABELS[b.payment?.status] || PAYMENT_LABELS.pending
    const img = b.property?.images?.[0]?.url || 'https://placehold.co/48x48?text=🏠'
    return (
      <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Property */}
          <div className="flex gap-3 min-w-0 flex-1">
            <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0"
              onError={e => e.target.src='https://placehold.co/48x48?text=🏠'} />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{b.property?.title}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {b.property?.location?.city}
              </p>
              <p className="text-xs text-gray-500">{fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights}n</p>
              <p className="text-xs text-gray-300 font-mono mt-0.5">ID: {b._id}</p>
            </div>
          </div>

          {/* Guest + Host */}
          <div className="flex gap-4 flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Guest</p>
              <p className="text-sm font-semibold truncate">{b.guest?.name}</p>
              <p className="text-xs text-gray-400 truncate">{b.guest?.email}</p>
              {b.guest?.phone && <p className="text-xs text-gray-400">📞 {b.guest.phone}</p>}
              <p className="text-xs text-gray-300 font-mono">UID: {b.guest?._id}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Host</p>
              <p className="text-sm font-semibold truncate">{b.host?.name}</p>
              <p className="text-xs text-gray-400 truncate">{b.host?.email}</p>
              <p className="text-xs text-gray-300 font-mono">UID: {b.host?._id}</p>
            </div>
          </div>

          {/* Status + Payment */}
          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>
              {b.status}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pm.cls}`}>{pm.label}</span>
            <p className="text-sm font-bold">₹{b.pricing?.totalAmount?.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">🛡️ Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Full platform overview — users, bookings, payments</p>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users size={20} />}       label="Total Users"       value={stats.totalUsers}                           color="blue" />
          <StatCard icon={<Home size={20} />}        label="Properties"        value={stats.totalProperties}                      color="rose" />
          <StatCard icon={<Calendar size={20} />}    label="Total Bookings"    value={stats.totalBookings}                        color="green" />
          <StatCard icon={<DollarSign size={20} />}  label="Platform Revenue"  value={`₹${(stats.platformRevenue||0).toLocaleString()}`} color="yellow" />
        </div>
      )}

      {/* ─── Search ─────────────────────────────────────────────── */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><Search size={16} className="text-rose-500" /> Search Bookings</h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
              className="input-field pr-8 appearance-none text-sm w-full sm:w-44 bg-white"
            >
              <option value="bookingId">By Booking ID</option>
              <option value="guestId">By Guest User ID</option>
              <option value="hostId">By Host User ID</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="text"
            placeholder={`Enter ${searchType === 'bookingId' ? 'Booking' : 'User'} ID...`}
            className="input-field flex-1 text-sm font-mono"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
          />
          <button type="submit" disabled={searching} className="btn-primary px-6 text-sm">
            {searching ? 'Searching...' : 'Search'}
          </button>
          {searchResults !== null && (
            <button type="button" onClick={() => { setSearchResults(null); setSearchValue('') }}
              className="btn-secondary text-sm">Clear</button>
          )}
        </form>

        {/* Search Results */}
        {searchResults !== null && (
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-3">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No bookings match your search</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map(b => <BookingRow key={b._id} b={b} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-sm flex items-center gap-2"><Calendar size={17} className="text-rose-500" /> All Recent Bookings</h2>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        {bookings.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No bookings yet</p>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => <BookingRow key={b._id} b={b} />)}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-sm flex items-center gap-2"><DollarSign size={17} className="text-rose-500" /> All Recent Payments</h2>
          <span className="text-xs text-gray-400">Last 10</span>
        </div>
        {payments.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No payments yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide text-left">
                  <th className="pb-3 font-medium">Guest</th>
                  <th className="pb-3 font-medium">Host</th>
                  <th className="pb-3 font-medium text-center">Method</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Platform Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => {
                  const pm = PAYMENT_LABELS[p.status] || PAYMENT_LABELS.pending
                  return (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium truncate max-w-[120px]">{p.guest?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.guest?.email}</p>
                      </td>
                      <td className="py-3">
                        <p className="font-medium truncate max-w-[120px]">{p.host?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.host?.email}</p>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-xs capitalize text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {p.method?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pm.cls}`}>{pm.label}</span>
                      </td>
                      <td className="py-3 text-right font-semibold">₹{p.amount?.total?.toLocaleString()}</td>
                      <td className="py-3 text-right text-green-600 font-medium">₹{p.amount?.platformFee?.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
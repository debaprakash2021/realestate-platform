import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, MapPin, Clock, CheckCircle, XCircle,
  AlertCircle, ChevronDown, Search, RefreshCw
} from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

// ─── Status config ────────────────────────────────────────────────
const STATUS = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',  icon: <Clock size={12} />,        label: 'Pending'   },
  confirmed: { cls: 'bg-blue-100 text-blue-700',      icon: <CheckCircle size={12} />,  label: 'Confirmed' },
  completed: { cls: 'bg-green-100 text-green-700',    icon: <CheckCircle size={12} />,  label: 'Completed' },
  cancelled: { cls: 'bg-red-100 text-red-700',        icon: <XCircle size={12} />,      label: 'Cancelled' },
  rejected:  { cls: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',      icon: <AlertCircle size={12} />,  label: 'Rejected'  },
}

const PAYMENT = {
  pending:        { cls: 'bg-yellow-100 text-yellow-700', label: '⏳ Unpaid'       },
  paid:           { cls: 'bg-green-100 text-green-700',   label: '✅ Paid Online'  },
  held:           { cls: 'bg-blue-100 text-blue-700',     label: '💰 In Escrow'   },
  pay_on_arrival: { cls: 'bg-orange-100 text-orange-700', label: '🏠 On Arrival'  },
  released:       { cls: 'bg-green-100 text-green-700',   label: '✅ Released'    },
  refunded:       { cls: 'bg-red-100 text-red-700',       label: '↩ Refunded'    },
}

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Single Booking Card ──────────────────────────────────────────
function BookingCard({ booking, onConfirm, onReject }) {
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [acting, setActing] = useState(false)

  const st  = STATUS[booking.status]  || STATUS.pending
  const pm  = PAYMENT[booking.payment?.status] || PAYMENT.pending
  const img = booking.property?.images?.[0]?.url || 'https://placehold.co/64x64?text=🏠'

  const handleConfirm = async () => {
    setActing(true)
    await onConfirm(booking._id)
    setActing(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please enter a reason'); return }
    setActing(true)
    await onReject(booking._id, rejectReason)
    setActing(false)
    setShowRejectForm(false)
  }

  const canAct = booking.status === 'confirmed' // host can confirm/reject confirmed (instant) bookings
                 || booking.status === 'pending'

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-4">

        {/* Property + Dates */}
        <div className="flex gap-3 flex-1 min-w-0">
          <img
            src={img} alt=""
            className="w-16 h-16 rounded-xl object-cover shrink-0"
            onError={e => e.target.src = 'https://placehold.co/64x64?text=🏠'}
          />
          <div className="min-w-0">
            <Link
              to={`/property/${booking.property?._id}`}
              className="font-semibold text-sm text-gray-900 dark:text-white hover:text-rose-500 truncate block"
            >
              {booking.property?.title}
            </Link>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={11} /> {booking.property?.location?.city}, {booking.property?.location?.state}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {fmt(booking.checkIn)} → {fmt(booking.checkOut)}
              <span className="ml-1 text-gray-400 dark:text-gray-500">· {booking.nights} night{booking.nights > 1 ? 's' : ''}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">ID: {booking._id}</p>
          </div>
        </div>

        {/* Guest Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-1.5">Guest</p>
          <div className="flex items-center gap-2">
            <img
              src={booking.guest?.avatar?.url || 'https://via.placeholder.com/32'}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{booking.guest?.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{booking.guest?.email}</p>
              {booking.guest?.phone && (
                <p className="text-xs text-gray-400 dark:text-gray-500">📞 {booking.guest.phone}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            👥 {booking.guests?.total} guest{booking.guests?.total > 1 ? 's' : ''}
            {booking.guests?.adults && ` (${booking.guests.adults} adult${booking.guests.adults > 1 ? 's' : ''}`}
            {booking.guests?.children > 0 && `, ${booking.guests.children} child${booking.guests.children > 1 ? 'ren' : ''}`}
            {booking.guests?.adults && ')'}
          </p>
          {booking.specialRequests && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 py-1">
              💬 "{booking.specialRequests}"
            </p>
          )}
        </div>

        {/* Status + Amount + Actions */}
        <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>
              {st.icon} {st.label}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pm.cls}`}>
              {pm.label}
            </span>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">₹{booking.pricing?.totalAmount?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{fmt(booking.createdAt)}</p>
        </div>
      </div>

      {/* Action Buttons — only for pending/confirmable bookings */}
      {canAct && booking.status !== 'cancelled' && booking.status !== 'rejected' && booking.status !== 'completed' && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          {!showRejectForm ? (
            <div className="flex gap-2 flex-wrap">
              {booking.status === 'pending' && (
                <button
                  onClick={handleConfirm}
                  disabled={acting}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  {acting ? 'Confirming...' : 'Confirm Booking'}
                </button>
              )}
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={acting}
                className="btn-secondary text-sm px-4 py-2 flex items-center gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
              >
                <XCircle size={15} />
                Reject
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500 self-center">
                {booking.status === 'confirmed'
                  ? 'This booking was auto-confirmed (instant booking). You can still reject it.'
                  : 'Confirm or reject this booking request.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Reason for rejection:</p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Property not available for those dates, or maintenance required..."
                className="input-field text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={acting}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {acting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function HostBookings() {
  const [bookings,  setBookings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const LIMIT = 10

  const fetchBookings = async (statusFilter = filter, p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, page: p })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await api.get(`/bookings/host-bookings?${params}`)
      setBookings(res.data.data?.bookings || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings(filter, page) }, [filter, page])

  const handleConfirm = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/confirm`)
      toast.success('Booking confirmed! Guest has been notified.')
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'confirmed' } : b
      ))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm booking')
    }
  }

  const handleReject = async (bookingId, reason) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`, { reason })
      toast.success('Booking rejected. Guest has been notified.')
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: 'rejected' } : b
      ))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject booking')
    }
  }

  // Client-side name search on top of server filter
  const displayed = search.trim()
    ? bookings.filter(b =>
        b.guest?.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.property?.title?.toLowerCase().includes(search.toLowerCase()) ||
        b._id?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  // Counts per status for tabs
  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1
    return acc
  }, {})

  const tabs = [
    { key: 'all',       label: 'All'       },
    { key: 'pending',   label: 'Pending'   },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'rejected',  label: 'Rejected'  },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} className="text-rose-500" /> Booking Requests
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} total booking{total !== 1 ? 's' : ''} across your properties
          </p>
        </div>
        <button
          onClick={() => fetchBookings(filter, page)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setFilter(t.key); setPage(1) }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === t.key
                ? 'bg-rose-500 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-rose-300'
            }`}
          >
            {t.label}
            {t.key !== 'all' && statusCounts[t.key] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                filter === t.key ? 'bg-white dark:bg-gray-900/20' : 'bg-gray-100 dark:bg-gray-700/50'
              }`}>
                {statusCounts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search by guest name, property, or booking ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-40" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {search ? 'No results match your search' : `No ${filter === 'all' ? '' : filter} bookings yet`}
          </h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {filter === 'pending'
              ? 'New booking requests will appear here'
              : 'Bookings will show up here once guests start booking your properties'}
          </p>
          {!search && (
            <Link to="/host/properties/new" className="btn-primary mt-4 inline-block text-sm">
              List a Property
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(b => (
            <BookingCard
              key={b._id}
              booking={b}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!search && total > LIMIT && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * LIMIT >= total}
              className="btn-secondary text-sm px-4 py-2 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
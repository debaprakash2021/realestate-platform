import { useState, useEffect } from 'react'
import { Building, Search, MapPin, Star, CheckCircle, XCircle, Trash2, RefreshCw, BadgeCheck, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  active: { cls: 'bg-green-100 text-green-700', label: 'Active' },
  inactive: { cls: 'bg-gray-100 text-gray-600', label: 'Inactive' },
  suspended: { cls: 'bg-red-100 text-red-700', label: 'Suspended' },
  pending: { cls: 'bg-amber-100 text-amber-700', label: '⏳ Pending Approval' },
  rejected: { cls: 'bg-red-100 text-red-600', label: '❌ Rejected' },
}

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

function PropertyRow({ property, onUpdate, onDelete }) {
  const [acting, setActing] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const st = STATUS_CONFIG[property.status] || STATUS_CONFIG.inactive

  const doApprove = async () => {
    setActing(true)
    try {
      await api.put(`/admin/properties/${property._id}/approve`)
      toast.success('✅ Property approved — now live!')
      onUpdate(property._id, { status: 'active' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    } finally { setActing(false) }
  }

  const doReject = async () => {
    setActing(true)
    try {
      await api.put(`/admin/properties/${property._id}/reject`, { reason: rejectReason })
      toast.success('Property rejected — host notified')
      onUpdate(property._id, { status: 'rejected' })
      setRejectModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    } finally { setActing(false) }
  }

  const doVerify = async () => {
    setActing(true)
    try {
      await api.put(`/admin/properties/${property._id}/verify`, { isVerified: !property.isVerified })
      toast.success(property.isVerified ? 'Verification removed' : 'Property verified ✅')
      onUpdate(property._id, { isVerified: !property.isVerified })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setActing(false) }
  }

  const doFeature = async () => {
    setActing(true)
    try {
      await api.put(`/admin/properties/${property._id}/feature`, { isFeatured: !property.isFeatured })
      toast.success(property.isFeatured ? 'Removed from featured' : 'Property featured ⭐')
      onUpdate(property._id, { isFeatured: !property.isFeatured })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setActing(false) }
  }

  const doStatus = async (status) => {
    setActing(true)
    try {
      await api.put(`/admin/properties/${property._id}/status`, { status })
      toast.success(`Status set to ${status}`)
      onUpdate(property._id, { status })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setActing(false) }
  }

  const doDelete = async () => {
    if (!confirm(`Permanently delete "${property.title}"? This cannot be undone.`)) return
    setActing(true)
    try {
      await api.delete(`/admin/properties/${property._id}`)
      toast.success('Property deleted')
      onDelete(property._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setActing(false) }
  }

  const img = property.images?.[0]?.url || 'https://placehold.co/56x56?text=🏠'

  return (
    <>
      <div className={`border rounded-xl p-4 transition-colors ${property.status === 'suspended' ? 'border-red-100 bg-red-50/20' :
        property.status === 'pending' ? 'border-amber-200 bg-amber-50/30' :
          property.status === 'rejected' ? 'border-red-100 bg-red-50/10' :
            'border-gray-100 hover:bg-gray-50'
        }`}>
        <div className="flex flex-col sm:flex-row gap-4">

          {/* Image + Title */}
          <div className="flex gap-3 flex-1 min-w-0">
            <img
              src={img} alt=""
              className="w-14 h-14 rounded-xl object-cover shrink-0"
              onError={e => e.target.src = 'https://placehold.co/56x56?text=🏠'}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm text-gray-900 truncate">{property.title}</p>
                {property.isVerified && (
                  <span title="Verified"><BadgeCheck size={14} className="text-blue-500 shrink-0" /></span>
                )}
                {property.isFeatured && (
                  <span title="Featured"><Sparkles size={14} className="text-yellow-500 shrink-0" /></span>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} /> {property.location?.city}, {property.location?.state}, {property.location?.country}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ₹{property.pricing?.basePrice?.toLocaleString()}/night
                {property.ratings?.average > 0 && (
                  <span className="ml-2">⭐ {property.ratings.average} ({property.ratings.count})</span>
                )}
                <span className="ml-2">🏠 {property.stats?.totalBookings || 0} bookings</span>
              </p>
              <p className="text-xs text-gray-300 font-mono mt-0.5">ID: {property._id}</p>
            </div>
          </div>

          {/* Host */}
          <div className="min-w-[140px] shrink-0">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Host</p>
            <div className="flex items-center gap-2">
              <img
                src={property.host?.avatar?.url || 'https://via.placeholder.com/28'}
                alt=""
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{property.host?.name}</p>
                <p className="text-xs text-gray-400 truncate">{property.host?.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Listed: {fmt(property.createdAt)}</p>
          </div>

          {/* Status + Actions */}
          <div className="flex flex-col gap-2 shrink-0 items-end">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>

            {/* ── Pending: show Approve / Reject prominently ── */}
            {property.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={doApprove}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <ThumbsUp size={13} /> Approve
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  <ThumbsDown size={13} /> Reject
                </button>
              </div>
            )}

            {/* ── For non-pending: show usual controls ── */}
            {property.status !== 'pending' && (
              <div className="flex items-center gap-2">
                <select
                  value={property.status}
                  onChange={e => doStatus(e.target.value)}
                  disabled={acting}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={doVerify}
                disabled={acting}
                title={property.isVerified ? 'Remove verification' : 'Verify listing'}
                className={`p-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 ${property.isVerified
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
              >
                <BadgeCheck size={14} />
                {property.isVerified ? 'Verified' : 'Verify'}
              </button>
              <button
                onClick={doFeature}
                disabled={acting}
                title={property.isFeatured ? 'Remove from featured' : 'Feature this listing'}
                className={`p-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 ${property.isFeatured
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
                  }`}
              >
                <Sparkles size={14} />
                {property.isFeatured ? 'Featured' : 'Feature'}
              </button>
              <button
                onClick={doDelete}
                disabled={acting}
                title="Delete property permanently"
                className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-1">Reject Property</h3>
            <p className="text-sm text-gray-500 mb-4">Optionally add a reason — it'll be sent to the host.</p>
            <textarea
              rows={3}
              placeholder="e.g. Images are unclear, description too short..."
              className="input-field resize-none mb-4 text-sm"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(false)} className="flex-1 btn-secondary text-sm">Cancel</button>
              <button onClick={doReject} disabled={acting}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {acting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const fetchProperties = async (s = search, st = statusFilter, p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: LIMIT, page: p })
      if (s) params.append('search', s)
      if (st !== 'all') params.append('status', st)
      const res = await api.get(`/admin/properties?${params}`)
      setProperties(res.data.data?.properties || [])
      setTotal(res.data.data?.pagination?.total || 0)
    } catch {
      toast.error('Failed to load properties')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchProperties() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProperties(search, statusFilter, 1)
  }

  const handleStatusFilter = (st) => {
    setStatusFilter(st)
    setPage(1)
    fetchProperties(search, st, 1)
  }

  const handleUpdate = (id, changes) => {
    setProperties(prev => prev.map(p => p._id === id ? { ...p, ...changes } : p))
  }

  const handleDelete = (id) => {
    setProperties(prev => prev.filter(p => p._id !== id))
    setTotal(t => t - 1)
  }

  const tabs = ['all', 'pending', 'active', 'inactive', 'suspended', 'rejected']

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building size={24} className="text-rose-500" /> Manage Properties
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} total listings</p>
        </div>
        <button onClick={() => fetchProperties()} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 mb-5 flex-wrap">
        <span className="flex items-center gap-1"><BadgeCheck size={13} className="text-blue-500" /> Verified = trusted listing</span>
        <span className="flex items-center gap-1"><Sparkles size={13} className="text-yellow-500" /> Featured = shown prominently on Home</span>
        <span className="flex items-center gap-1 text-red-500">Suspended = hidden from all guests</span>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => handleStatusFilter(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${statusFilter === t
              ? 'bg-rose-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-300'
              }`}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, city, or country..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <button type="submit" className="btn-primary px-5 text-sm">Search</button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); setPage(1); fetchProperties('', statusFilter, 1) }}
            className="btn-secondary text-sm px-4">Clear</button>
        )}
      </form>

      {/* Properties List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <Building size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No properties found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(p => (
            <PropertyRow
              key={p._id}
              property={p}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setPage(p => p - 1); fetchProperties(search, statusFilter, page - 1) }}
              disabled={page === 1} className="btn-secondary text-sm px-4 disabled:opacity-40">← Previous</button>
            <button onClick={() => { setPage(p => p + 1); fetchProperties(search, statusFilter, page + 1) }}
              disabled={page * LIMIT >= total} className="btn-secondary text-sm px-4 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
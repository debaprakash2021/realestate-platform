import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusSquare, Star, MapPin, Eye, Trash2, Edit } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function MyProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/properties/host/my-properties')
      .then(r => setProperties(r.data.data || []))
      .catch(() => toast.error('Failed to load properties'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this property? This cannot be undone.')) return
    try {
      await api.delete(`/properties/${id}`)
      setProperties(prev => prev.filter(p => p._id !== id))
      toast.success('Property deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-36" />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link to="/host/properties/new" className="btn-primary flex items-center gap-2">
          <PlusSquare size={16} /> List New
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏡</p>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No properties yet</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-6">List your first property to start earning</p>
          <Link to="/host/properties/new" className="btn-primary">List a Property</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map(p => {
            const image = p.images?.[0]?.url || p.primaryImage || 'https://placehold.co/200x150?text=No+Image'
            const statusConfig = {
              active: { cls: 'bg-green-100 text-green-700', label: '✅ Active' },
              inactive: { cls: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400', label: 'Inactive' },
              suspended: { cls: 'bg-red-100 text-red-700', label: '🚫 Suspended' },
              pending: { cls: 'bg-amber-100 text-amber-700', label: '⏳ Pending Review' },
              rejected: { cls: 'bg-red-100 text-red-600', label: '❌ Rejected' },
            }
            const stConf = statusConfig[p.status] || statusConfig.inactive
            return (
              <div key={p._id} className="card flex flex-col sm:flex-row overflow-hidden group">
                <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0">
                  <img src={image} alt={p.title} className="w-full h-full object-cover"
                    onError={e => e.target.src = 'https://placehold.co/200x150?text=No+Image'} />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${stConf.cls}`}>
                    {stConf.label}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{p.title}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <MapPin size={13} /> {p.location?.city}, {p.location?.state}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{p.details?.bedrooms} bed · {p.details?.bathrooms} bath · {p.details?.maxGuests} guests</span>
                      {p.ratings?.average > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-gray-700 dark:fill-gray-300 text-gray-700 dark:text-gray-200" /> {p.ratings.average} ({p.ratings.count})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{p.pricing?.basePrice?.toLocaleString()}<span className="text-gray-400 dark:text-gray-500 font-normal text-sm">/night</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Link to={`/property/${p._id}`} className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                        <Eye size={17} />
                      </Link>
                      {/* ✅ NEW: Edit button */}
                      <Link to={`/host/properties/${p._id}/edit`} className="p-2 text-gray-400 dark:text-gray-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                        <Edit size={17} />
                      </Link>
                      <button onClick={() => handleDelete(p._id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
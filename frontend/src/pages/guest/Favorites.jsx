import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Star, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    api.get('/favorites')
      .then(r => setFavorites(r.data.data || []))
      .catch(() => toast.error('Failed to load favorites'))
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = async (propertyId) => {
    try {
      await api.post(`/favorites/${propertyId}/toggle`)
      setFavorites(prev => prev.filter(f => f.property._id !== propertyId))
      toast.success('Removed from favorites')
    } catch { toast.error('Something went wrong') }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10"><div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="card h-64" />)}</div></div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Favorites</h1>
      <p className="text-gray-500 mb-8">{favorites.length} saved {favorites.length === 1 ? 'property' : 'properties'}</p>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No favorites yet</h3>
          <p className="text-gray-400 mb-6">Save properties you love by clicking the heart icon</p>
          <Link to="/" className="btn-primary">Explore Properties</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(f => {
            const p     = f.property
            const image = p.images?.[0]?.url || p.primaryImage || 'https://placehold.co/400x280?text=No+Image'
            return (
              <div key={f._id} className="group block">
                <div className="relative overflow-hidden rounded-xl">
                  <Link to={`/property/${p._id}`}>
                    <img src={image} alt={p.title} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => e.target.src = 'https://placehold.co/400x280?text=No+Image'} />
                  </Link>
                  <button onClick={() => handleRemove(p._id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 hover:bg-white shadow text-rose-500 hover:text-rose-700 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <Link to={`/property/${p._id}`} className="font-semibold text-sm text-gray-900 hover:text-rose-500 line-clamp-1">{p.title}</Link>
                    {p.ratings?.average > 0 && (
                      <span className="flex items-center gap-1 text-sm shrink-0">
                        <Star size={12} className="fill-gray-900 text-gray-900" />{p.ratings.average}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin size={13} />{p.location?.city}, {p.location?.state}
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">₹{p.pricing?.basePrice?.toLocaleString()}</span>
                    <span className="text-gray-500"> /night</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
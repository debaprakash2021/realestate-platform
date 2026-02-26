import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import api from '../../api/axios'
import PropertyCard from '../../components/common/PropertyCard'
import { useAuth } from '../../context/AuthContext'

const PROPERTY_TYPES = ['all', 'apartment', 'house', 'villa', 'cabin', 'cottage', 'studio']

export default function Home() {
  const { user }                          = useAuth()
  const [properties, setProperties]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [type, setType]                   = useState('all')
  const [maxPrice, setMaxPrice]           = useState('')
  const [showFilters, setShowFilters]     = useState(false)
  // FIX #8: Track the set of property IDs the user has favorited so we can pass
  // correct initial state to PropertyCard. Without this, all heart icons start as
  // un-liked on every page load, even if the user previously favorited them.
  const [favoritedIds, setFavoritedIds]   = useState(new Set())

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.append('city', search)
      if (type !== 'all') params.append('propertyType', type)
      if (maxPrice) params.append('maxPrice', maxPrice)
      const res = await api.get(`/properties?${params}`)
      setProperties(res.data.data?.properties || res.data.data || [])
    } catch { setProperties([]) }
    finally  { setLoading(false) }
  }

  // Fetch user's favorited IDs in parallel (only when logged in)
  const fetchFavoriteIds = async () => {
    if (!user) { setFavoritedIds(new Set()); return }
    try {
      const res = await api.get('/favorites')
      const ids = (res.data.data || []).map(f => f.property?._id || f.property)
      setFavoritedIds(new Set(ids))
    } catch { /* non-critical, silently ignore */ }
  }

  useEffect(() => {
    fetchProperties()
  }, [type])

  // Re-fetch favorite IDs when user logs in or out
  useEffect(() => {
    fetchFavoriteIds()
  }, [user?.id])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProperties()
  }

  const clearFilters = () => {
    setSearch('')
    setType('all')
    setMaxPrice('')
    setTimeout(fetchProperties, 100)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero Search */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Your Perfect Stay</h1>
        <p className="text-lg text-gray-500 mb-8">Discover unique places to stay around the world</p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by city..."
              className="input-field pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className="btn-secondary px-4">
            <SlidersHorizontal size={18} />
          </button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 max-w-2xl mx-auto mt-4 p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1 text-left">Max Price per Night (₹)</label>
              <input type="number" placeholder="e.g. 5000" className="input-field text-sm"
                value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 mt-4">
              <X size={15} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Property Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {PROPERTY_TYPES.map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              type === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl h-56 mb-3" />
              <div className="bg-gray-200 rounded h-4 w-3/4 mb-2" />
              <div className="bg-gray-200 rounded h-3 w-1/2 mb-2" />
              <div className="bg-gray-200 rounded h-3 w-1/4" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏠</p>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No properties found</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
          <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{properties.length} properties found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map(p => (
              <PropertyCard
                key={p._id}
                property={p}
                isFavorited={favoritedIds.has(p._id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
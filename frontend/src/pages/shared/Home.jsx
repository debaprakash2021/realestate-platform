import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import PropertyCard from '../../components/common/PropertyCard'
import toast from 'react-hot-toast'

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'studio', 'cottage', 'cabin', 'loft', 'penthouse']
const ROOM_TYPES     = ['entire_place', 'private_room', 'shared_room']

const ROOM_TYPE_LABELS = {
  entire_place: 'Entire Place',
  private_room: 'Private Room',
  shared_room:  'Shared Room'
}

const defaultFilters = {
  city: '', propertyType: '', roomType: '',
  minPrice: '', maxPrice: '', sortBy: ''
}

export default function Home() {
  const { user } = useAuth()

  const [properties, setProperties]   = useState([])
  const [pagination, setPagination]   = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading]         = useState(true)
  const [favIds, setFavIds]           = useState(new Set())
  const [filters, setFilters]         = useState(defaultFilters)
  const [pendingFilters, setPending]  = useState(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage]               = useState(1)

  // Fetch favorites for logged-in users
  useEffect(() => {
    if (!user) { setFavIds(new Set()); return }
    api.get('/favorites')
      .then(res => {
        const ids = (res.data.data || []).map(f => f.property?._id || f._id)
        setFavIds(new Set(ids))
      })
      .catch(() => {})
  }, [user])

  // Fetch properties
  const fetchProperties = useCallback(async (activeFilters, activePage) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: activePage, limit: 12 })
      if (activeFilters.city)         params.append('city', activeFilters.city.trim())
      if (activeFilters.propertyType) params.append('propertyType', activeFilters.propertyType)
      if (activeFilters.roomType)     params.append('roomType', activeFilters.roomType)
      if (activeFilters.minPrice)     params.append('minPrice', activeFilters.minPrice)
      if (activeFilters.maxPrice)     params.append('maxPrice', activeFilters.maxPrice)
      if (activeFilters.sortBy)       params.append('sortBy', activeFilters.sortBy)

      const res = await api.get(`/properties?${params}`)
      setProperties(res.data.data?.properties || [])
      setPagination(res.data.data?.pagination || { page: 1, pages: 1, total: 0 })
    } catch {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProperties(filters, page)
  }, [filters, page, fetchProperties])

  const applyFilters = () => {
    setFilters(pendingFilters)
    setPage(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setPending(defaultFilters)
    setFilters(defaultFilters)
    setPage(1)
    setShowFilters(false)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700/60 rounded-xl h-56 mb-3" />
      <div className="bg-gray-200 dark:bg-gray-700/60 rounded h-4 w-3/4 mb-2" />
      <div className="bg-gray-200 dark:bg-gray-700/60 rounded h-3 w-1/2 mb-2" />
      <div className="bg-gray-200 dark:bg-gray-700/60 rounded h-3 w-1/3" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Find your perfect stay
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Browse thousands of properties — no account needed to explore
        </p>

        {/* Search row */}
        <div className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by city…"
              value={pendingFilters.city}
              onChange={e => setPending(p => ({ ...p, city: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              className="input-field pl-10 w-full"
            />
          </div>
          <button onClick={applyFilters} className="btn-primary px-5 shrink-0">
            Search
          </button>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
              hasActiveFilters
                ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20 text-rose-600'
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card p-5 mb-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Property Type</label>
              <select
                value={pendingFilters.propertyType}
                onChange={e => setPending(p => ({ ...p, propertyType: e.target.value }))}
                className="input-field text-sm w-full"
              >
                <option value="">All types</option>
                {PROPERTY_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Room Type</label>
              <select
                value={pendingFilters.roomType}
                onChange={e => setPending(p => ({ ...p, roomType: e.target.value }))}
                className="input-field text-sm w-full"
              >
                <option value="">All rooms</option>
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Price (₹/night)</label>
              <input
                type="number" min="0" placeholder="0"
                value={pendingFilters.minPrice}
                onChange={e => setPending(p => ({ ...p, minPrice: e.target.value }))}
                className="input-field text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Max Price (₹/night)</label>
              <input
                type="number" min="0" placeholder="Any"
                value={pendingFilters.maxPrice}
                onChange={e => setPending(p => ({ ...p, maxPrice: e.target.value }))}
                className="input-field text-sm w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sort By</label>
              <select
                value={pendingFilters.sortBy}
                onChange={e => setPending(p => ({ ...p, sortBy: e.target.value }))}
                className="input-field text-sm w-full"
              >
                <option value="">Default</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <button onClick={applyFilters} className="btn-primary px-6">Apply Filters</button>
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <X size={14} /> Clear all
            </button>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(filters).map(([key, val]) => {
            if (!val) return null
            const labels = {
              city: `📍 ${val}`,
              propertyType: `🏠 ${val.charAt(0).toUpperCase() + val.slice(1)}`,
              roomType: `🚪 ${ROOM_TYPE_LABELS[val] || val}`,
              minPrice: `₹${Number(val).toLocaleString()}+`,
              maxPrice: `up to ₹${Number(val).toLocaleString()}`,
              sortBy: `Sort: ${val.replace('_', ' ')}`
            }
            return (
              <span key={key} className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                {labels[key]}
                <button onClick={() => {
                  const next = { ...filters, [key]: '' }
                  setFilters(next)
                  setPending(next)
                  setPage(1)
                }}><X size={11} /></button>
              </span>
            )
          })}
        </div>
      )}

      {/* Results count */}
      {!loading && pagination.total > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {pagination.total} propert{pagination.total === 1 ? 'y' : 'ies'} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20">
          <HomeIcon size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No properties found</h3>
          <p className="text-gray-400 dark:text-gray-500 mb-5">Try adjusting your filters or search in a different city.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-primary px-6">Clear Filters</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map(p => (
            <PropertyCard
              key={p._id}
              property={p}
              isFavorited={favIds.has(p._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === pagination.pages || Math.abs(n - page) <= 2)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
              acc.push(n)
              return acc
            }, [])
            .map((n, i) =>
              n === '…' ? (
                <span key={`dot-${i}`} className="px-1 text-gray-400 dark:text-gray-500">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    n === page
                      ? 'bg-rose-500 text-white'
                      : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {n}
                </button>
              )
            )
          }

          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Guest CTA banner */}
      {!user && properties.length > 0 && (
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Ready to book your perfect stay?</h2>
          <p className="text-rose-100 text-sm mb-4">
            Create a free account to save favorites, book properties, and message hosts.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/register" className="bg-white text-rose-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-rose-50 transition-colors">
              Sign up free
            </a>
            <a href="/login" className="border border-rose-300 text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-rose-400/30 transition-colors">
              Log in
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
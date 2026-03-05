import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Home as HomeIcon, Map, LayoutGrid, Star, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import PropertyCard from '../../components/common/PropertyCard'
import toast from 'react-hot-toast'

// ─── Fix Leaflet default marker icons broken by Vite bundling ────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Custom price-bubble marker (like Airbnb) ─────────────────────────────────
const createPriceIcon = (price, isSelected = false) => L.divIcon({
  className: '',
  html: `<div style="
    background:${isSelected ? '#f43f5e' : 'white'};
    color:${isSelected ? 'white' : '#111827'};
    padding:5px 10px;
    border-radius:20px;
    font-size:12px;
    font-weight:700;
    border:2px solid ${isSelected ? '#f43f5e' : '#e5e7eb'};
    box-shadow:0 2px 8px rgba(0,0,0,0.18);
    white-space:nowrap;
    cursor:pointer;
    transition:all 0.15s;
  ">₹${Number(price).toLocaleString('en-IN')}</div>`,
  iconAnchor: [32, 16],
  popupAnchor: [0, -20],
})

// ─── Recenter map when properties change ──────────────────────────────────────
function MapRecenter({ properties }) {
  const map = useMap()
  useEffect(() => {
    const valid = properties.filter(p => p.location?.coordinates?.coordinates?.length === 2)
    if (!valid.length) return
    if (valid.length === 1) {
      const [lng, lat] = valid[0].location.coordinates.coordinates
      map.setView([lat, lng], 13)
    } else {
      const lats = valid.map(p => p.location.coordinates.coordinates[1])
      const lngs = valid.map(p => p.location.coordinates.coordinates[0])
      map.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [40, 40] })
    }
  }, [properties])
  return null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'studio', 'cottage', 'cabin', 'loft', 'penthouse']
const ROOM_TYPES     = ['entire_place', 'private_room', 'shared_room']
const ROOM_TYPE_LABELS = { entire_place: 'Entire Place', private_room: 'Private Room', shared_room: 'Shared Room' }
const defaultFilters   = { city: '', propertyType: '', roomType: '', minPrice: '', maxPrice: '', sortBy: '' }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth()

  const [properties,     setProperties]    = useState([])
  const [pagination,     setPagination]    = useState({ page: 1, pages: 1, total: 0 })
  const [loading,        setLoading]       = useState(true)
  const [favIds,         setFavIds]        = useState(new Set())
  const [filters,        setFilters]       = useState(defaultFilters)
  const [pendingFilters, setPending]       = useState(defaultFilters)
  const [showFilters,    setShowFilters]   = useState(false)
  const [page,           setPage]          = useState(1)
  const [viewMode,       setViewMode]      = useState('grid')   // 'grid' | 'map'
  const [selectedPin,    setSelectedPin]   = useState(null)     // property._id

  // Fetch favorites
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
      if (activeFilters.city)         params.append('city',         activeFilters.city.trim())
      if (activeFilters.propertyType) params.append('propertyType', activeFilters.propertyType)
      if (activeFilters.roomType)     params.append('roomType',     activeFilters.roomType)
      if (activeFilters.minPrice)     params.append('minPrice',     activeFilters.minPrice)
      if (activeFilters.maxPrice)     params.append('maxPrice',     activeFilters.maxPrice)
      if (activeFilters.sortBy)       params.append('sortBy',       activeFilters.sortBy)
      const res = await api.get(`/properties?${params}`)
      setProperties(res.data.data?.properties || [])
      setPagination(res.data.data?.pagination || { page: 1, pages: 1, total: 0 })
    } catch {
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProperties(filters, page) }, [filters, page, fetchProperties])

  const applyFilters = () => { setFilters(pendingFilters); setPage(1); setShowFilters(false) }
  const clearFilters = () => { setPending(defaultFilters); setFilters(defaultFilters); setPage(1); setShowFilters(false) }
  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  // Properties with valid coordinates (for map)
  const mappableProps = properties.filter(p => p.location?.coordinates?.coordinates?.length === 2)

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

      {/* ── Hero ── */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Find your perfect stay
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Browse thousands of properties — no account needed to explore
        </p>

        {/* Search + Filter + View toggle row */}
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
          <button onClick={applyFilters} className="btn-primary px-5 shrink-0">Search</button>
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

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="card p-5 mb-6 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Property Type</label>
              <select value={pendingFilters.propertyType} onChange={e => setPending(p => ({ ...p, propertyType: e.target.value }))} className="input-field text-sm w-full">
                <option value="">All types</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Room Type</label>
              <select value={pendingFilters.roomType} onChange={e => setPending(p => ({ ...p, roomType: e.target.value }))} className="input-field text-sm w-full">
                <option value="">All rooms</option>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Price (₹/night)</label>
              <input type="number" min="0" placeholder="0" value={pendingFilters.minPrice} onChange={e => setPending(p => ({ ...p, minPrice: e.target.value }))} className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Max Price (₹/night)</label>
              <input type="number" min="0" placeholder="Any" value={pendingFilters.maxPrice} onChange={e => setPending(p => ({ ...p, maxPrice: e.target.value }))} className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sort By</label>
              <select value={pendingFilters.sortBy} onChange={e => setPending(p => ({ ...p, sortBy: e.target.value }))} className="input-field text-sm w-full">
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

      {/* ── Active Filter Tags ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(filters).map(([key, val]) => {
            if (!val) return null
            const labels = {
              city:         `📍 ${val}`,
              propertyType: `🏠 ${val.charAt(0).toUpperCase() + val.slice(1)}`,
              roomType:     `🚪 ${ROOM_TYPE_LABELS[val] || val}`,
              minPrice:     `₹${Number(val).toLocaleString()}+`,
              maxPrice:     `up to ₹${Number(val).toLocaleString()}`,
              sortBy:       `Sort: ${val.replace('_', ' ')}`
            }
            return (
              <span key={key} className="flex items-center gap-1.5 text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-full">
                {labels[key]}
                <button onClick={() => {
                  const next = { ...filters, [key]: '' }
                  setFilters(next); setPending(next); setPage(1)
                }}><X size={11} /></button>
              </span>
            )
          })}
        </div>
      )}

      {/* ── Results bar: count + view toggle ── */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} propert{pagination.total === 1 ? 'y' : 'ies'} found
          </p>

          {/* Grid / Map toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Map size={15} /> Map
            </button>
          </div>
        </div>
      )}

      {/* ── Grid View ── */}
      {viewMode === 'grid' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <HomeIcon size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No properties found</h3>
              <p className="text-gray-400 dark:text-gray-500 mb-5">Try adjusting your filters or search in a different city.</p>
              {hasActiveFilters && <button onClick={clearFilters} className="btn-primary px-6">Clear Filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.map(p => (
                <PropertyCard key={p._id} property={p} isFavorited={favIds.has(p._id)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pagination.pages || Math.abs(n - page) <= 2)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) => n === '…' ? (
                  <span key={`dot-${i}`} className="px-1 text-gray-400 dark:text-gray-500">…</span>
                ) : (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      n === page ? 'bg-rose-500 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>{n}</button>
                ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Map View ── */}
      {viewMode === 'map' && (
        <div className="flex gap-4 h-[75vh] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">

          {/* Left — scrollable property list */}
          <div className="w-80 shrink-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : mappableProps.length === 0 ? (
              <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm mt-10">
                <Map size={32} className="mx-auto mb-3 opacity-40" />
                No properties with location data
              </div>
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 px-1 py-2">
                  {mappableProps.length} propert{mappableProps.length === 1 ? 'y' : 'ies'} on map
                </p>
                {mappableProps.map(p => (
                  <Link
                    key={p._id}
                    to={`/property/${p._id}`}
                    onMouseEnter={() => setSelectedPin(p._id)}
                    onMouseLeave={() => setSelectedPin(null)}
                    className={`flex gap-3 p-2 rounded-xl transition-all cursor-pointer border ${
                      selectedPin === p._id
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                        : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <img
                      src={p.images?.[0]?.url || 'https://placehold.co/80x80?text=🏠'}
                      alt={p.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-gray-700"
                      onError={e => e.target.src = 'https://placehold.co/80x80?text=🏠'}
                    />
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{p.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {p.location?.city}
                      </p>
                      {p.ratings?.average > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <Star size={11} className="fill-gray-600 dark:fill-gray-300 text-gray-600 dark:text-gray-300" />
                          {p.ratings.average} · {p.ratings.count} reviews
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                        ₹{p.pricing?.basePrice?.toLocaleString()}
                        <span className="font-normal text-gray-400 text-xs"> /night</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right — Leaflet map */}
          <div className="flex-1 relative">
            <MapContainer
              center={[20.5937, 78.9629]}  // Center of India as default
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Auto-recenter when properties load */}
              <MapRecenter properties={mappableProps} />

              {/* Property markers */}
              {mappableProps.map(p => {
                const [lng, lat] = p.location.coordinates.coordinates
                const isSelected = selectedPin === p._id
                return (
                  <Marker
                    key={p._id}
                    position={[lat, lng]}
                    icon={createPriceIcon(p.pricing?.basePrice || 0, isSelected)}
                    eventHandlers={{
                      mouseover: () => setSelectedPin(p._id),
                      mouseout:  () => setSelectedPin(null),
                    }}
                  >
                    <Popup className="property-popup" maxWidth={220}>
                      <Link to={`/property/${p._id}`} className="block no-underline">
                        <img
                          src={p.images?.[0]?.url || 'https://placehold.co/220x130?text=🏠'}
                          alt={p.title}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                          onError={e => e.target.src = 'https://placehold.co/220x130?text=🏠'}
                          style={{ display: 'block' }}
                        />
                        <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 2, lineHeight: 1.3 }}>
                          {p.title}
                        </p>
                        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          📍 {p.location?.city}, {p.location?.state}
                        </p>
                        {p.ratings?.average > 0 && (
                          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                            ⭐ {p.ratings.average} · {p.ratings.count} reviews
                          </p>
                        )}
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#f43f5e' }}>
                          ₹{p.pricing?.basePrice?.toLocaleString()} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>/night</span>
                        </p>
                        <div style={{ marginTop: 8, background: '#f43f5e', color: 'white', textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                          View Property →
                        </div>
                      </Link>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>

            {/* Map overlay: no coords warning */}
            {!loading && properties.length > 0 && mappableProps.length < properties.length && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-700 z-10">
                {properties.length - mappableProps.length} propert{properties.length - mappableProps.length === 1 ? 'y' : 'ies'} without location data hidden
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Guest CTA ── */}
      {!user && properties.length > 0 && (
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Ready to book your perfect stay?</h2>
          <p className="text-rose-100 text-sm mb-4">
            Create a free account to save favorites, book properties, and message hosts.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/register" className="bg-white text-rose-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-rose-50 transition-colors">Sign up free</a>
            <a href="/login"    className="border border-rose-300 text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-rose-400/30 transition-colors">Log in</a>
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect, useCallback } from 'react'
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Home as HomeIcon, Map, LayoutGrid, Star, MapPin, ChevronDown
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import PropertyCard from '../../components/common/PropertyCard'
import toast from 'react-hot-toast'

// ─── Fix Leaflet default marker icons (Vite breaks them) ─────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── All Indian States & UTs with center coords ───────────────────────────────
const INDIA_STATES = {
  'Andhra Pradesh':       { lat: 15.9129, lng: 79.7400, zoom: 7 },
  'Arunachal Pradesh':    { lat: 27.1004, lng: 93.6167, zoom: 7 },
  'Assam':                { lat: 26.2006, lng: 92.9376, zoom: 7 },
  'Bihar':                { lat: 25.0961, lng: 85.3131, zoom: 7 },
  'Chhattisgarh':         { lat: 21.2787, lng: 81.8661, zoom: 7 },
  'Goa':                  { lat: 15.2993, lng: 74.1240, zoom: 9 },
  'Gujarat':              { lat: 22.2587, lng: 71.1924, zoom: 7 },
  'Haryana':              { lat: 29.0588, lng: 76.0856, zoom: 8 },
  'Himachal Pradesh':     { lat: 31.1048, lng: 77.1734, zoom: 8 },
  'Jharkhand':            { lat: 23.6102, lng: 85.2799, zoom: 7 },
  'Karnataka':            { lat: 15.3173, lng: 75.7139, zoom: 7 },
  'Kerala':               { lat: 10.8505, lng: 76.2711, zoom: 7 },
  'Madhya Pradesh':       { lat: 22.9734, lng: 78.6569, zoom: 7 },
  'Maharashtra':          { lat: 19.7515, lng: 75.7139, zoom: 7 },
  'Manipur':              { lat: 24.6637, lng: 93.9063, zoom: 8 },
  'Meghalaya':            { lat: 25.4670, lng: 91.3662, zoom: 8 },
  'Mizoram':              { lat: 23.1645, lng: 92.9376, zoom: 8 },
  'Nagaland':             { lat: 26.1584, lng: 94.5624, zoom: 8 },
  'Odisha':               { lat: 20.9517, lng: 85.0985, zoom: 7 },
  'Punjab':               { lat: 31.1471, lng: 75.3412, zoom: 8 },
  'Rajasthan':            { lat: 27.0238, lng: 74.2179, zoom: 7 },
  'Sikkim':               { lat: 27.5330, lng: 88.5122, zoom: 9 },
  'Tamil Nadu':           { lat: 11.1271, lng: 78.6569, zoom: 7 },
  'Telangana':            { lat: 18.1124, lng: 79.0193, zoom: 7 },
  'Tripura':              { lat: 23.9408, lng: 91.9882, zoom: 8 },
  'Uttar Pradesh':        { lat: 26.8467, lng: 80.9462, zoom: 7 },
  'Uttarakhand':          { lat: 30.0668, lng: 79.0193, zoom: 8 },
  'West Bengal':          { lat: 22.9868, lng: 87.8550, zoom: 7 },
  // Union Territories
  'Andaman and Nicobar Islands': { lat: 11.7401, lng: 92.6586, zoom: 7 },
  'Chandigarh':           { lat: 30.7333, lng: 76.7794, zoom: 12 },
  'Dadra and Nagar Haveli and Daman and Diu': { lat: 20.1809, lng: 73.0169, zoom: 10 },
  'Delhi':                { lat: 28.7041, lng: 77.1025, zoom: 11 },
  'Jammu and Kashmir':    { lat: 33.7782, lng: 76.5762, zoom: 7 },
  'Ladakh':               { lat: 34.1526, lng: 77.5770, zoom: 7 },
  'Lakshadweep':          { lat: 10.5667, lng: 72.6417, zoom: 9 },
  'Puducherry':           { lat: 11.9416, lng: 79.8083, zoom: 10 },
}

const STATE_LIST = Object.keys(INDIA_STATES).sort()

// ─── India defaults ───────────────────────────────────────────────────────────
const INDIA_CENTER = [22.5937, 78.9629]
const INDIA_ZOOM   = 5

// ─── Price bubble marker ──────────────────────────────────────────────────────
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
    box-shadow:0 2px 8px rgba(0,0,0,0.2);
    white-space:nowrap;
    cursor:pointer;
  ">₹${Number(price).toLocaleString('en-IN')}</div>`,
  iconAnchor: [32, 16],
  popupAnchor: [0, -20],
})

// ─── MapController: flies to selected state or fits all markers ───────────────
function MapController({ selectedState, visibleProps }) {
  const map = useMap()

  useEffect(() => {
    // If a specific state is selected, fly to its center
    if (selectedState && INDIA_STATES[selectedState]) {
      const { lat, lng, zoom } = INDIA_STATES[selectedState]
      map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 })
      return
    }

    // Otherwise fit to visible markers, or show all India
    const valid = visibleProps.filter(p => p.location?.coordinates?.coordinates?.length === 2)
    if (!valid.length) {
      map.flyTo(INDIA_CENTER, INDIA_ZOOM, { animate: true, duration: 0.8 })
      return
    }
    if (valid.length === 1) {
      const [lng, lat] = valid[0].location.coordinates.coordinates
      map.flyTo([lat, lng], 13, { animate: true, duration: 0.8 })
      return
    }
    const lats = valid.map(p => p.location.coordinates.coordinates[1])
    const lngs = valid.map(p => p.location.coordinates.coordinates[0])
    map.flyToBounds(
      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
      { padding: [50, 50], animate: true, duration: 0.8 }
    )
  }, [selectedState, visibleProps])

  return null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROPERTY_TYPES   = ['apartment', 'house', 'villa', 'studio', 'cottage', 'cabin', 'loft', 'penthouse']
const ROOM_TYPES       = ['entire_place', 'private_room', 'shared_room']
const ROOM_TYPE_LABELS = { entire_place: 'Entire Place', private_room: 'Private Room', shared_room: 'Shared Room' }
const defaultFilters   = { city: '', propertyType: '', roomType: '', minPrice: '', maxPrice: '', sortBy: '' }

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth()

  const [properties,     setProperties]  = useState([])
  const [pagination,     setPagination]  = useState({ page: 1, pages: 1, total: 0 })
  const [loading,        setLoading]     = useState(true)
  const [favIds,         setFavIds]      = useState(new Set())
  const [filters,        setFilters]     = useState(defaultFilters)
  const [pendingFilters, setPending]     = useState(defaultFilters)
  const [showFilters,    setShowFilters] = useState(false)
  const [page,           setPage]        = useState(1)
  const [viewMode,       setViewMode]    = useState('grid')    // 'grid' | 'map'
  const [selectedPin,    setSelectedPin] = useState(null)      // hovered property _id
  const [selectedState,  setSelectedState] = useState('')      // state filter on map

  // Fetch favorites
  useEffect(() => {
    if (!user) { setFavIds(new Set()); return }
    api.get('/favorites')
      .then(res => setFavIds(new Set((res.data.data || []).map(f => f.property?._id || f._id))))
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
    } catch { toast.error('Failed to load properties') }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetchProperties(filters, page) }, [filters, page, fetchProperties])

  // When switching to map view, auto-set state from search filter
  useEffect(() => {
    if (viewMode === 'map' && filters.city) {
      // Try to match searched city's state from loaded properties
      const match = properties.find(p =>
        p.location?.city?.toLowerCase().includes(filters.city.toLowerCase())
      )
      if (match?.location?.state) setSelectedState(match.location.state)
    }
  }, [viewMode])

  const applyFilters = () => { setFilters(pendingFilters); setPage(1); setShowFilters(false) }
  const clearFilters = () => { setPending(defaultFilters); setFilters(defaultFilters); setPage(1); setShowFilters(false) }
  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  // Properties that have valid GPS coordinates
  const mappableProps = properties.filter(p => p.location?.coordinates?.coordinates?.length === 2)

  // Properties filtered by selected state (for map sidebar + markers)
  const stateFilteredProps = selectedState
    ? mappableProps.filter(p =>
        p.location?.state?.toLowerCase().trim() === selectedState.toLowerCase().trim()
      )
    : mappableProps

  // Count properties per state (for dropdown labels)
  const stateCountMap = mappableProps.reduce((acc, p) => {
    const s = p.location?.state
    if (s) acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

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
          Browse thousands of properties across India — no account needed to explore
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
                <button onClick={() => { const n = { ...filters, [key]: '' }; setFilters(n); setPending(n); setPage(1) }}>
                  <X size={11} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* ── Results bar: count + Grid/Map toggle ── */}
      {!loading && pagination.total > 0 && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} propert{pagination.total === 1 ? 'y' : 'ies'} found
          </p>
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

      {/* ══════════════════════════════════════════════════════════════
          GRID VIEW
      ══════════════════════════════════════════════════════════════ */}
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
              {properties.map(p => <PropertyCard key={p._id} property={p} isFavorited={favIds.has(p._id)} />)}
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
                  if (idx > 0 && n - arr[idx-1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`d${i}`} className="px-1 text-gray-400">…</span>
                  : <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        n === page ? 'bg-rose-500 text-white' : 'border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}>{n}</button>
                )}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MAP VIEW
      ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'map' && (
        <div className="space-y-3">

          {/* State / UT filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none" />
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="input-field pl-8 pr-8 text-sm appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">🇮🇳 All India</option>
                {STATE_LIST.map(s => (
                  <option key={s} value={s}>
                    {s}{stateCountMap[s] ? ` (${stateCountMap[s]})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {selectedState && (
              <button
                onClick={() => setSelectedState('')}
                className="flex items-center gap-1.5 text-xs text-rose-500 border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors"
              >
                <X size={11} /> Clear state filter
              </button>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {selectedState
                ? `${stateFilteredProps.length} propert${stateFilteredProps.length === 1 ? 'y' : 'ies'} in ${selectedState}`
                : `${mappableProps.length} propert${mappableProps.length === 1 ? 'y' : 'ies'} on map`
              }
            </p>
          </div>

          {/* Map + Sidebar layout */}
          <div className="flex gap-0 h-[75vh] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">

            {/* Left — property list */}
            <div className="w-72 shrink-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
              {loading ? (
                <div className="p-3 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stateFilteredProps.length === 0 ? (
                <div className="p-6 text-center mt-16">
                  <Map size={36} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No properties here</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {selectedState ? `No listings found in ${selectedState}` : 'No properties have location data'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {stateFilteredProps.map(p => (
                    <Link
                      key={p._id}
                      to={`/property/${p._id}`}
                      onMouseEnter={() => setSelectedPin(p._id)}
                      onMouseLeave={() => setSelectedPin(null)}
                      className={`flex gap-2.5 p-2 rounded-xl mb-1 transition-all border ${
                        selectedPin === p._id
                          ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <img
                        src={p.images?.[0]?.url || 'https://placehold.co/72x72?text=🏠'}
                        alt={p.title}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-gray-700"
                        onError={e => e.target.src = 'https://placehold.co/72x72?text=🏠'}
                      />
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 leading-snug">{p.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{p.location?.city}, {p.location?.state}</span>
                        </p>
                        {p.ratings?.average > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
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

            {/* Right — Leaflet Map */}
            <div className="flex-1 relative">
              <MapContainer
                center={INDIA_CENTER}
                zoom={INDIA_ZOOM}
                minZoom={4}
                maxZoom={18}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Fly to state or fit markers */}
                <MapController selectedState={selectedState} visibleProps={stateFilteredProps} />

                {/* Property markers */}
                {stateFilteredProps.map(p => {
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
                      <Popup maxWidth={220}>
                        <Link to={`/property/${p._id}`} className="block no-underline">
                          <img
                            src={p.images?.[0]?.url || 'https://placehold.co/220x130?text=🏠'}
                            alt={p.title}
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 8 }}
                            onError={e => e.target.src = 'https://placehold.co/220x130?text=🏠'}
                          />
                          <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 3, lineHeight: 1.3 }}>{p.title}</p>
                          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>
                            📍 {p.location?.city}, {p.location?.state}
                          </p>
                          {p.ratings?.average > 0 && (
                            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                              ⭐ {p.ratings.average} ({p.ratings.count} reviews)
                            </p>
                          )}
                          <p style={{ fontWeight: 700, fontSize: 14, color: '#f43f5e', marginBottom: 8 }}>
                            ₹{p.pricing?.basePrice?.toLocaleString()}
                            <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}> /night</span>
                          </p>
                          <div style={{ background: '#f43f5e', color: 'white', textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            View Property →
                          </div>
                        </Link>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>

              {/* Badge: properties without coordinates */}
              {!loading && properties.length > 0 && mappableProps.length < properties.length && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full shadow border border-gray-200 dark:border-gray-700 pointer-events-none">
                  {properties.length - mappableProps.length} propert{properties.length - mappableProps.length === 1 ? 'y' : 'ies'} without GPS hidden
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Guest CTA ── */}
      {!user && properties.length > 0 && viewMode === 'grid' && (
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Ready to book your perfect stay?</h2>
          <p className="text-rose-100 text-sm mb-4">Create a free account to save favorites, book properties, and message hosts.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/register" className="bg-white text-rose-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-rose-50 transition-colors">Sign up free</a>
            <a href="/login"    className="border border-rose-300 text-white font-medium px-5 py-2 rounded-lg text-sm hover:bg-rose-400/30 transition-colors">Log in</a>
          </div>
        </div>
      )}
    </div>
  )
}
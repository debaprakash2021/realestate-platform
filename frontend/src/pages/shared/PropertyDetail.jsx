import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star, MapPin, Users, Bed, Bath, Wifi, Car, Wind, Flame, Tv,
  Utensils, ArrowLeft, MessageCircle, ChevronLeft, ChevronRight, X, CalendarDays
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { savePendingAction, consumePendingAction } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateStr = (date) => {
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const buildBlockedSet = (blockedDates = []) => {
  const set = new Set()
  for (const { startDate, endDate } of blockedDates) {
    let cur = toDateStr(new Date(startDate))
    const end = toDateStr(new Date(endDate))
    while (cur <= end) {
      set.add(cur)
      cur = addDays(cur, 1)
    }
  }
  return set
}

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

// ─── Availability Calendar Component ─────────────────────────────────────────

function AvailabilityCalendar({ blockedDates, checkIn, checkOut, onChange, onClose }) {
  const today      = toDateStr(new Date())
  const blockedSet = useMemo(() => buildBlockedSet(blockedDates), [blockedDates])

  const [viewYear,  setViewYear]  = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [selecting, setSelecting] = useState(checkIn ? (checkOut ? null : 'out') : 'in')
  const [hovered,   setHovered]   = useState(null)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const rangeHasBlocked = useCallback((from, to) => {
    let cur = from
    while (cur < to) {
      if (blockedSet.has(cur)) return true
      cur = addDays(cur, 1)
    }
    return false
  }, [blockedSet])

  const handleDayClick = (dateStr) => {
    if (dateStr < today || blockedSet.has(dateStr)) return
    if (selecting === 'in' || !selecting) {
      onChange({ checkIn: dateStr, checkOut: '' })
      setSelecting('out')
    } else {
      if (dateStr <= checkIn) {
        onChange({ checkIn: dateStr, checkOut: '' })
        setSelecting('out')
        return
      }
      if (rangeHasBlocked(checkIn, dateStr)) {
        toast.error('Selected range includes unavailable dates. Please choose different dates.')
        return
      }
      onChange({ checkIn, checkOut: dateStr })
      setSelecting(null)
    }
  }

  const getDayState = (dateStr) => {
    const isPast     = dateStr < today
    const isBlocked  = blockedSet.has(dateStr)
    const isCheckIn  = dateStr === checkIn
    const isCheckOut = dateStr === checkOut
    const rangeEnd   = checkOut || (selecting === 'out' && hovered && hovered > checkIn ? hovered : null)
    const inRange    = checkIn && rangeEnd && dateStr > checkIn && dateStr < rangeEnd
    return { isPast, isBlocked, isCheckIn, isCheckOut, inRange }
  }

  const buildGrid = (year, month) => {
    const firstDay    = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      cells.push(`${year}-${mm}-${dd}`)
    }
    return cells
  }

  const month1 = { year: viewYear, month: viewMonth }
  const month2 = viewMonth === 11
    ? { year: viewYear + 1, month: 0 }
    : { year: viewYear,     month: viewMonth + 1 }

  const renderMonth = ({ year, month }) => {
    const grid = buildGrid(year, month)
    return (
      <div key={`${year}-${month}`} className="flex-1 min-w-0">
        <p className="text-center text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {MONTHS[month]} {year}
        </p>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {grid.map((dateStr, i) => {
            if (!dateStr) return <div key={`e-${i}`} />
            const { isPast, isBlocked, isCheckIn, isCheckOut, inRange } = getDayState(dateStr)
            const isDisabled = isPast || isBlocked
            const isEndpoint = isCheckIn || isCheckOut
            const isRangeStart = isCheckIn && checkOut
            const isRangeEnd   = isCheckOut && checkIn

            let cellCls  = 'relative flex items-center justify-center h-8 text-xs select-none '
            let innerCls = 'w-8 h-8 flex items-center justify-center rounded-full transition-colors '

            if (isDisabled) {
              innerCls += isBlocked
                ? 'text-gray-300 dark:text-gray-600 line-through cursor-not-allowed'
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            } else if (isEndpoint) {
              innerCls += 'bg-rose-500 text-white font-semibold cursor-pointer z-10'
            } else if (inRange) {
              cellCls  += 'bg-rose-50 dark:bg-rose-900/20 '
              innerCls += 'text-rose-700 dark:text-rose-300 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/40'
            } else {
              innerCls += 'text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
            }

            return (
              <div
                key={dateStr}
                className={cellCls}
                onMouseEnter={() => !isDisabled && selecting === 'out' && setHovered(dateStr)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleDayClick(dateStr)}
              >
                {isRangeStart && <div className="absolute inset-y-0 right-0 left-1/2 bg-rose-50 dark:bg-rose-900/20 z-0" />}
                {isRangeEnd   && <div className="absolute inset-y-0 left-0 right-1/2 bg-rose-50 dark:bg-rose-900/20 z-0" />}
                <div className={innerCls}>{new Date(dateStr + 'T00:00').getDate()}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const canGoPrev = () => {
    const now = new Date()
    return !(viewYear === now.getFullYear() && viewMonth === now.getMonth())
  }

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)
    : 0

  return (
    <div className="mt-3 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 bg-white dark:bg-gray-800/80 shadow-lg">

      {/* Month nav + selected range */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev()}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex gap-1 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            selecting === 'in' ? 'bg-rose-500 text-white'
              : checkIn ? 'bg-rose-100 text-rose-600'
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {checkIn ? checkIn : 'Check-in'}
          </span>
          <span className="text-gray-300 dark:text-gray-600 self-center">→</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            selecting === 'out' ? 'bg-rose-500 text-white'
              : checkOut ? 'bg-rose-100 text-rose-600'
              : 'text-gray-400 dark:text-gray-500'
          }`}>
            {checkOut ? checkOut : 'Check-out'}
          </span>
        </div>

        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Two-month grid */}
      <div className="flex gap-6">
        {renderMonth(month1)}
        <div className="w-px bg-gray-100 dark:bg-gray-700/50 hidden sm:block" />
        <div className="hidden sm:block flex-1">{renderMonth(month2)}</div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-200 inline-block" /> Your stay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600 inline-block" /> Unavailable
        </span>
      </div>

      {/* Status / instructions */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        {!checkIn
          ? '👆 Click a date to set check-in'
          : !checkOut
          ? '👆 Now click a date to set check-out'
          : `✅ ${nights} night${nights > 1 ? 's' : ''} selected`}
      </p>

      {/* Clear + Done buttons */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => { onChange({ checkIn: '', checkOut: '' }); setSelecting('in') }}
          className="flex-1 text-xs py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Clear dates
        </button>
        {checkIn && checkOut && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-xs py-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
          >
            Done ✓
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [property,               setProperty]              = useState(null)
  const [reviews,                setReviews]               = useState([])
  const [loading,                setLoading]               = useState(true)
  const [booking,                setBooking]               = useState({ checkIn: '', checkOut: '', adults: 1, children: 0 })
  const [bookingLoading,         setBookingLoading]        = useState(false)
  const [imgIdx,                 setImgIdx]                = useState(0)
  const [pendingBookingRestored, setPendingBookingRestored]= useState(false)
  const [showCalendar,           setShowCalendar]          = useState(false)

  // Restore pending booking after login
  useEffect(() => {
    const pending = consumePendingAction()
    if (pending && pending.propertyId === id && pending.type === 'book' && pending.bookingData) {
      setBooking(pending.bookingData)
      setPendingBookingRestored(true)
      toast('Your booking details have been restored! Click Reserve to complete.', { icon: '📋', duration: 4000 })
    } else if (pending && pending.propertyId === id && pending.type === 'favorite') {
      sessionStorage.setItem('pendingAction', JSON.stringify(pending))
    }
  }, [id])

  // Live price calculation
  const priceCalc = useMemo(() => {
    if (!booking.checkIn || !booking.checkOut || !property) return null
    const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000)
    if (nights <= 0) return null
    const p          = property.pricing
    const basePrice  = p?.basePrice || 0
    const subtotal   = basePrice * nights
    let weeklyDiscount  = 0
    let monthlyDiscount = 0
    if (nights >= 30 && p?.monthlyDiscount > 0)
      monthlyDiscount = Math.round(subtotal * (p.monthlyDiscount / 100))
    else if (nights >= 7 && p?.weeklyDiscount > 0)
      weeklyDiscount  = Math.round(subtotal * (p.weeklyDiscount / 100))
    const cleaningFee = p?.cleaningFee || 0
    const serviceFee  = p?.serviceFee  || 0
    const total = subtotal - weeklyDiscount - monthlyDiscount + cleaningFee + serviceFee
    return { nights, basePrice, subtotal, weeklyDiscount, monthlyDiscount, cleaningFee, serviceFee, total }
  }, [booking.checkIn, booking.checkOut, property])

  // Fetch property + reviews
  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, revRes] = await Promise.all([
          api.get(`/properties/${id}`),
          api.get(`/reviews/property/${id}`)
        ])
        setProperty(propRes.data.data)
        setReviews(revRes.data.data?.reviews || [])
      } catch { toast.error('Property not found') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleBook = async (e) => {
    e.preventDefault()
    if (!booking.checkIn || !booking.checkOut) {
      toast.error('Please select check-in and check-out dates')
      setShowCalendar(true)
      return
    }
    if (!user) {
      savePendingAction({ type: 'book', propertyId: id, returnTo: `/property/${id}`, bookingData: booking })
      toast('Please sign in to complete your booking', { icon: '🔐', duration: 3000 })
      navigate('/login')
      return
    }
    setBookingLoading(true)
    try {
      const res = await api.post('/bookings', {
        propertyId: id,
        checkIn:    booking.checkIn,
        checkOut:   booking.checkOut,
        guests:     { adults: booking.adults, children: booking.children, infants: 0 }
      })
      toast.success('Booking created! Redirecting to payment... 🎉')
      navigate(`/payment/${res.data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setBookingLoading(false) }
  }

  const handleMessage = async () => {
    if (!user) {
      savePendingAction({ type: 'message', propertyId: id, returnTo: `/property/${id}` })
      toast('Please sign in to message the host', { icon: '🔐', duration: 3000 })
      navigate('/login')
      return
    }
    try {
      await api.post('/messages/conversation', { propertyId: id })
      toast.success('Conversation started!')
      navigate('/messages')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start conversation')
    }
  }

  const amenityIcons = {
    wifi: <Wifi size={16} />, freeParking: <Car size={16} />, airConditioning: <Wind size={16} />,
    heating: <Flame size={16} />, tv: <Tv size={16} />, kitchen: <Utensils size={16} />
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-80 mb-6" />
      <div className="bg-gray-200 dark:bg-gray-700 h-8 w-2/3 rounded mb-4" />
      <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 rounded" />
    </div>
  )

  if (!property) return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Property not found</div>

  const images = property.images?.length ? property.images : [{ url: 'https://placehold.co/800x500?text=No+Image' }]

  // FIX #9: Compare IDs as strings
  const isOwnProperty = user && property.host?._id &&
    (user.id?.toString() === property.host._id.toString() ||
     user._id?.toString() === property.host._id.toString())

  const fmtDate = (str) => str
    ? new Date(str + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white mb-6 text-sm">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{property.title}</h1>
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
        {property.ratings?.average > 0 && (
          <span className="flex items-center gap-1">
            <Star size={14} className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-white" />
            {property.ratings.average} ({property.ratings.count} reviews)
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {property.location?.city}, {property.location?.state}, {property.location?.country}
        </span>
      </div>

      {/* Images */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-gray-100 dark:bg-gray-700/50">
        <img src={images[imgIdx]?.url} alt={property.title}
          className="w-full h-80 sm:h-96 object-cover"
          onError={e => e.target.src = 'https://placehold.co/800x500?text=No+Image'} />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200"><Users size={16} className="text-rose-500" /> {property.details?.maxGuests} guests</span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200"><Bed   size={16} className="text-rose-500" /> {property.details?.bedrooms} bedrooms</span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200"><Bath  size={16} className="text-rose-500" /> {property.details?.bathrooms} bathrooms</span>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">About this place</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{property.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(property.amenities || {}).filter(([, v]) => v).map(([key]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                  <span className="text-rose-500">{amenityIcons[key] || '✓'}</span>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </div>
              ))}
            </div>
          </div>

          {/* ── Availability Calendar (full-width section) ── */}
          {!isOwnProperty && (
            <div>
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <CalendarDays size={20} className="text-rose-500" /> Availability
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Strikethrough dates are unavailable. Click to select your stay.
              </p>
              <AvailabilityCalendar
                blockedDates={property.blockedDates || []}
                checkIn={booking.checkIn}
                checkOut={booking.checkOut}
                onChange={({ checkIn, checkOut }) => setBooking(b => ({ ...b, checkIn, checkOut }))}
                onClose={() => {}}
              />
            </div>
          )}

          {/* Host */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <img src={property.host?.avatar?.url || 'https://via.placeholder.com/50'} alt={property.host?.name}
              className="w-12 h-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-sm">{property.host?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Host</p>
            </div>
            {user && !isOwnProperty && (
              <button onClick={handleMessage} className="ml-auto flex items-center gap-2 btn-secondary text-sm">
                <MessageCircle size={16} /> Message Host
              </button>
            )}
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                <Star size={18} className="inline fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-white mr-1" />
                {property.ratings?.average} · {reviews.length} reviews
              </h2>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="border-b border-gray-100 dark:border-gray-700/50 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={r.guest?.avatar?.url || 'https://via.placeholder.com/40'} alt={r.guest?.name}
                        className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium">{r.guest?.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-sm">
                        <Star size={13} className="fill-gray-900 dark:fill-gray-100 text-gray-900 dark:text-white" />
                        {r.ratings?.overall}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>
                    {r.hostResponse?.comment && (
                      <div className="mt-3 pl-3 border-l-2 border-rose-200 bg-rose-50 rounded-r-lg py-2 pr-2">
                        <p className="text-xs font-medium text-rose-600 mb-1">Host response:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{r.hostResponse.comment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Sticky Booking Card ── */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <div className="mb-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{property.pricing?.basePrice?.toLocaleString()}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm"> /night</span>
            </div>

            {isOwnProperty ? (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                This is your property
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-3">

                {/* Date selector button */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dates</label>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(v => !v)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      showCalendar
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/10 text-rose-600'
                        : booking.checkIn
                        ? 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800'
                        : 'border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 hover:border-rose-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <CalendarDays size={15} className={booking.checkIn ? 'text-rose-500' : 'text-gray-400'} />
                      {booking.checkIn && booking.checkOut
                        ? `${fmtDate(booking.checkIn)} → ${fmtDate(booking.checkOut)}`
                        : booking.checkIn
                        ? `${fmtDate(booking.checkIn)} → Pick check-out`
                        : 'Select dates'}
                    </span>
                    {booking.checkIn ? (
                      <X size={13} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        onClick={e => { e.stopPropagation(); setBooking(b => ({ ...b, checkIn: '', checkOut: '' })) }} />
                    ) : (
                      <ChevronRight size={13} className="text-gray-400" />
                    )}
                  </button>

                  {/* Inline calendar popup in booking card */}
                  {showCalendar && (
                    <AvailabilityCalendar
                      blockedDates={property.blockedDates || []}
                      checkIn={booking.checkIn}
                      checkOut={booking.checkOut}
                      onChange={({ checkIn, checkOut }) => setBooking(b => ({ ...b, checkIn, checkOut }))}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Guests</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 dark:text-gray-500">Adults</label>
                      <input type="number" min="1" max={property.details?.maxGuests} className="input-field text-sm"
                        value={booking.adults} onChange={e => setBooking({ ...booking, adults: Number(e.target.value) })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 dark:text-gray-500">Children</label>
                      <input type="number" min="0" className="input-field text-sm"
                        value={booking.children} onChange={e => setBooking({ ...booking, children: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={bookingLoading} className="btn-primary w-full py-3">
                  {bookingLoading ? 'Booking...' : 'Reserve'}
                </button>

                {pendingBookingRestored && (
                  <p className="text-xs text-center text-rose-500 font-medium mt-1">
                    ✅ Your saved booking details are pre-filled!
                  </p>
                )}
              </form>
            )}

            {/* Price breakdown */}
            {!isOwnProperty && priceCalc && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 text-sm space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>₹{priceCalc.basePrice.toLocaleString()} × {priceCalc.nights} night{priceCalc.nights > 1 ? 's' : ''}</span>
                  <span>₹{priceCalc.subtotal.toLocaleString()}</span>
                </div>
                {priceCalc.weeklyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Weekly discount</span><span>−₹{priceCalc.weeklyDiscount.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.monthlyDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Monthly discount</span><span>−₹{priceCalc.monthlyDiscount.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.cleaningFee > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Cleaning fee</span><span>₹{priceCalc.cleaningFee.toLocaleString()}</span>
                  </div>
                )}
                {priceCalc.serviceFee > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Service fee</span><span>₹{priceCalc.serviceFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700/50">
                  <span>Total</span><span>₹{priceCalc.total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">You won't be charged yet</p>
          </div>
        </div>

      </div>
    </div>
  )
}
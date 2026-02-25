import { Link } from 'react-router-dom'
import { Star, MapPin, Heart } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function PropertyCard({ property }) {
  const { user }              = useAuth()
  const [liked, setLiked]     = useState(false)
  const [toggling, setToggling] = useState(false)

  const image = property.images?.[0]?.url || property.primaryImage || 'https://placehold.co/400x280?text=No+Image'

  const handleFavorite = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Please login to save favorites'); return }
    setToggling(true)
    try {
      const res    = await api.post(`/favorites/${property._id}/toggle`)
      const action = res.data.data.action
      setLiked(action === 'added')
      toast.success(action === 'added' ? 'Added to favorites ❤️' : 'Removed from favorites')
    } catch { toast.error('Something went wrong') }
    finally  { setToggling(false) }
  }

  return (
    <Link to={`/property/${property._id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={image}
          alt={property.title}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300 bg-gray-100"
          onError={e => e.target.src = 'https://placehold.co/400x280?text=No+Image'}
        />
        <button
          onClick={handleFavorite}
          disabled={toggling}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow"
        >
          <Heart size={17} className={liked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} />
        </button>
        {property.instantBooking && (
          <span className="absolute top-3 left-3 bg-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            ⚡ Instant Book
          </span>
        )}
      </div>

      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-rose-500 transition-colors">
            {property.title}
          </h3>
          {property.ratings?.average > 0 && (
            <span className="flex items-center gap-1 shrink-0 text-sm">
              <Star size={13} className="fill-gray-900 text-gray-900" />
              {property.ratings.average}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{property.location?.city}, {property.location?.state}</span>
        </div>
        <p className="text-sm text-gray-500">
          {property.details?.bedrooms} bed · {property.details?.bathrooms} bath · up to {property.details?.maxGuests} guests
        </p>
        <p className="text-sm pt-0.5">
          <span className="font-semibold text-gray-900">₹{property.pricing?.basePrice?.toLocaleString()}</span>
          <span className="text-gray-500"> /night</span>
        </p>
      </div>
    </Link>
  )
}
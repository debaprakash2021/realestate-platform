import { useState } from 'react'
import { Star, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { key: 'cleanliness',   label: 'Cleanliness' },
  { key: 'accuracy',      label: 'Accuracy' },
  { key: 'communication', label: 'Communication' },
  { key: 'location',      label: 'Location' },
  { key: 'checkIn',       label: 'Check-in' },
  { key: 'value',         label: 'Value' }
]

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="focus:outline-none"
      >
        <Star
          size={20}
          className={n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        />
      </button>
    ))}
  </div>
)

export default function ReviewForm({ booking, onClose, onSubmitted }) {
  const [ratings, setRatings] = useState({
    overall: 5, cleanliness: 5, accuracy: 5,
    communication: 5, location: 5, checkIn: 5, value: 5
  })
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const setRating = (key, val) => setRatings(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (comment.trim().length < 10) { toast.error('Comment must be at least 10 characters'); return }
    setLoading(true)
    try {
      await api.post('/reviews', { bookingId: booking._id, ratings, comment })
      toast.success('Review submitted! ⭐')
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div>
            <h2 className="text-lg font-bold">Leave a Review</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{booking.property?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Overall Rating *</label>
            <StarRating value={ratings.overall} onChange={v => setRating('overall', v)} />
          </div>

          {/* Category Ratings */}
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <StarRating value={ratings[key]} onChange={v => setRating(key, v)} />
              </div>
            ))}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Your Review * <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(min 10 characters)</span>
            </label>
            <textarea
              rows={4}
              className="input-field resize-none"
              placeholder="How was your stay? Describe the property, host, and overall experience..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              minLength={10}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{comment.length}/1000</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Submitting...' : 'Submit Review ⭐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
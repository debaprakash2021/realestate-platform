import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, MapPin, DollarSign, Settings, CheckSquare, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const AMENITIES = ['wifi', 'kitchen', 'airConditioning', 'heating', 'freeParking', 'pool', 'tv', 'washer', 'hotTub', 'bbqGrill', 'petsAllowed', 'smokingAllowed']

const steps = ['Basic Info', 'Location', 'Pricing', 'Details', 'Amenities']

export default function CreateProperty() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', propertyType: 'apartment', roomType: 'entire_place',
    location: { address: '', city: '', state: '', country: 'India', zipCode: '', coordinates: { type: 'Point', coordinates: [0, 0] } },
    pricing: { basePrice: '', currency: 'INR', cleaningFee: '', serviceFee: '', weeklyDiscount: 0, monthlyDiscount: 0 },
    details: { bedrooms: 1, bathrooms: 1, beds: 1, maxGuests: 2 },
    amenities: { wifi: false, kitchen: false, airConditioning: false, heating: false, freeParking: false, pool: false, tv: false, washer: false, hotTub: false, bbqGrill: false, petsAllowed: false, smokingAllowed: false },
    cancellationPolicy: 'flexible', instantBooking: true
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const setNested = (parent, field, value) => setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await api.post('/properties', form)
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create property')
    } finally { setLoading(false) }
  }

  const stepIcons = [<Home size={16} />, <MapPin size={16} />, <DollarSign size={16} />, <Settings size={16} />, <CheckSquare size={16} />]

  // ── Pending Approval Success Screen ──────────────────────────────
  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="card p-10">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={38} className="text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Submitted for Review! 🎉</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Your property <span className="font-semibold text-gray-800 dark:text-gray-100">"{form.title}"</span> has been
          submitted and is now <span className="font-semibold text-amber-600">pending admin approval</span>.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Your listing has been received and saved.</p>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">An admin will review it shortly (usually within 24 hours).</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={15} className="text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">You'll get a notification once it's approved or if any changes are needed.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/host/properties')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            View My Properties <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/host/dashboard')}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">List a Property</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Fill in the details to list your property</p>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${i === step ? 'bg-rose-500 text-white' : i < step ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                }`}>
              {stepIcons[i]} <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <div className={`h-0.5 w-4 sm:w-8 mx-1 ${i < step ? 'bg-rose-300' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6">

        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Property Title *</label>
              <input type="text" className="input-field" placeholder="e.g. Cozy Beach Villa in Goa"
                value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description *</label>
              <textarea rows={4} className="input-field resize-none" placeholder="Describe your property..."
                value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Property Type</label>
                <select className="input-field" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                  {['apartment', 'house', 'villa', 'cabin', 'cottage', 'studio', 'hostel'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Room Type</label>
                <select className="input-field" value={form.roomType} onChange={e => set('roomType', e.target.value)}>
                  <option value="entire_place">Entire Place</option>
                  <option value="private_room">Private Room</option>
                  <option value="shared_room">Shared Room</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Location</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Street Address *</label>
              <input type="text" className="input-field" placeholder="123 Beach Road"
                value={form.location.address} onChange={e => setNested('location', 'address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">City *</label>
                <input type="text" className="input-field" placeholder="Goa"
                  value={form.location.city} onChange={e => setNested('location', 'city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">State *</label>
                <input type="text" className="input-field" placeholder="Goa"
                  value={form.location.state} onChange={e => setNested('location', 'state', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Country</label>
                <input type="text" className="input-field" value={form.location.country}
                  onChange={e => setNested('location', 'country', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">ZIP Code</label>
                <input type="text" className="input-field" placeholder="403516"
                  value={form.location.zipCode} onChange={e => setNested('location', 'zipCode', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Pricing</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Base Price per Night (₹) *</label>
              <input type="number" className="input-field" placeholder="e.g. 3500"
                value={form.pricing.basePrice} onChange={e => setNested('pricing', 'basePrice', Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Cleaning Fee (₹)</label>
                <input type="number" className="input-field" placeholder="0"
                  value={form.pricing.cleaningFee} onChange={e => setNested('pricing', 'cleaningFee', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Service Fee (₹)</label>
                <input type="number" className="input-field" placeholder="0"
                  value={form.pricing.serviceFee} onChange={e => setNested('pricing', 'serviceFee', Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Weekly Discount (%)</label>
                <input type="number" min="0" max="50" className="input-field"
                  value={form.pricing.weeklyDiscount} onChange={e => setNested('pricing', 'weeklyDiscount', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Monthly Discount (%)</label>
                <input type="number" min="0" max="50" className="input-field"
                  value={form.pricing.monthlyDiscount} onChange={e => setNested('pricing', 'monthlyDiscount', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[['bedrooms', 'Bedrooms'], ['bathrooms', 'Bathrooms'], ['beds', 'Beds'], ['maxGuests', 'Max Guests']].map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{l}</label>
                  <input type="number" min="1" className="input-field" value={form.details[f]}
                    onChange={e => setNested('details', f, Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Cancellation Policy</label>
                <select className="input-field" value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)}>
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-rose-500"
                    checked={form.instantBooking} onChange={e => set('instantBooking', e.target.checked)} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">⚡ Instant Booking</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Amenities */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map(a => (
                <label key={a} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${form.amenities[a] ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600'
                  }`}>
                  <input type="checkbox" className="hidden" checked={form.amenities[a]}
                    onChange={e => setForm(prev => ({ ...prev, amenities: { ...prev.amenities, [a]: e.target.checked } }))} />
                  {a.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700/50">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">← Back</button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary px-8">
              {loading ? 'Listing...' : '🚀 List Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
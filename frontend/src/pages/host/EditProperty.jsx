import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Home, MapPin, DollarSign, Settings, CheckSquare, ArrowLeft, Upload, Trash2 } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const AMENITIES = ['wifi','kitchen','airConditioning','heating','freeParking','pool','tv','washer','hotTub','bbqGrill','petsAllowed','smokingAllowed']
const steps = ['Basic Info', 'Location', 'Pricing', 'Details', 'Amenities']

export default function EditProperty() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const [step, setStep]     = useState(0)
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(r => {
        const p = r.data.data
        setForm({
          title:       p.title || '',
          description: p.description || '',
          propertyType: p.propertyType || 'apartment',
          roomType:     p.roomType || 'entire_place',
          status:       p.status || 'active',
          location: {
            address:     p.location?.address || '',
            city:        p.location?.city || '',
            state:       p.location?.state || '',
            country:     p.location?.country || 'India',
            zipCode:     p.location?.zipCode || '',
            coordinates: p.location?.coordinates || { type: 'Point', coordinates: [0, 0] }
          },
          pricing: {
            basePrice:       p.pricing?.basePrice || '',
            currency:        p.pricing?.currency || 'INR',
            cleaningFee:     p.pricing?.cleaningFee || '',
            serviceFee:      p.pricing?.serviceFee || '',
            weeklyDiscount:  p.pricing?.weeklyDiscount || 0,
            monthlyDiscount: p.pricing?.monthlyDiscount || 0
          },
          details: {
            bedrooms:  p.details?.bedrooms || 1,
            bathrooms: p.details?.bathrooms || 1,
            beds:      p.details?.beds || 1,
            maxGuests: p.details?.maxGuests || 2
          },
          amenities: {
            wifi: false, kitchen: false, airConditioning: false, heating: false,
            freeParking: false, pool: false, tv: false, washer: false,
            hotTub: false, bbqGrill: false, petsAllowed: false, smokingAllowed: false,
            ...(p.amenities || {})
          },
          images:             p.images || [],
          cancellationPolicy: p.cancellationPolicy || 'flexible',
          instantBooking:     p.instantBooking ?? true
        })
      })
      .catch(() => { toast.error('Property not found'); navigate('/host/properties') })
      .finally(() => setFetching(false))
  }, [id])

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const setNested = (parent, field, value) => setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }))

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put(`/properties/${id}`, form)
      toast.success('Property updated! 🎉')
      navigate('/host/properties')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update property')
    } finally { setLoading(false) }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadLoading(true)
    const formData = new FormData()
    files.forEach(f => formData.append('images', f))
    try {
      const res = await api.post(`/upload/property/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setForm(prev => ({ ...prev, images: res.data.data.images }))
      toast.success('Images uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setUploadLoading(false) }
  }

  const handleDeleteImage = async (publicId) => {
    if (!confirm('Delete this image?')) return
    try {
      await api.delete(`/upload/property/${id}/images/${encodeURIComponent(publicId)}`)
      setForm(prev => ({ ...prev, images: prev.images.filter(img => img.publicId !== publicId) }))
      toast.success('Image deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  if (fetching) return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-16" />)}
      </div>
    </div>
  )

  if (!form) return null

  const stepIcons = [<Home size={16}/>, <MapPin size={16}/>, <DollarSign size={16}/>, <Settings size={16}/>, <CheckSquare size={16}/>]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/host/properties')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm">
        <ArrowLeft size={18} /> Back to Properties
      </button>

      <h1 className="text-2xl font-bold mb-2">Edit Property</h1>
      <p className="text-gray-500 text-sm mb-8">Update your property details</p>

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? 'bg-rose-500 text-white' : i < step ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
              }`}>
              {stepIcons[i]} <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <div className={`h-0.5 w-4 sm:w-8 mx-1 ${i < step ? 'bg-rose-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-6">

        {/* Step 0 — Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 mb-4">Basic Information</h2>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {form.images.map(img => (
                    <div key={img.publicId} className="relative group rounded-lg overflow-hidden">
                      <img src={img.thumbnail || img.url} alt="" className="w-full h-24 object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">Primary</span>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.publicId)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className={`flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-rose-400 transition-colors text-sm text-gray-500 ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} />
                {uploadLoading ? 'Uploading...' : 'Upload more images (up to 10)'}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label>
              <input type="text" className="input-field" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea rows={4} className="input-field resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select className="input-field" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                  {['apartment','house','villa','cabin','cottage','studio','hostel'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 mb-4">Location</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input type="text" className="input-field" value={form.location.address} onChange={e => setNested('location', 'address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" className="input-field" value={form.location.city} onChange={e => setNested('location', 'city', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" className="input-field" value={form.location.state} onChange={e => setNested('location', 'state', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" className="input-field" value={form.location.country} onChange={e => setNested('location', 'country', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input type="text" className="input-field" value={form.location.zipCode} onChange={e => setNested('location', 'zipCode', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 mb-4">Pricing</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price per Night (₹) *</label>
              <input type="number" className="input-field" value={form.pricing.basePrice} onChange={e => setNested('pricing', 'basePrice', Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Fee (₹)</label>
                <input type="number" className="input-field" value={form.pricing.cleaningFee} onChange={e => setNested('pricing', 'cleaningFee', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Fee (₹)</label>
                <input type="number" className="input-field" value={form.pricing.serviceFee} onChange={e => setNested('pricing', 'serviceFee', Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Discount (%)</label>
                <input type="number" min="0" max="50" className="input-field" value={form.pricing.weeklyDiscount} onChange={e => setNested('pricing', 'weeklyDiscount', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Discount (%)</label>
                <input type="number" min="0" max="50" className="input-field" value={form.pricing.monthlyDiscount} onChange={e => setNested('pricing', 'monthlyDiscount', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[['bedrooms','Bedrooms'],['bathrooms','Bathrooms'],['beds','Beds'],['maxGuests','Max Guests']].map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type="number" min="1" className="input-field" value={form.details[f]} onChange={e => setNested('details', f, Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                <select className="input-field" value={form.cancellationPolicy} onChange={e => set('cancellationPolicy', e.target.value)}>
                  <option value="flexible">Flexible</option>
                  <option value="moderate">Moderate</option>
                  <option value="strict">Strict</option>
                </select>
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-rose-500" checked={form.instantBooking} onChange={e => set('instantBooking', e.target.checked)} />
                  <span className="text-sm font-medium text-gray-700">⚡ Instant Booking</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Amenities */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AMENITIES.map(a => (
                <label key={a} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                  form.amenities[a] ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-secondary">← Back</button>
          ) : <div />}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSave} disabled={loading} className="btn-primary px-8">
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
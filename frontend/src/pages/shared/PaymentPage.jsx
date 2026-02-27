import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, Smartphone, Home, ShieldCheck, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const METHODS = [
  {
    id:          'razorpay',
    label:       'Credit / Debit Card',
    subLabel:    'Visa, Mastercard, RuPay & more',
    icon:        <CreditCard size={22} className="text-blue-500" />,
    extra:       null,
    badge:       'Most Popular'
  },
  {
    id:          'upi',
    label:       'UPI',
    subLabel:    'Google Pay, PhonePe, Paytm, BHIM',
    icon:        <Smartphone size={22} className="text-green-500" />,
    extra:       null,
    badge:       'Instant'
  },
  {
    id:          'pay_on_arrival',
    label:       'Pay on Arrival',
    subLabel:    'Pay cash or card when you check in',
    icon:        <Home size={22} className="text-orange-500" />,
    extra:       300,
    badge:       '+₹300 surcharge'
  }
]

export default function PaymentPage() {
  const { bookingId }        = useParams()
  const { user }             = useAuth()
  const navigate             = useNavigate()
  const [booking, setBooking]   = useState(null)
  const [method, setMethod]     = useState('razorpay')
  const [loading, setLoading]   = useState(true)
  const [paying, setPaying]     = useState(false)
  const [paid, setPaid]         = useState(false)

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(r => setBooking(r.data.data))
      .catch(() => { toast.error('Booking not found'); navigate('/my-bookings') })
      .finally(() => setLoading(false))
  }, [bookingId])

  // Dynamically load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return }
      const script    = document.createElement('script')
      script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload   = () => resolve(true)
      script.onerror  = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayWithRazorpay = async () => {
    setPaying(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Failed to load payment gateway. Please try again.'); return }

      // Step 1: Create Razorpay order
      const orderRes = await api.post('/payments/razorpay/create-order', { bookingId, method: 'card' })
      const order    = orderRes.data.data

      // Step 2: Open Razorpay checkout
      const options = {
        key:         order.keyId,
        amount:      order.amount * 100, // in paise
        currency:    'INR',
        name:        'RealEstate',
        description: order.propertyName,
        order_id:    order.orderId,
        prefill: {
          name:    order.guestName,
          email:   order.guestEmail,
          contact: order.guestPhone
        },
        theme: { color: '#f43f5e' },
        handler: async (response) => {
          try {
            // Step 3: Verify payment
            await api.post('/payments/razorpay/verify', {
              bookingId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            setPaid(true)
            toast.success('Payment successful! 🎉')
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => { setPaying(false); toast('Payment cancelled') }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment')
      setPaying(false)
    }
  }

  const handlePayOnArrival = async () => {
    setPaying(true)
    try {
      await api.post('/payments/pay-on-arrival', { bookingId })
      setPaid(true)
      toast.success('Pay on Arrival confirmed! ₹300 surcharge applies.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setPaying(false) }
  }

  const handlePay = () => {
    if (method === 'pay_on_arrival') handlePayOnArrival()
    else handlePayWithRazorpay()
  }

  const totalAmount = booking?.pricing?.totalAmount || 0
  const surcharge   = method === 'pay_on_arrival' ? 300 : 0
  const finalAmount = totalAmount + surcharge

  if (loading) return (
    <div className="max-w-xl mx-auto px-4 py-16 animate-pulse">
      <div className="card h-96" />
    </div>
  )

  if (paid) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="card p-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {method === 'pay_on_arrival' ? 'Booking Confirmed!' : 'Payment Successful!'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">
          {method === 'pay_on_arrival'
            ? `Pay ₹${finalAmount.toLocaleString()} at check-in (includes ₹300 surcharge)`
            : `₹${finalAmount.toLocaleString()} paid successfully`}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">The host has been notified of your booking & payment.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/my-bookings')} className="btn-primary px-8">View My Bookings</button>
          <button onClick={() => navigate('/')} className="btn-secondary">Back to Home</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-100 mb-6 text-sm">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Choose how you'd like to pay for your stay</p>

      {/* Booking Summary */}
      {booking && (
        <div className="card p-4 mb-6 flex gap-4 items-start">
          <img
            src={booking.property?.images?.[0]?.url || 'https://placehold.co/80x80?text=🏠'}
            alt={booking.property?.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{booking.property?.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
              {new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.nights} nights · {booking.guests?.total} guest{booking.guests?.total > 1 ? 's' : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-gray-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">base total</p>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="space-y-3 mb-6">
        {METHODS.map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              method === m.id ? 'border-rose-500 bg-rose-50' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500'
            }`}>
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center shrink-0">
              {m.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{m.label}</p>
                {m.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.id === 'pay_on_arrival' ? 'bg-orange-100 text-orange-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{m.subLabel}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
              method === m.id ? 'border-rose-500 bg-rose-500' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {method === m.id && <div className="w-2 h-2 bg-white dark:bg-gray-900 rounded-full" />}
            </div>
          </button>
        ))}
      </div>

      {/* Pay on Arrival Warning */}
      {method === 'pay_on_arrival' && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
          <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-orange-800">Pay on Arrival — ₹300 surcharge applies</p>
            <p className="text-orange-600 mt-0.5">You'll pay ₹{finalAmount.toLocaleString()} (₹{totalAmount.toLocaleString()} + ₹300) at check-in to the host.</p>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-sm mb-4 text-gray-700 dark:text-gray-200">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>₹{booking?.pricing?.basePrice?.toLocaleString()} × {booking?.nights} nights</span>
            <span>₹{booking?.pricing?.subtotal?.toLocaleString()}</span>
          </div>
          {booking?.pricing?.cleaningFee > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Cleaning fee</span>
              <span>₹{booking.pricing.cleaningFee}</span>
            </div>
          )}
          {booking?.pricing?.serviceFee > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Service fee</span>
              <span>₹{booking.pricing.serviceFee}</span>
            </div>
          )}
          {surcharge > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Pay on Arrival surcharge</span>
              <span>+₹{surcharge}</span>
            </div>
          )}
          <div className="border-t border-gray-100 dark:border-gray-700/50 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span>₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-6">
        <ShieldCheck size={15} className="text-green-500" />
        <span>Your payment is secured with 256-bit SSL encryption. Powered by Razorpay.</span>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePay}
        disabled={paying}
        className="btn-primary w-full py-4 text-base font-semibold"
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <Clock size={18} className="animate-spin" /> Processing...
          </span>
        ) : method === 'pay_on_arrival' ? (
          `Confirm Pay on Arrival — ₹${finalAmount.toLocaleString()}`
        ) : (
          `Pay ₹${finalAmount.toLocaleString()}`
        )}
      </button>
    </div>
  )
}
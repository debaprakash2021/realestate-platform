import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Home, Mail } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

// ─── OTP screen shown when logging in with unverified email ─────
function VerifyOtpPrompt({ email, onBack }) {
  const navigate = useNavigate()
  const { setLoggedIn } = useAuth()
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown]   = useState(0)

  const inputRefs = Array.from({ length: 6 }, () => null)

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds)
    const iv = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(iv); return 0 } return p - 1 }), 1000)
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs[index + 1]?.focus()
    if (value && index === 5 && newOtp.every(d => d)) handleVerify(newOtp.join(''))
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs[index - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(newOtp)
    if (pasted.length === 6) handleVerify(pasted)
    else inputRefs[pasted.length]?.focus()
  }

  const handleVerify = async (code) => {
    if (code.length !== 6) { toast.error('Enter the full 6-digit code'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code })
      const { user } = res.data.data
      setLoggedIn(user, res.data.data.token)
      toast.success('Email verified! Welcome 🎉')
      navigate(user.role === 'host' || user.role === 'admin' ? '/host/dashboard' : '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
      setOtp(['', '', '', '', '', ''])
      inputRefs[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('New code sent!')
      startCooldown(60)
      setOtp(['', '', '', '', '', ''])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend')
    } finally { setResending(false) }
  }

  const otpStr = otp.join('')

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail size={26} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          A verification code was sent to<br />
          <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>
        </p>
      </div>
      <div className="card p-8 space-y-5">
        <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input key={i} ref={el => inputRefs[i] = el}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                digit ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-gray-200 dark:border-gray-600 focus:border-rose-400'
              }`}
            />
          ))}
        </div>
        <button onClick={() => handleVerify(otpStr)} disabled={loading || otpStr.length !== 6}
          className="btn-primary w-full py-3 disabled:opacity-50">
          {loading ? 'Verifying...' : 'Verify & Sign in'}
        </button>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={handleResend} disabled={resending || cooldown > 0}
            className="text-rose-500 hover:underline disabled:text-gray-400 dark:text-gray-500">
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 w-full text-center">
          ← Back to sign in
        </button>
      </div>
    </>
  )
}

// ─── Login Form ──────────────────────────────────────────────────
export default function Login() {
  const { login }       = useAuth()
  const navigate        = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState(null) // triggers OTP screen

  if (unverifiedEmail) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-full max-w-md">
          <VerifyOtpPrompt email={unverifiedEmail} onBack={() => setUnverifiedEmail(null)} />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}! 👋`)
      navigate(user.role === 'host' || user.role === 'admin' ? '/host/dashboard' : '/')
    } catch (err) {
      // Check if backend flagged this as unverified
      const data = err.response?.data
      if (data?.requiresVerification || err.response?.status === 403) {
        toast('Please verify your email first', { icon: '📧' })
        setUnverifiedEmail(data?.email || form.email)
      } else {
        toast.error(data?.message || 'Login failed')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Home size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
              <input type="email" required placeholder="you@example.com" className="input-field"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required placeholder="••••••••" className="input-field pr-10"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose-500 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
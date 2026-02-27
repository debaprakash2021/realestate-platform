import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Home, CheckCircle, XCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

// ─── Password rules (must match backend) ────────────────────────
const RULES = [
  { id: 'len',   label: 'At least 8 characters',              test: p => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)',          test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a–z)',          test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'One number (0–9)',                    test: p => /[0-9]/.test(p) },
  { id: 'spec',  label: 'One special character (@$!%*?&#)',    test: p => /[@$!%*?&#^()_\-+=]/.test(p) },
]

const getStrength = (pw) => {
  const passed = RULES.filter(r => r.test(pw)).length
  if (passed <= 1) return { level: 0, label: 'Very weak',  color: '#ef4444' }
  if (passed === 2) return { level: 1, label: 'Weak',       color: '#f97316' }
  if (passed === 3) return { level: 2, label: 'Fair',       color: '#eab308' }
  if (passed === 4) return { level: 3, label: 'Strong',     color: '#22c55e' }
  return              { level: 4, label: 'Very strong', color: '#16a34a' }
}

const validatePassword = (pw) => {
  const failed = RULES.filter(r => !r.test(pw))
  return failed.length === 0 ? null : failed[0].label
}

// ─── Step 1: Registration Form ───────────────────────────────────
function RegistrationForm({ onSuccess }) {
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'guest' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [pwFocused, setPwFocused] = useState(false)

  const strength = getStrength(form.password)
  const allRulesPassed = RULES.every(r => r.test(form.password))

  const handleSubmit = async (e) => {
    e.preventDefault()

    const pwError = validatePassword(form.password)
    if (pwError) { toast.error(pwError); return }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      const data = res.data.data
      toast.success(`Code sent to ${form.email}!`)
      onSuccess(form.email, form.role)
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      // If already registered but unverified — still proceed to OTP step
      if (err.response?.data?.data?.requiresVerification || msg.includes('OTP has been sent')) {
        toast(msg, { icon: '📧' })
        onSuccess(form.email, form.role)
      } else {
        toast.error(msg)
      }
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Home size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Join thousands of travelers & hosts</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Full Name</label>
            <input type="text" required placeholder="John Doe" className="input-field"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input type="email" required placeholder="you@example.com" className="input-field"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                placeholder="Min 8 chars, uppercase, number, special"
                className="input-field pr-10"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{ background: i <= strength.level ? strength.color : '#e5e7eb' }} />
                  ))}
                </div>
                <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}

            {/* Rules checklist — show when focused or has value */}
            {(pwFocused || form.password) && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1.5">
                {RULES.map(rule => {
                  const ok = rule.test(form.password)
                  return (
                    <div key={rule.id} className="flex items-center gap-2">
                      {ok
                        ? <CheckCircle size={13} className="text-green-500 shrink-0" />
                        : <XCircle    size={13} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      }
                      <span className={`text-xs ${ok ? 'text-green-700 line-through' : 'text-gray-500 dark:text-gray-400'}`}>
                        {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'guest', label: '🏠 Book Stays' },
                { value: 'host',  label: '🏡 List Property' }
              ].map(r => (
                <button key={r.value} type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.role === r.value
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !allRulesPassed}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending verification code...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-rose-500 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </>
  )
}

// ─── Step 2: OTP Verification ────────────────────────────────────
function OtpVerification({ email, role, onBack }) {
  const { setLoggedIn } = useAuth()
  const navigate        = useNavigate()
  const [otp, setOtp]   = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const inputRefs = Array.from({ length: 6 }, () => null)

  // Countdown timer for resend cooldown
  const startCooldown = (seconds = 60) => {
    setCooldown(seconds)
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // only digits
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // take last char if paste
    setOtp(newOtp)
    // Auto-advance
    if (value && index < 5) inputRefs[index + 1]?.focus()
    // Auto-submit when all 6 filled
    if (value && index === 5 && newOtp.every(d => d)) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    pasted.split('').forEach((d, i) => { newOtp[i] = d })
    setOtp(newOtp)
    if (pasted.length === 6) handleVerify(pasted)
    else inputRefs[pasted.length]?.focus()
  }

  const handleVerify = async (code) => {
    if (code.length !== 6) { toast.error('Enter the full 6-digit code'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code })
      const { user, token } = res.data.data
      setLoggedIn(user, token)
      toast.success('Email verified! Welcome aboard 🎉')
      navigate(user.role === 'host' ? '/host/dashboard' : '/')
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
      toast.success('New verification code sent!')
      startCooldown(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code')
    } finally { setResending(false) }
  }

  const otpValue = otp.join('')

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail size={26} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>
        </p>
      </div>

      <div className="card p-8">
        <div className="space-y-6">
          {/* OTP Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                    digit
                      ? 'border-rose-400 bg-rose-50 text-rose-600'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-rose-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Verify button */}
          <button
            onClick={() => handleVerify(otpValue)}
            disabled={loading || otpValue.length !== 6}
            className="btn-primary w-full py-3 disabled:opacity-50"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><RefreshCw size={16} className="animate-spin" /> Verifying...</span>
              : 'Verify Email'
            }
          </button>

          {/* Resend */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm font-medium text-rose-500 hover:underline disabled:text-gray-400 dark:text-gray-500 disabled:no-underline"
            >
              {resending
                ? 'Sending...'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend code'
              }
            </button>
          </div>

          {/* Back */}
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 mx-auto">
            <ArrowLeft size={14} /> Back to registration
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
          Code expires in 10 minutes. Check your spam folder if you don't see it.
        </p>
      </div>
    </>
  )
}

// ─── Main Export ─────────────────────────────────────────────────
export default function Register() {
  const [step, setStep]   = useState('form')   // 'form' | 'otp'
  const [email, setEmail] = useState('')
  const [role,  setRole]  = useState('guest')

  const handleFormSuccess = (registeredEmail, registeredRole) => {
    setEmail(registeredEmail)
    setRole(registeredRole)
    setStep('otp')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-800/50 py-10">
      <div className="w-full max-w-md">
        {step === 'form'
          ? <RegistrationForm onSuccess={handleFormSuccess} />
          : <OtpVerification email={email} role={role} onBack={() => setStep('form')} />
        }
      </div>
    </div>
  )
}